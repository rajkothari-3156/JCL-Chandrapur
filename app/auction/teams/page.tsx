'use client'

import React, { useEffect, useState } from 'react'

type AuctionState = {
  teams: Record<string, { budget: number; players: Array<{ fullName: string; points: number; time: string }> }>
  sold: Record<string, { team: string; points: number; time: string }>
  summary: Record<string, { budget: number; spent: number; remaining: number; count: number }>
  owners?: Record<string, { name: string; playing: boolean }>
  retentions?: Record<string, Array<{ fullName: string; time: string }>>
  unsold?: Array<{ fullName: string; time: string; rounds?: number; unassigned?: boolean }>
}

type Registration = {
  fullName: string
  age: string | number | null
}

export default function AuctionTeamsPage() {
  const [state, setState] = useState<AuctionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [regs, setRegs] = useState<Registration[]>([])
  const handlePrint = () => { if (typeof window !== 'undefined') window.print() }

  const load = async () => {
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
      if (!sRes.ok) throw new Error(sJson?.error || 'Failed to load state')
      setState(sJson)
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updatePoints = async (team: string, fullName: string, points: number) => {
    setSaving(`${team}:${fullName}`)
    try {
      const res = await fetch('/api/auction/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updatePoints', team, fullName, points }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to update points')
      setState(json.state)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update')
    } finally {
      setSaving(null)
    }
  }

  const removePlayer = async (fullName: string) => {
    setSaving(`del:${fullName}`)
    try {
      const res = await fetch('/api/auction/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unsell', fullName }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to delete player')
      setState(json.state)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete')
    } finally {
      setSaving(null)
    }
  }

  const clearUnsold = async () => {
    setSaving('clearUnsold')
    try {
      const res = await fetch('/api/auction/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clearUnsold' }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to clear unsold')
      setState(json.state)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to clear unsold')
    } finally {
      setSaving(null)
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between print:mb-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">Auction Teams</h1>
          <div className="flex items-center gap-3 print:hidden">
            <button onClick={handlePrint} className="px-3 py-1.5 rounded-md border border-green-700 text-green-100 text-sm">Export PDF</button>
            <a className="text-cricket-gold hover:underline" href="/auction">Back to Auction</a>
          </div>
        </div>

        {loading && <div className="text-green-100">Loading...</div>}
        {error && <div className="text-red-200">{error}</div>}

        {!loading && !error && (
          <>
          <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
            <div className="text-white font-semibold mb-2">Team Budgets</div>
            <div className="grid md:grid-cols-4 gap-3">
              {Object.entries(state?.summary || {}).map(([name, s]) => {
                const regIndex = new Map(regs.map(r => [String(r.fullName || '').toLowerCase().replace(/\s+/g,' ').trim(), r]))
                const baseFee = (state?.retentions?.[name] || []).reduce((acc, r) => {
                  const rr = regIndex.get(String(r.fullName || '').toLowerCase().replace(/\s+/g,' ').trim())
                  const n = typeof rr?.age === 'number' ? rr.age : parseInt(String(rr?.age ?? ''), 10)
                  if (Number.isFinite(n) && (n as number) >= 35) return acc + 1000
                  return acc + 2500
                }, 0)
                const spent = s.spent + baseFee
                const remaining = s.budget - spent
                return (
                  <div key={name} className="rounded border border-green-800 p-3 bg-green-900/40">
                    <div className="text-white font-medium">{name}</div>
                    <div className="text-green-200 text-sm">Budget: {s.budget}</div>
                    <div className="text-green-200 text-sm">Spent: {spent}</div>
                    <div className="text-green-200 text-sm">Remaining: {remaining}</div>
                    <div className="text-green-200 text-sm">Players: {s.count}</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="text-green-200 text-sm">Unsold Queue: {(state?.unsold || []).filter(u=>!u.unassigned).length}</div>
              <button onClick={clearUnsold} disabled={saving==='clearUnsold'} className="px-3 py-1.5 rounded-md border border-green-800 text-green-100 text-sm disabled:opacity-50">Clear Unsold</button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(state?.summary || {}).map(([name, s]) => (
              <div key={name} className="rounded-lg border border-green-800 bg-green-900/30">
                <div className="p-4 border-b border-green-800 flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold text-lg">{name}</div>
                    {(() => {
                      const regIndex = new Map(regs.map(r => [String(r.fullName || '').toLowerCase().replace(/\s+/g,' ').trim(), r]))
                      const baseFee = (state?.retentions?.[name] || []).reduce((acc, r) => {
                        const rr = regIndex.get(String(r.fullName || '').toLowerCase().replace(/\s+/g,' ').trim())
                        const n = typeof rr?.age === 'number' ? rr.age : parseInt(String(rr?.age ?? ''), 10)
                        if (Number.isFinite(n) && (n as number) >= 35) return acc + 1000
                        return acc + 2500
                      }, 0)
                      const spent = s.spent + baseFee
                      const remaining = s.budget - spent
                      return (
                        <div className="text-green-200 text-sm">Budget: {s.budget} • Spent: {spent} • Remaining: {remaining} • Players: {s.count}</div>
                      )
                    })()}
                    <div className="text-green-300 text-xs mt-1">Owner: {state?.owners?.[name]?.name || '—'} {state?.owners?.[name] ? (state?.owners?.[name]?.playing ? '(Playing)' : '(Non-playing)') : ''}</div>
                  </div>
                  <button onClick={load} className="px-3 py-1.5 rounded-md bg-cricket-gold text-black text-sm font-semibold">Refresh</button>
                </div>
                <div className="p-4">
                  {(state?.retentions?.[name] || []).length > 0 && (
                    <div className="mb-3">
                      <div className="text-white font-medium">Retained Players</div>
                      <ul className="text-green-200 text-sm list-disc pl-5">
                        {(state?.retentions?.[name] || []).map((r, i) => (<li key={i}>{r.fullName}</li>))}
                      </ul>
                    </div>
                  )}
                  {(state?.teams[name]?.players || []).length === 0 && (
                    <div className="text-green-300 text-sm">No players yet.</div>
                  )}
                  <div className="grid gap-2">
                    {(state?.teams[name]?.players || []).map((p, i) => (
                      <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded border border-green-800 bg-green-900/40 px-3 py-2">
                        <div className="text-green-100 truncate" title={p.fullName}>{p.fullName}</div>
                        <input
                          type="number"
                          defaultValue={p.points}
                          className="w-24 rounded-md border border-green-800 bg-green-900/40 text-white px-2 py-1 text-sm"
                          onBlur={(e)=>{
                            const val = parseInt(e.currentTarget.value||'0',10);
                            if (!isNaN(val) && val !== p.points) updatePoints(name, p.fullName, val)
                          }}
                        />
                        <button disabled={saving===`${name}:${p.fullName}`}
                          onClick={()=>updatePoints(name, p.fullName, parseInt((document.activeElement as HTMLInputElement)?.value || String(p.points), 10) || p.points)}
                          className="px-2 py-1 rounded-md bg-cricket-gold text-black text-sm disabled:opacity-50">Save</button>
                        <button disabled={saving===`del:${p.fullName}`}
                          onClick={()=>removePlayer(p.fullName)}
                          className="px-2 py-1 rounded-md border border-red-700 text-red-300 text-sm disabled:opacity-50">Delete</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
        {/* Print styles */}
        <style jsx global>{`
          @media print {
            body { background: #ffffff !important; }
            main { padding: 0 !important; }
            a[href]:after { content: '' !important; }
            .print\:hidden { display: none !important; }
            .print\:mb-2 { margin-bottom: 0.5rem !important; }
            table, div, section, article { break-inside: avoid; }
          }
        `}</style>
      </div>
    </main>
  )
}
