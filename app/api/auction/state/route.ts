import { NextResponse } from 'next/server'
import { kv } from '@/lib/kv'

const STATE_KEY = 'auction:state:v1'

function normName(s: string) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

async function readState() {
  try {
    const json = (await kv.get(STATE_KEY)) as any | null
    const base = json || {}
    const teams: Record<string, { budget: number; players: Array<{ fullName: string; points: number; time: string }> }> = base.teams || {}
    const sold: Record<string, { team: string; points: number; time: string }> = base.sold || {}
    const owners: Record<string, { name: string; playing: boolean }> = base.owners || {}
    const retentions: Record<string, Array<{ fullName: string; time: string }>> = base.retentions || {}
    const unsold: Array<{ fullName: string; time: string }> = base.unsold || []
    return { teams, sold, owners, retentions, unsold }
  } catch {
    return { teams: {}, sold: {} as Record<string, { team: string; points: number; time: string }>, owners: {}, retentions: {}, unsold: [] as Array<{ fullName: string; time: string }>} 
  }
}

async function writeState(state: any) {
  await kv.set(STATE_KEY, state)
}

export async function GET() {
  try {
    const state = await readState()
    // compute spent lazily on return
    const enriched = {
      ...state,
      summary: Object.fromEntries(
        Object.entries(state.teams).map(([name, t]) => {
          const spent = (t.players || []).reduce((acc, p) => acc + (p.points || 0), 0)
          const remaining = (t.budget || 0) - spent
          return [name, { budget: t.budget || 0, spent, remaining, count: (t.players || []).length }]
        })
      ),
    }
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
      state.teams[team].players.push({ fullName, points, time })
      state.sold[key] = { team, points, time }
      // ensure unsold list removes this player if present
      state.unsold = (state.unsold || []).filter(u => normName(u.fullName) !== key)
      await writeState(state)
      return NextResponse.json({ ok: true, state })
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
      return NextResponse.json({ ok: true, state })
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
      return NextResponse.json({ ok: true, state })
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
      return NextResponse.json({ ok: true, state })
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
      return NextResponse.json({ ok: true, state })
    }

    if (action === 'setOwner') {
      const team = String(body.team || '').trim()
      const ownerName = String(body.ownerName || '').trim()
      const playing = Boolean(body.playing)
      if (!team) return NextResponse.json({ error: 'Team required' }, { status: 400 })
      state.owners = state.owners || {}
      state.owners[team] = { name: ownerName, playing }
      await writeState(state)
      return NextResponse.json({ ok: true, state })
    }

    if (action === 'retain') {
      const team = String(body.team || '').trim()
      const fullName = String(body.fullName || '').trim()
      if (!team || !fullName) return NextResponse.json({ error: 'Team and fullName required' }, { status: 400 })
      state.retentions = state.retentions || {}
      const arr = state.retentions[team] || []
      const limit = state.owners?.[team]?.playing ? 1 : 2
      if (arr.length >= limit) {
        return NextResponse.json({ error: `Retention limit reached (${limit}) for ${team}` }, { status: 409 })
      }
      const key = normName(fullName)
      if (arr.some(r => normName(r.fullName) === key)) {
        return NextResponse.json({ error: 'Player already retained' }, { status: 409 })
      }
      arr.push({ fullName, time: new Date().toISOString() })
      state.retentions[team] = arr
      await writeState(state)
      return NextResponse.json({ ok: true, state })
    }

    if (action === 'unsold') {
      const fullName = String(body.fullName || '').trim()
      if (!fullName) return NextResponse.json({ error: 'fullName required' }, { status: 400 })
      const key = normName(fullName)
      if (state.sold[key]) {
        return NextResponse.json({ error: 'Player already sold' }, { status: 409 })
      }
      state.unsold = state.unsold || []
      if (!state.unsold.some(u => normName(u.fullName) === key)) {
        state.unsold.push({ fullName, time: new Date().toISOString() })
      }
      await writeState(state)
      return NextResponse.json({ ok: true, state })
    }

    if (action === 'clearUnsold') {
      state.unsold = []
      await writeState(state)
      return NextResponse.json({ ok: true, state })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to update auction state', details: e?.message ?? String(e) }, { status: 500 })
  }
}
