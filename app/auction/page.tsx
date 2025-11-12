'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'

type Registration = {
  fullName: string
  age: string | number | null
  contact: string | null
  playingStyle: string | null
  tshirtSize: string | null
  photoUrl: string | null
  auctionGroup?: string | null
  auctionAgeCategory?: string | null
  auctionPoints?: number | null
  auctionTeam?: string | null
}

type AuctionState = {
  teams: Record<string, { budget: number; players: Array<{ fullName: string; points: number; time: string }> }>
  sold: Record<string, { team: string; points: number; time: string }>
  summary: Record<string, { budget: number; spent: number; remaining: number; count: number }>
  owners?: Record<string, { name: string; playing: boolean }>
  retentions?: Record<string, Array<{ fullName: string; time: string }>>
  unsold?: Array<{ fullName: string; time: string; rounds?: number; unassigned?: boolean }>
}

function norm(s: string) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

// Google Drive helpers (same logic as registrations page)
const extractDriveId = (url: string): string | null => {
  if (!url) return null
  try {
    const m1 = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
    if (m1 && m1[1]) return m1[1]
    const u = new URL(url)
    const id = u.searchParams.get('id')
    if (id) return id
    const m2 = url.match(/[?&]id=([^&]+)/)
    if (m2 && m2[1]) return m2[1]
    return null
  } catch {
    return null
  }
}

