import { NextResponse } from 'next/server'
import { kv } from '@/lib/kv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STATE_KEY = 'auction:state:v1'

function normName(s: string) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

async function readState() {
  try {
    const json = (await kv.get(STATE_KEY)) as any | null
    const base = json || {}
    const teams: Record<string, { budget: number; players: Array<{ fullName: string; points: number; time: string }>; reserveWallet?: number; floatingWallet?: number }> = base.teams || {}
    const sold: Record<string, { team: string; points: number; time: string }> = base.sold || {}
    const owners: Record<string, { name: string; playing: boolean }> = base.owners || {}
    const retentions: Record<string, Array<{ fullName: string; time: string }>> = base.retentions || {}
    const unsold: Array<{ fullName: string; time: string; rounds?: number; unassigned?: boolean }> = base.unsold || []
    const currentPick: { fullName: string; time: string } | null = base.currentPick || null
    return { teams, sold, owners, retentions, unsold, currentPick }
  } catch {
    return { teams: {}, sold: {} as Record<string, { team: string; points: number; time: string }>, owners: {}, retentions: {}, unsold: [] as Array<{ fullName: string; time: string; rounds?: number; unassigned?: boolean }>, currentPick: null } 
  }
}

async function writeState(state: any) {
  await kv.set(STATE_KEY, state)
}

function calculateWallets(team: string, state: any) {
  const retentionCount = (state.retentions?.[team] || []).length
  const reserveWallet = retentionCount === 2 ? 900 : retentionCount === 1 ? 1000 : 1100
  const totalBudget = state.teams[team]?.budget || 0
  const floatingWallet = totalBudget - reserveWallet
  return { reserveWallet, floatingWallet }
}

