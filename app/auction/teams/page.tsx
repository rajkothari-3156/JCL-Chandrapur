'use client'

import React, { useEffect, useState } from 'react'

type AuctionState = {
  teams: Record<string, { budget: number; players: Array<{ fullName: string; points: number; time: string }> }>
  sold: Record<string, { team: string; points: number; time: string }>
  summary: Record<string, { budget: number; spent: number; remaining: number; count: number }>
  owners?: Record<string, { name: string; playing: boolean }>
  retentions?: Record<string, Array<{ fullName: string; time: string }>>
}

export default function AuctionTeamsPage() {
  const [state, setState] = useState<AuctionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auction/state', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load state')
      setState(json)
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">Auction Teams</h1>
          <a className="text-cricket-gold hover:underline" href="/auction">Back to Auction</a>
        </div>

        {loading && <div className="text-green-100">Loading...</div>}
        {error && <div className="text-red-200">{error}</div>}

        {!loading && !error && (
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(state?.summary || {}).map(([name, s]) => (
              <div key={name} className="rounded-lg border border-green-800 bg-green-900/30">
                <div className="p-4 border-b border-green-800 flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold text-lg">{name}</div>
                    <div className="text-green-200 text-sm">Budget: {s.budget} • Spent: {s.spent} • Remaining: {s.remaining} • Players: {s.count}</div>
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
                      <div key={i} className="grid grid-cols-[1fr_auto] items-center rounded border border-green-800 bg-green-900/40 px-3 py-2">
                        <div className="text-green-100">{p.fullName}</div>
                        <div className="text-green-100 font-semibold">{p.points}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