const driveThumbUrl = (url: string): string => {
  const id = extractDriveId(url)
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w200` : url
}

const driveViewUrl = (url: string): string => {
  const id = extractDriveId(url)
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url
}

export default function AuctionPage() {
  const [auth, setAuth] = useState<boolean>(false)
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')

  const [regs, setRegs] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [state, setState] = useState<AuctionState | null>(null)
  const [teamsInput, setTeamsInput] = useState('SR Rangers, KT Lions, Power Hitters, Falcon Giants, Parshv Panthers, Chandralok Warriors, Gladiators Cricket Club, Toxic 11')
  const [budgetInput, setBudgetInput] = useState<number>(10000)

  const [picked, setPicked] = useState<Registration | null>(null)
  const [pickedAnimating, setPickedAnimating] = useState(false)
  const [sellTeam, setSellTeam] = useState('')
  const [sellPoints, setSellPoints] = useState<number | ''>('')
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [useUnsoldPool, setUseUnsoldPool] = useState(false)
  const [retainTeam, setRetainTeam] = useState('')
  const [retainPlayer, setRetainPlayer] = useState('')
  const [ownerTeam, setOwnerTeam] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerPlaying, setOwnerPlaying] = useState(false)
  const [activeTab, setActiveTab] = useState<'init'|'owners'|'auction'|'budgets'>('auction')
  const [imgLoaded, setImgLoaded] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [photoSrc, setPhotoSrc] = useState<string>('')
  const [photoAlt, setPhotoAlt] = useState<string>('')
  const [zoom, setZoom] = useState<number>(1)
  const [tx, setTx] = useState<number>(0)
  const [ty, setTy] = useState<number>(0)
  const [panning, setPanning] = useState<boolean>(false)
  const [last, setLast] = useState<{ x: number; y: number } | null>(null)

  // aux data for showing previous seasons stats
  const [mapping, setMapping] = useState<any | null>(null)
  const [stats2024, setStats2024] = useState<Record<string, any[]>>({})
  const [stats2023, setStats2023] = useState<Record<string, any[]>>({})

  useEffect(() => {
    const saved = localStorage.getItem('auction_admin')
    if (saved === '1') setAuth(true)
  }, [])

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [rRes, sRes] = await Promise.all([
        fetch('/api/registrations', { cache: 'no-store' }),
        fetch('/api/auction/state', { cache: 'no-store' }),
      ])
      const rJson = await rRes.json()
      if (!rRes.ok) throw new Error(rJson?.error || 'Failed to load registrations')
      setRegs(rJson.data || [])
      const sJson = await sRes.json()
      if (!sRes.ok) throw new Error(sJson?.error || 'Failed to load auction state')
      setState(sJson)
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (auth) loadAll() }, [auth])

  // Lazy-load mapping and CSVs when a player is picked the first time
  const ensureAuxData = async () => {
    try {
      if (!mapping) {
        const res = await fetch('/data/name_mapping.json', { cache: 'no-store' })
        setMapping(res.ok ? await res.json() : {})
      }
    } catch { setMapping({}) }
    const loadCsv = async (path: string) => {
      const text = await (await fetch(path, { cache: 'no-store' })).text()
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
      return (parsed.data as any[])
    }
    const categories = ['batting','bowling','fielding'] as const
    for (const cat of categories) {
      if (!stats2024[cat]) {
        try { const rows = await loadCsv(`/data/1243558_${cat}_leaderboard.csv`); setStats2024(prev => ({ ...prev, [cat]: rows })) } catch { setStats2024(prev => ({ ...prev, [cat]: [] })) }
      }
      if (!stats2023[cat]) {
        try { const rows = await loadCsv(`/data/840910_${cat}_leaderboard.csv`); setStats2023(prev => ({ ...prev, [cat]: rows })) } catch { setStats2023(prev => ({ ...prev, [cat]: [] })) }
      }
    }
  }

  useEffect(() => { if (picked) { void ensureAuxData() } }, [picked])

  const matchedStats = useMemo(() => {
    if (!picked) return { batting: { y2024: [], y2023: [] }, bowling: { y2024: [], y2023: [] }, fielding: { y2024: [], y2023: [] } }
    const selectedName = picked.fullName
    const map = mapping || {}
    const m2423 = map.jcl_2024_to_2023 || {}
    const m2324 = map.jcl_2023_to_2024 || {}
    const regTo24 = map.reg_to_2024 || {}
    const regTo23 = map.reg_to_2023 || {}
    const normSel = norm(selectedName)

    const keys2024 = Object.keys(m2423)
    const key2024 = keys2024.find(k => norm(k) === normSel)
    const mapped23From24: string[] = key2024 ? (m2423[key2024] || []) : []

    const keys2023 = Object.keys(m2324)
    const key2023 = keys2023.find(k => norm(k) === normSel)
    const mapped24From23: string[] = key2023 ? (m2324[key2023] || []) : []

    const reg24Keys = Object.keys(regTo24)
    const reg23Keys = Object.keys(regTo23)
    const regKey24 = reg24Keys.find(k => norm(k) === normSel)
    const regKey23 = reg23Keys.find(k => norm(k) === normSel)
    const regMapped24: string[] = regKey24 ? (regTo24[regKey24] || []) : []
    const regMapped23: string[] = regKey23 ? (regTo23[regKey23] || []) : []

    const names24 = [selectedName, ...mapped24From23, ...regMapped24].map(norm)
    const names23 = [selectedName, ...mapped23From24, ...regMapped23].map(norm)

    const pickRows = (rows: any[] | undefined, names: string[]) => {
      if (!rows) return []
      return rows.filter(r => names.includes(norm(r.name || r.Name || '')))
    }
    return {
      batting: { y2024: pickRows(stats2024['batting'], names24), y2023: pickRows(stats2023['batting'], names23) },
      bowling: { y2024: pickRows(stats2024['bowling'], names24), y2023: pickRows(stats2023['bowling'], names23) },
      fielding: { y2024: pickRows(stats2024['fielding'], names24), y2023: pickRows(stats2023['fielding'], names23) },
    }
  }, [picked, mapping, stats2024, stats2023])

  const unsold = useMemo(() => {
    const soldMap = state?.sold || {}
    const retSet = new Set(
      Object.values(state?.retentions || {})
        .flat()
        .map(r => norm(r.fullName))
    )
    const unassignedSet = new Set(
      (state?.unsold || [])
        .filter(u => u.unassigned)
        .map(u => norm(u.fullName))
    )
    const queuedUnsoldSet = new Set(
      (state?.unsold || [])
        .filter(u => !u.unassigned)
        .map(u => norm(u.fullName))
    )
    return regs.filter(r => {
      const key = norm(r.fullName)
      // Default pool excludes: sold, retained, unassigned, and currently in unsold queue (i.e., will be retried in next round)
      return !soldMap[key] && !retSet.has(key) && !unassignedSet.has(key) && !queuedUnsoldSet.has(key)
    })
  }, [regs, state])

  const unsoldQueue = useMemo(() => (state?.unsold || [])
    .filter(u => !u.unassigned)
    .map(u => u.fullName), [state])

  const startRandomPick = () => {
    if (pickedAnimating) { setActionMsg('Random pick already in progress'); return }
    if (picked) { setActionMsg('Finish action on current player (sell or mark unsold) before picking next'); return }
    let pool = useUnsoldPool ? regs.filter(r => unsoldQueue.includes(r.fullName)) : unsold
    if (!pool.length) {
      // If first-round pool is empty but unsold queue has players, auto-switch to Unsold Queue
      const fallback = regs.filter(r => unsoldQueue.includes(r.fullName))
      if (fallback.length) {
        setUseUnsoldPool(true)
        pool = fallback
        setActionMsg('First round complete. Rotating Unsold Queue...')
      } else {
        setActionMsg('No players available in selected pool');
        return
      }
    }
    setPickedAnimating(true)
    setPicked(null)
    setImgLoaded(false)
    setSellTeam('')
    setSellPoints('')
    const duration = 2500
    const tick = 80
    const start = Date.now()
    const timer = setInterval(() => {
      const idx = Math.floor(Math.random() * pool.length)
      setPicked(pool[idx])
      if (Date.now() - start > duration) {
        clearInterval(timer)
        setPickedAnimating(false)
      }
    }, tick)
  }

  useEffect(() => { setImgLoaded(false) }, [picked])
  useEffect(() => {
    if (picked?.photoUrl) {
      setPhotoSrc(driveViewUrl(picked.photoUrl))
      setPhotoAlt(picked.fullName)
      setZoom(1); setTx(0); setTy(0); setPanning(false); setLast(null)
    }
  }, [picked?.photoUrl])

  const handleLogin = () => {
    if (user === 'admin' && pass === '8881212') {
      localStorage.setItem('auction_admin', '1')
      setAuth(true)
    } else {
      setActionMsg('Invalid credentials')
    }
  }

  const ensureTeams = async () => {
    const names = teamsInput.split(',').map(s => s.trim()).filter(Boolean)
    const teams = names.map(name => ({ name, budget: budgetInput }))
    const res = await fetch('/api/auction/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setTeams', teams }) })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error || 'Failed to set teams')
    setState(json.state)
    setActionMsg('Teams initialized')
  }

  const sellPicked = async () => {
    if (!picked) return
    if (!sellTeam || sellPoints === '' || Number(sellPoints) < 0) { setActionMsg('Pick team and points'); return }
    const res = await fetch('/api/auction/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sell', fullName: picked.fullName, team: sellTeam, points: Number(sellPoints) }) })
    const json = await res.json()
    if (!res.ok) { setActionMsg(json?.error || 'Failed to sell'); return }
    setState(json.state)
    setActionMsg('Sold saved')
    setPicked(null)
  }

  const markUnsold = async () => {
    if (!picked) return
    const res = await fetch('/api/auction/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unsold', fullName: picked.fullName }) })
    const json = await res.json()
    if (!res.ok) { setActionMsg(json?.error || 'Failed to mark unsold'); return }
    setState(json.state)
    setActionMsg('Marked unsold')
    setPicked(null)
  }

  const markUnassigned = async () => {
    if (!picked) return
    const res = await fetch('/api/auction/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'markUnassigned', fullName: picked.fullName }) })
    const json = await res.json()
    if (!res.ok) { setActionMsg(json?.error || 'Failed to mark unassigned'); return }
    setState(json.state)
    setActionMsg('Marked unassigned')
    setPicked(null)
  }

  const clearUnsold = async () => {
    const res = await fetch('/api/auction/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clearUnsold' }) })
    const json = await res.json()
    if (!res.ok) { setActionMsg(json?.error || 'Failed to clear unsold'); return }
    setState(json.state)
    setActionMsg('Cleared unsold queue')
  }

  const saveOwner = async () => {
    if (!ownerTeam) { setActionMsg('Select team for owner'); return }
    const res = await fetch('/api/auction/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setOwner', team: ownerTeam, ownerName, playing: ownerPlaying }) })
    const json = await res.json()
    if (!res.ok) { setActionMsg(json?.error || 'Failed to save owner'); return }
    setState(json.state)
    setActionMsg('Owner saved')
  }

  const retain = async () => {
    if (!retainTeam || !retainPlayer) { setActionMsg('Select team and player to retain'); return }
    const res = await fetch('/api/auction/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'retain', team: retainTeam, fullName: retainPlayer }) })
    const json = await res.json()
    if (!res.ok) { setActionMsg(json?.error || 'Failed to retain'); return }
    setState(json.state)
    setActionMsg('Retention saved')
  }

  if (!auth) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-md mx-auto bg-green-900/30 border border-green-800 p-6 rounded-lg">
          <div className="text-2xl font-bold text-white mb-4">Auction Admin Login</div>
          <div className="grid gap-3">
            <div>
              <label className="block text-green-200 text-sm mb-1">Username</label>
              <input value={user} onChange={(e)=>setUser(e.target.value)} className="w-full rounded-md border border-green-800 bg-green-900/40 text-white px-3 py-2" />
            </div>
            <div>
              <label className="block text-green-200 text-sm mb-1">Password</label>
              <input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} className="w-full rounded-md border border-green-800 bg-green-900/40 text-white px-3 py-2" />
            </div>
            <button onClick={handleLogin} className="px-4 py-2 rounded-md bg-cricket-gold text-black font-semibold">Login</button>
            {actionMsg && <div className="text-red-200 text-sm">{actionMsg}</div>}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">JCL Player Auction</h1>
          <a className="text-cricket-gold hover:underline" href="/auction/teams">Teams</a>
        </div>

        {loading && <div className="text-green-100">Loading...</div>}
        {error && <div className="text-red-200">{error}</div>}

        {!loading && !error && (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              <button type="button" onClick={() => setActiveTab('init')} className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${activeTab==='init' ? 'bg-cricket-gold text-black border-cricket-gold' : 'bg-green-900/40 text-green-100 border-green-800'}`}>Initialize Teams</button>
              <button type="button" onClick={() => setActiveTab('owners')} className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${activeTab==='owners' ? 'bg-cricket-gold text-black border-cricket-gold' : 'bg-green-900/40 text-green-100 border-green-800'}`}>Owners & Retentions</button>
              <button type="button" onClick={() => setActiveTab('auction')} className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${activeTab==='auction' ? 'bg-cricket-gold text-black border-cricket-gold' : 'bg-green-900/40 text-green-100 border-green-800'}`}>Player Auction</button>
              <button type="button" onClick={() => setActiveTab('budgets')} className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${activeTab==='budgets' ? 'bg-cricket-gold text-black border-cricket-gold' : 'bg-green-900/40 text-green-100 border-green-800'}`}>Team Budgets</button>
            </div>
            {activeTab==='init' && (
            <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
              <div className="text-white font-semibold mb-2">Initialize Teams</div>
              <div className="grid md:grid-cols-[1fr_auto_auto] gap-3 items-end">
                <div>
                  <label className="block text-green-200 text-sm mb-1">Team Names (comma separated)</label>
                  <input value={teamsInput} onChange={(e)=>setTeamsInput(e.target.value)} className="w-full rounded-md border border-green-800 bg-green-900/40 text-white px-3 py-2" />
                </div>
                <div>
                  <label className="block text-green-200 text-sm mb-1">Budget per Team</label>
                  <input type="number" value={budgetInput} onChange={(e)=>setBudgetInput(parseInt(e.target.value||'0',10))} className="w-40 rounded-md border border-green-800 bg-green-900/40 text-white px-3 py-2" />
                </div>
                <button onClick={ensureTeams} className="px-4 py-2 rounded-md bg-cricket-gold text-black font-semibold">Save</button>
              </div>
            </div>
            )}

            {/* Owners & Retentions */}
            {activeTab==='owners' && (
            <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
              <div className="text-white font-semibold mb-2">Owners & Retentions</div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded border border-green-800 p-3 bg-green-900/40">
                  <div className="text-green-100 font-medium mb-2">Set Owner</div>
                  <div className="grid gap-2">
                    <div>
                      <label className="block text-green-200 text-sm mb-1">Team</label>
                      <select value={ownerTeam} onChange={(e)=>setOwnerTeam(e.target.value)} className="w-full rounded-md border border-green-800 bg-green-900/40 text-white px-3 py-2">
                        <option value="">Select team</option>
                        {Object.keys(state?.teams || {}).map(t => (<option key={t} value={t}>{t}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-green-200 text-sm mb-1">Owner Name</label>
                      <input value={ownerName} onChange={(e)=>setOwnerName(e.target.value)} className="w-full rounded-md border border-green-800 bg-green-900/40 text-white px-3 py-2" />
                    </div>
                    <label className="inline-flex items-center gap-2 text-green-100">
                      <input type="checkbox" checked={ownerPlaying} onChange={(e)=>setOwnerPlaying(e.target.checked)} /> Owner is playing (limits to 1 retention)
                    </label>
                    <button onClick={saveOwner} className="px-3 py-2 rounded-md bg-cricket-gold text-black font-semibold">Save Owner</button>
                  </div>
                </div>
                <div className="rounded border border-green-800 p-3 bg-green-900/40">
                  <div className="text-green-100 font-medium mb-2">Retain Player</div>
                  <div className="grid md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-green-200 text-sm mb-1">Team</label>
                      <select value={retainTeam} onChange={(e)=>setRetainTeam(e.target.value)} className="w-full rounded-md border border-green-800 bg-green-900/40 text-white px-3 py-2">
                        <option value="">Select team</option>
                        {Object.keys(state?.teams || {}).map(t => (<option key={t} value={t}>{t}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-green-200 text-sm mb-1">Player</label>
                      <input list="retainPlayers" value={retainPlayer} onChange={(e)=>setRetainPlayer(e.target.value)} className="w-full rounded-md border border-green-800 bg-green-900/40 text-white px-3 py-2" placeholder="Type to search" />
                      <datalist id="retainPlayers">
                        {regs.map(r => (<option key={r.fullName} value={r.fullName} />))}
                      </datalist>
                    </div>
                    <button onClick={retain} className="px-3 py-2 rounded-md bg-cricket-gold text-black font-semibold md:col-span-2">Save Retention</button>
                  </div>
                  <div className="mt-3 grid md:grid-cols-2 gap-3">
                    {Object.entries(state?.retentions || {}).map(([team, arr]) => (
                      <div key={team} className="rounded border border-green-800 p-2">
                        <div className="text-white font-medium">{team} — Retained ({arr.length}/{(state?.owners?.[team]?.playing ? 1 : 2)})</div>
                        <ul className="text-green-200 text-sm list-disc pl-5">
                          {arr.map((r, i) => (<li key={i}>{r.fullName}</li>))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            )}

            {activeTab==='auction' && (
            <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <button onClick={startRandomPick} disabled={pickedAnimating || !!picked} className="px-4 py-2 rounded-md bg-cricket-gold text-black font-semibold disabled:opacity-50">Random Pick</button>
                <label className="inline-flex items-center gap-2 text-green-100">
                  <input type="checkbox" checked={useUnsoldPool} onChange={(e)=>setUseUnsoldPool(e.target.checked)} /> Use Unsold Queue ({unsoldQueue.length})
                </label>
                <div className="text-green-200 text-sm">Available: {useUnsoldPool ? unsoldQueue.length : unsold.length}</div>
                {actionMsg && <div className="text-green-100 text-sm">{actionMsg}</div>}
              </div>

              <div className={`relative overflow-hidden rounded-lg border border-green-800 ${pickedAnimating ? 'animate-pulse' : ''}`}>
                <div className="p-4 grid md:grid-cols-[160px_1fr] gap-4 items-center">
                  <div className="w-full h-40 bg-green-950/50 flex items-center justify-center rounded">
                    {picked && !pickedAnimating && picked.photoUrl ? (
                      <button
                        type="button"
                        className="block"
                        onClick={() => {
                          setPhotoSrc(driveViewUrl(picked.photoUrl || ''))
                          setPhotoAlt(picked.fullName)
                          setZoom(1); setTx(0); setTy(0); setPanning(false); setLast(null)
                          setPhotoOpen(true)
                        }}
                        title="View photo"
                      >
                        <img src={driveThumbUrl(picked.photoUrl)} alt={picked.fullName} onLoad={() => setImgLoaded(true)} className={`max-h-40 object-contain transition-opacity duration-500 ease-out ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    ) : (
                      <div className="text-green-300 text-sm">{pickedAnimating ? 'Selecting player...' : 'No Photo'}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-white text-xl font-bold">{picked ? picked.fullName : '—'}</div>
                    <div className="text-green-200 text-sm">Age: {picked?.age ?? ''}</div>
                    <div className="text-green-200 text-sm">Style: {picked?.playingStyle ?? ''}</div>
                    <div className="text-green-200 text-sm">T-shirt: {picked?.tshirtSize ?? ''}</div>
                    <div className="text-green-200 text-sm">Contact: {picked?.contact ?? ''}</div>
                    <div className="text-green-200 text-sm">Group: {picked?.auctionGroup ?? ''} {picked?.auctionAgeCategory ? `• ${picked.auctionAgeCategory}` : ''}</div>
                    <div className="text-green-200 text-sm">2024 Auction: {picked?.auctionTeam ?? '—'} {typeof picked?.auctionPoints === 'number' ? `• ${picked?.auctionPoints} pts` : ''}</div>
                  </div>
                </div>
                {/* pseudo graphic bar */}
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-cricket-gold/0 via-cricket-gold/60 to-cricket-gold/0"></div>
              </div>

              {/* Previous Seasons — Batting, Bowling, Fielding */}
              {(['batting','bowling','fielding'] as const).map((cat) => {
                const label = cat.charAt(0).toUpperCase() + cat.slice(1)
                const y2024 = (matchedStats as any)[cat]?.y2024 || []
                const y2023 = (matchedStats as any)[cat]?.y2023 || []
                const hasAny = (y2024.length > 0 || y2023.length > 0)
                if (!hasAny) return null
                const keySets: Record<string, string[]> = {
                  batting: ['Sixes','Balls','Runs','Runs Scored','Total Runs','SR','Strike Rate'],
                  bowling: ['Wickets','Overs','Maidens','Economy','Avg','Average','Runs Given','Balls','Dot Balls','Best','5W'],
                  fielding: ['Catches','Run Outs','Stumpings','Dismissals','Innings','Matches'],
                }
                const renderCard = (yr: '2024'|'2023', rows: any[]) => {
                  if (!rows || rows.length === 0) return (
                    <div key={yr} className="rounded border border-green-800 bg-green-900/30 p-3"><div className="text-white font-semibold">{label} {yr}</div><div className="text-green-300 text-sm">No record</div></div>
                  )
                  const r = rows[0] as any
                  let items: Array<{ k: string; v: any }>
                  if (cat === 'batting') {
                    // Map to actual CSV headers with fallbacks
                    const pick = (...keys: string[]) => {
                      for (const k of keys) {
                        const v = r[k]
                        if (v !== undefined && v !== null && String(v) !== '') return v
                      }
                      return ''
                    }
                    const sixes = pick('6s', 'Sixes')
                    const balls = pick('ball_faced', 'Balls', 'balls')
                    const runs = pick('total_runs', 'Runs', 'Runs Scored', 'Total Runs')
                    const sr = pick('strike_rate', 'SR', 'Strike Rate')
                    items = [
                      { k: 'Total 6s', v: sixes },
                      { k: 'Total Balls', v: balls },
                      { k: 'Total Runs', v: runs },
                      { k: 'Strike Rate', v: sr },
                    ].filter(x => x.v !== undefined && x.v !== null && String(x.v) !== '')
                  } else if (cat === 'fielding') {
                    const pick = (...keys: string[]) => {
                      for (const k of keys) {
                        const v = r[k]
                        if (v !== undefined && v !== null && String(v) !== '') return v
                      }
                      return ''
                    }
                    const catches = pick('total_catches', 'catches', 'Catches')
                    const stumpings = pick('stumpings', 'Stumpings')
                    const runOutsRaw = pick('run_outs', 'Run Outs')
                    const assistRunOutsRaw = pick('assist_run_outs', 'Assist Run Outs', 'Assists')
                    const dismissals = pick('total_dismissal', 'Dismissals')
                    const toNum = (v: any) => {
                      const n = Number(String(v).replace(/[^0-9.-]/g, ''))
                      return Number.isFinite(n) ? n : 0
                    }
                    const totalRunOuts = toNum(runOutsRaw) + toNum(assistRunOutsRaw)
                    items = [
                      { k: 'Catches', v: catches },
                      { k: 'Stumpings', v: stumpings },
                      { k: 'Total Run Outs', v: totalRunOuts },
                      { k: 'Dismissals', v: dismissals },
                    ].filter(x => x.v !== undefined && x.v !== null && String(x.v) !== '')
                  } else if (cat === 'bowling') {
                    const pick = (...keys: string[]) => {
                      for (const k of keys) {
                        const v = r[k]
                        if (v !== undefined && v !== null && String(v) !== '') return v
                      }
                      return ''
                    }
                    const wickets = pick('total_wickets', 'Wickets', 'wickets')
                    const overs = pick('overs', 'Overs')
                    const maidens = pick('maidens', 'Maidens')
                    const economy = pick('economy', 'Economy', 'Econ')
                    const average = pick('avg', 'Average', 'Avg')
                    const runsGiven = pick('runs', 'Runs Given', 'Runs')
                    const balls = pick('balls', 'Balls')
                    const dots = pick('dot_balls', 'Dot Balls', 'Dots')
                    const best = pick('highest_wicket', 'Best', 'Best Bowling')
                    const fiveW = pick('5W', 'Five Wicket', 'Five-for')
                    items = [
                      { k: 'Total Wickets', v: wickets },
                      { k: 'Overs', v: overs },
                      { k: 'Maidens', v: maidens },
                      { k: 'Economy', v: economy },
                      { k: 'Average', v: average },
                      { k: 'Runs Given', v: runsGiven },
                      { k: 'Balls', v: balls },
                      { k: 'Dot Balls', v: dots },
                      { k: 'Best', v: best },
                      { k: '5W', v: fiveW },
                    ].filter(x => x.v !== undefined && x.v !== null && String(x.v) !== '')
                  } else {
                    items = keySets[cat].map(k => ({ k, v: r[k] ?? r[k.toLowerCase?.()] ?? r[String(k).toLowerCase()] })).filter(x => x.v !== undefined && x.v !== null && String(x.v) !== '')
                  }
                  return (
                    <div key={yr} className="rounded border border-green-800 bg-green-900/30 p-3">
                      <div className="text-white font-semibold mb-1">{label} {yr}</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-green-100 text-sm">
                        {items.slice(0, 10).map((it, i) => (
                          <div key={i} className="flex justify-between gap-2"><span className="text-green-300">{it.k}</span><span>{String(it.v)}</span></div>
                        ))}
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={cat} className="mt-4">
                    <div className="grid md:grid-cols-2 gap-3">
                      {renderCard('2024', y2024)}
                      {renderCard('2023', y2023)}
                    </div>
                  </div>
                )
              })}

              <div className="mt-4 grid md:grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-end">
                <div>
                  <label className="block text-green-200 text-sm mb-1">Team</label>
                  <select value={sellTeam} onChange={(e)=>setSellTeam(e.target.value)} className="w-full rounded-md border border-green-800 bg-green-900/40 text-white px-3 py-2">
                    <option value="">Select team</option>
                    {Object.keys(state?.teams || {}).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-green-200 text-sm mb-1">Points</label>
                  <input type="number" value={sellPoints} onChange={(e)=>setSellPoints(e.target.value === '' ? '' : parseInt(e.target.value,10))} className="w-40 rounded-md border border-green-800 bg-green-900/40 text-white px-3 py-2" />
                </div>
                <button onClick={sellPicked} disabled={!picked || !sellTeam || sellPoints === ''} className="px-4 py-2 rounded-md bg-cricket-gold text-black font-semibold disabled:opacity-50">Save Sale</button>
                <button onClick={markUnsold} disabled={!picked} className="px-4 py-2 rounded-md border border-yellow-600 text-yellow-300 disabled:opacity-50">Mark Unsold</button>
                {(() => {
                  const key = norm(picked?.fullName || '')
                  const entry = (state?.unsold || []).find(u => norm(u.fullName) === key)
                  const canMarkUnassigned = !!picked && entry && !entry.unassigned && Math.max(1, Number(entry.rounds || 1)) >= 2
                  return (
                    <button onClick={markUnassigned} disabled={!canMarkUnassigned} className="px-4 py-2 rounded-md border border-red-800 text-red-300 disabled:opacity-50">Mark Unassigned</button>
                  )
                })()}
              </div>
            </div>
            )}

            {activeTab==='budgets' && (
            <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
              <div className="text-white font-semibold mb-2">Team Budgets</div>
              <div className="grid md:grid-cols-4 gap-3">
                {Object.entries(state?.summary || {}).map(([name, s]) => (
                  <div key={name} className="rounded border border-green-800 p-3 bg-green-900/40">
                    <div className="text-white font-medium">{name}</div>
                    <div className="text-green-200 text-sm">Budget: {s.budget}</div>
                    <div className="text-green-200 text-sm">Spent: {s.spent}</div>
                    <div className="text-green-200 text-sm">Remaining: {s.remaining}</div>
                    <div className="text-green-200 text-sm">Players: {s.count}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="text-green-200 text-sm">Unsold Queue: {unsoldQueue.length}</div>
                <button onClick={clearUnsold} className="px-3 py-1.5 rounded-md border border-green-800 text-green-100 text-sm">Clear Unsold</button>
              </div>
            </div>
            )}
          </>
        )}
      </div>

      {photoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setPhotoOpen(false) }}
          onKeyDown={(e) => { if (e.key === 'Escape') setPhotoOpen(false) }}
          tabIndex={-1}
        >
          <div className="relative max-w-4xl w-full">
            <button
              type="button"
              className="absolute -top-2 -right-2 bg-white/90 text-black rounded-full px-3 py-1 text-sm font-semibold shadow"
              onClick={() => setPhotoOpen(false)}
            >
              Close
            </button>
            <div className="bg-green-950 rounded-lg p-2">
              <div
                className={`relative overflow-hidden max-h-[80vh] w-full select-none ${panning ? 'cursor-grabbing' : 'cursor-grab'}`}
                onWheel={(e) => {
                  e.preventDefault()
                  const dir = e.deltaY > 0 ? -1 : 1
                  const next = Math.min(4, Math.max(1, Number((zoom + dir * 0.2).toFixed(2))))
                  setZoom(next)
                }}
                onMouseDown={(e) => { setPanning(true); setLast({ x: e.clientX, y: e.clientY }) }}
                onMouseMove={(e) => {
                  if (!panning || !last) return
                  const dx = e.clientX - last.x
                  const dy = e.clientY - last.y
                  setTx(v => v + dx); setTy(v => v + dy); setLast({ x: e.clientX, y: e.clientY })
                }}
                onMouseUp={() => { setPanning(false); setLast(null) }}
                onMouseLeave={() => { setPanning(false); setLast(null) }}
              >
                <img
                  src={photoSrc}
                  alt={photoAlt}
                  className="max-h-[80vh] w-full object-contain rounded will-change-transform"
                  style={{ transform: `translate(${tx}px, ${ty}px) scale(${zoom})` }}
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement
                    const step = img.dataset.fallback || '0'
                    // Step 0: try original URL
                    if (step === '0') {
                      img.dataset.fallback = '1'
                      setPhotoSrc(picked?.photoUrl || photoSrc)
                      return
                    }
                    // Step 1: try a larger thumbnail as a last resort
                    const id = extractDriveId(photoSrc || picked?.photoUrl || '')
                    if (step === '1' && id) {
                      img.dataset.fallback = '2'
                      setPhotoSrc(`https://drive.google.com/thumbnail?id=${id}&sz=w1000`)
                      return
                    }
                    // Step 2: give up and close
                    setPhotoOpen(false)
                  }}
                  draggable={false}
                />
              </div>
              <div className="flex gap-2 justify-center mt-3">
                <button type="button" className="px-3 py-1 rounded bg-white/90 text-black text-sm font-semibold" onClick={() => setZoom(z => Math.max(1, Number((z - 0.2).toFixed(2))))}>-</button>
                <button type="button" className="px-3 py-1 rounded bg-white/90 text-black text-sm font-semibold" onClick={() => setZoom(z => Math.min(4, Number((z + 0.2).toFixed(2))))}>+</button>
                <button type="button" className="px-3 py-1 rounded bg-white/90 text-black text-sm font-semibold" onClick={() => { setZoom(1); setTx(0); setTy(0) }}>Reset</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