async function fetchRegistrations(): Promise<any[]> {
  try {
    const regRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/registrations/sorted`, { cache: 'no-store' })
    if (regRes.ok) {
      const regJson = await regRes.json()
      return regJson.data || []
    }
  } catch (e) {
    console.error('Failed to fetch registrations for base fee calculation:', e)
  }
  return []
}

function enrichStateWithSummary(state: any, registrations?: any[]) {
  return {
    ...state,
    summary: Object.fromEntries(
      Object.entries(state.teams).map(([name, t]: [string, any]) => {
        const spent = (t.players || []).reduce((acc: number, p: any) => acc + (p.points || 0), 0)
        const wallets = calculateWallets(name, state)
        const playerCount = (t.players || []).length
        const reserveUsed = Math.min(playerCount * 100, wallets.reserveWallet)
        const floatingUsed = spent - reserveUsed
        
        // Calculate base fee for retentions (NOT deducted from wallets, separate from wallet system)
        let baseFee = 0
        if (registrations && Array.isArray(registrations)) {
          const regIndex = new Map(registrations.map((r: any) => [
            String(r.fullName || '').toLowerCase().replace(/\s+/g, ' ').trim(),
            r
          ]))
          baseFee = (state.retentions?.[name] || []).reduce((acc: number, r: any) => {
            const reg = regIndex.get(String(r.fullName || '').toLowerCase().replace(/\s+/g, ' ').trim())
            const age = typeof reg?.age === 'number' ? reg.age : parseInt(String(reg?.age ?? ''), 10)
            if (Number.isFinite(age) && age >= 35) return acc + 1000
            return acc + 2500
          }, 0)
        }
        
        const reserveRemaining = wallets.reserveWallet - reserveUsed
        const floatingRemaining = wallets.floatingWallet - floatingUsed
        const remaining = (t.budget || 0) - spent - baseFee
        
        return [name, { 
          budget: t.budget || 0, 
          spent, 
          remaining, 
          count: playerCount,
          reserveWallet: wallets.reserveWallet,
          floatingWallet: wallets.floatingWallet,
          reserveUsed,
          floatingUsed,
          reserveRemaining,
          floatingRemaining,
          baseFee
        }]
      })
    ),
  }
}

export async function GET() {
  try {
    const state = await readState()
    const registrations = await fetchRegistrations()
    const enriched = enrichStateWithSummary(state, registrations)
    return NextResponse.json(enriched)
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to read auction state', details: e?.message ?? String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const action = body?.action
    const state = await readState()

    if (action === 'sell') {
      const fullName = String(body.fullName || '').trim()
      const team = String(body.team || '').trim()
      const points = Number(body.points)
      if (!fullName || !team || !Number.isFinite(points) || points < 0) {
        return NextResponse.json({ error: 'Invalid sell payload' }, { status: 400 })
      }
      const key = normName(fullName)
      const time = new Date().toISOString()
      if (!state.teams[team]) state.teams[team] = { budget: 0, players: [] }
      // prevent duplicate sale
      if (state.sold[key]) {
        return NextResponse.json({ error: 'Player already sold' }, { status: 409 })
      }
      
      // Calculate wallet constraints
      const wallets = calculateWallets(team, state)
      const currentPlayers = (state.teams[team].players || []).length
      const reserveUsed = Math.min(currentPlayers * 100, wallets.reserveWallet)
      const floatingUsed = (state.teams[team].players || []).reduce((acc, p) => acc + (p.points || 0), 0) - reserveUsed
      const reserveRemaining = wallets.reserveWallet - reserveUsed
      const floatingRemaining = wallets.floatingWallet - floatingUsed
      
      // Validate purchase: 
      // If reserve wallet has capacity, use 100 from reserve and (points - 100) from floating
      // If reserve wallet is depleted, use full points from floating wallet
      let reserveNeeded = 0
      let floatingNeeded = 0
      
      if (reserveRemaining >= 100) {
        // Reserve wallet has capacity - use standard allocation
        reserveNeeded = 100
        floatingNeeded = Math.max(0, points - 100)
      } else if (reserveRemaining > 0) {
        // Reserve wallet partially depleted - use what's left from reserve, rest from floating
        reserveNeeded = reserveRemaining
        floatingNeeded = points - reserveRemaining
      } else {
        // Reserve wallet fully depleted - use full amount from floating
        reserveNeeded = 0
        floatingNeeded = points
      }
      
      if (reserveNeeded > reserveRemaining) {
        return NextResponse.json({ 
          error: `Insufficient reserve wallet. Need ${reserveNeeded}, have ${reserveRemaining}.` 
        }, { status: 400 })
      }
      
      if (floatingNeeded > floatingRemaining) {
        return NextResponse.json({ 
          error: `Insufficient floating wallet. Need ${floatingNeeded}, have ${floatingRemaining}.` 
        }, { status: 400 })
      }
      
      state.teams[team].players.push({ fullName, points, time })
      state.sold[key] = { team, points, time }
      // ensure unsold list removes this player if present
      state.unsold = (state.unsold || []).filter(u => normName(u.fullName) !== key)
      // clear current pick after sale
      state.currentPick = null
      await writeState(state)
      const registrations = await fetchRegistrations()
      return NextResponse.json({ ok: true, state: enrichStateWithSummary(state, registrations) })
    }

    if (action === 'unsell') {
      const fullName = String(body.fullName || '').trim()
      const key = normName(fullName)
      const sale = state.sold[key]
      if (!sale) return NextResponse.json({ error: 'Player not sold' }, { status: 404 })
      const team = sale.team
      state.teams[team].players = (state.teams[team].players || []).filter(p => normName(p.fullName) !== key)
      delete state.sold[key]
      await writeState(state)
      const registrations = await fetchRegistrations()
      return NextResponse.json({ ok: true, state: enrichStateWithSummary(state, registrations) })
    }

    if (action === 'updatePoints') {
      const team = String(body.team || '').trim()
      const fullName = String(body.fullName || '').trim()
      const points = Number(body.points)
      if (!team || !fullName || !Number.isFinite(points) || points < 0) {
        return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 })
      }
      if (!state.teams[team]) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
      const key = normName(fullName)
      let found = false
      state.teams[team].players = (state.teams[team].players || []).map(p => {
        if (normName(p.fullName) === key) { found = true; return { ...p, points } }
        return p
      })
      if (!found) return NextResponse.json({ error: 'Player not found in team' }, { status: 404 })
      if (state.sold[key]) state.sold[key].points = points
      await writeState(state)
      const registrations = await fetchRegistrations()
      return NextResponse.json({ ok: true, state: enrichStateWithSummary(state, registrations) })
    }

    if (action === 'setTeams') {
      const teams: Array<{ name: string; budget: number }> = Array.isArray(body.teams) ? body.teams : []
      for (const t of teams) {
        const name = String(t.name || '').trim()
        const budget = Number(t.budget)
        if (!name || !Number.isFinite(budget) || budget < 0) continue
        if (!state.teams[name]) state.teams[name] = { budget, players: [] }
        state.teams[name].budget = budget
      }
      await writeState(state)
      const registrations = await fetchRegistrations()
      return NextResponse.json({ ok: true, state: enrichStateWithSummary(state, registrations) })
    }

    if (action === 'setBudget') {
      const name = String(body.name || '').trim()
      const budget = Number(body.budget)
      if (!name || !Number.isFinite(budget) || budget < 0) {
        return NextResponse.json({ error: 'Invalid budget payload' }, { status: 400 })
      }
      if (!state.teams[name]) state.teams[name] = { budget, players: [] }
      state.teams[name].budget = budget
      await writeState(state)
      const registrations = await fetchRegistrations()
      return NextResponse.json({ ok: true, state: enrichStateWithSummary(state, registrations) })
    }

    if (action === 'setOwner') {
      const team = String(body.team || '').trim()
      const ownerName = String(body.ownerName || '').trim()
      const playing = Boolean(body.playing)
      if (!team) return NextResponse.json({ error: 'Team required' }, { status: 400 })
      state.owners = state.owners || {}
      state.owners[team] = { name: ownerName, playing }
      await writeState(state)
      const registrations = await fetchRegistrations()
      return NextResponse.json({ ok: true, state: enrichStateWithSummary(state, registrations) })
    }

    if (action === 'retain') {
      const team = String(body.team || '').trim()
      const fullName = String(body.fullName || '').trim()
      if (!team || !fullName) return NextResponse.json({ error: 'Team and fullName required' }, { status: 400 })
      state.retentions = state.retentions || {}
      // Do not allow retaining the owner if they are marked as not playing
      const owner = (state.owners || {})[team]
      if (owner && owner.name && owner.playing === false) {
        const keyOwner = normName(owner.name)
        const keyReq = normName(fullName)
        if (keyOwner === keyReq) {
          return NextResponse.json({ error: 'Owner not playing cannot be retained' }, { status: 409 })
        }
      }
      const arr = state.retentions[team] || []
      const limit = 2
      if (arr.length >= limit) {
        return NextResponse.json({ error: `Retention limit reached (${limit}) for ${team}` }, { status: 409 })
      }
      const key = normName(fullName)
      // Prevent same player being retained across multiple teams
      const alreadyRetainedElsewhere = Object.entries(state.retentions)
        .some(([t, a]) => t !== team && (a || []).some(r => normName(r.fullName) === key))
      if (alreadyRetainedElsewhere) {
        return NextResponse.json({ error: 'Player already retained by another team' }, { status: 409 })
      }
      if (arr.some(r => normName(r.fullName) === key)) {
        return NextResponse.json({ error: 'Player already retained' }, { status: 409 })
      }
      arr.push({ fullName, time: new Date().toISOString() })
      state.retentions[team] = arr
      await writeState(state)
      const registrations = await fetchRegistrations()
      return NextResponse.json({ ok: true, state: enrichStateWithSummary(state, registrations) })
    }

    if (action === 'unsold') {
      const fullName = String(body.fullName || '').trim()
      if (!fullName) return NextResponse.json({ error: 'fullName required' }, { status: 400 })
      const key = normName(fullName)
      if (state.sold[key]) {
        return NextResponse.json({ error: 'Player already sold' }, { status: 409 })
      }
      state.unsold = state.unsold || []
      const idx = state.unsold.findIndex(u => normName(u.fullName) === key)
      if (idx === -1) {
        state.unsold.push({ fullName, time: new Date().toISOString(), rounds: 1, unassigned: false })
      } else {
        const existing = state.unsold[idx]
        const rounds = Math.max(1, Number(existing.rounds || 1)) + 1
        state.unsold[idx] = { ...existing, rounds, time: new Date().toISOString() }
      }
      // clear current pick after marking unsold
      state.currentPick = null
      await writeState(state)
      const registrations = await fetchRegistrations()
      return NextResponse.json({ ok: true, state: enrichStateWithSummary(state, registrations) })
    }

    if (action === 'markUnassigned') {
      const fullName = String(body.fullName || '').trim()
      if (!fullName) return NextResponse.json({ error: 'fullName required' }, { status: 400 })
      const key = normName(fullName)
      const i = (state.unsold || []).findIndex(u => normName(u.fullName) === key)
      if (i === -1) return NextResponse.json({ error: 'Player not in unsold queue' }, { status: 404 })
      const existing = state.unsold[i]
      state.unsold[i] = { ...existing, unassigned: true, time: new Date().toISOString(), rounds: Math.max(1, Number(existing.rounds || 1)) }
      await writeState(state)
      const registrations = await fetchRegistrations()
      return NextResponse.json({ ok: true, state: enrichStateWithSummary(state, registrations) })
    }

    if (action === 'clearUnsold') {
      state.unsold = []
      await writeState(state)
      const registrations = await fetchRegistrations()
      return NextResponse.json({ ok: true, state: enrichStateWithSummary(state, registrations) })
    }

    if (action === 'setCurrentPick') {
      const fullName = String(body.fullName || '').trim()
      if (!fullName) return NextResponse.json({ error: 'fullName required' }, { status: 400 })
      state.currentPick = { fullName, time: new Date().toISOString() }
      await writeState(state)
      const registrations = await fetchRegistrations()
      return NextResponse.json({ ok: true, state: enrichStateWithSummary(state, registrations) })
    }

    if (action === 'clearCurrentPick') {
      state.currentPick = null
      await writeState(state)
      const registrations = await fetchRegistrations()
      return NextResponse.json({ ok: true, state: enrichStateWithSummary(state, registrations) })
    }

    if (action === 'reset') {
      const empty = { teams: {}, sold: {} as Record<string, { team: string; points: number; time: string }>, owners: {}, retentions: {}, unsold: [] as Array<{ fullName: string; time: string }>, currentPick: null } 
      await writeState(empty)
      const registrations = await fetchRegistrations()
      return NextResponse.json({ ok: true, state: enrichStateWithSummary(empty, registrations) })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to update auction state', details: e?.message ?? String(e) }, { status: 500 })
  }
}
