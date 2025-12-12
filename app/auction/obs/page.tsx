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
  contact: string | null
  playingStyle: string | null
  tshirtSize: string | null
  photoUrl: string | null
  auctionGroup?: string | null
  auctionAgeCategory?: string | null
  auctionPoints?: number | null
  auctionTeam?: string | null
  serialNumber?: number
}

export default function AuctionOBSPage() {
  const [state, setState] = useState<AuctionState | null>(null)
  const [regs, setRegs] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<string>('')
  const [previousPlayer, setPreviousPlayer] = useState<{ name: string; team: string; points: number } | null>(null)

  const norm = (s: string) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()

  const load = async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        fetch('/api/registrations/sorted', { cache: 'no-store' }),
        fetch('/api/auction/state', { cache: 'no-store' }),
      ])
      const rJson = await rRes.json()
      if (rRes.ok) setRegs(rJson.data || [])
      const sJson = await sRes.json()
      if (sRes.ok) {
        setState(sJson)
        
        // Get the most recent sold player
        const soldEntries = Object.entries(sJson.sold || {})
        if (soldEntries.length > 0) {
          const sorted = soldEntries.sort((a, b) => {
            const timeA = new Date((a[1] as any).time).getTime()
            const timeB = new Date((b[1] as any).time).getTime()
            return timeB - timeA
          })
          const [name, data] = sorted[0]
          const soldData = data as { team: string; points: number; time: string }
          setPreviousPlayer({ name, team: soldData.team, points: soldData.points })
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 3000) // Refresh every 3 seconds
    return () => clearInterval(interval)
  }, [])

  const getPlayerInfo = (name: string) => {
    const reg = regs.find(r => norm(r.fullName) === norm(name))
    return reg
  }

  const currentPlayerInfo = currentPlayer ? getPlayerInfo(currentPlayer) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-black p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white drop-shadow-2xl mb-2">JCL AUCTION 2025</h1>
          <p className="text-2xl text-cricket-gold">LIVE</p>
        </div>

        {loading && (
          <div className="text-center text-white text-2xl">Loading auction data...</div>
        )}

        {error && (
          <div className="text-center text-red-300 text-xl">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* Current Player Being Sold */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 shadow-2xl border-4 border-yellow-400">
              <div className="text-center">
                <div className="text-yellow-200 text-2xl font-semibold mb-4 uppercase tracking-wider">
                  Current Player
                </div>
                {currentPlayer ? (
                  <>
                    <div className="text-white text-6xl font-bold mb-4 drop-shadow-lg">
                      {currentPlayer}
                    </div>
                    {currentPlayerInfo && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-white">
                        <div className="bg-black/30 rounded-lg p-4">
                          <div className="text-yellow-200 text-sm mb-1">Serial #</div>
                          <div className="text-3xl font-bold">{currentPlayerInfo.serialNumber || '-'}</div>
                        </div>
                        <div className="bg-black/30 rounded-lg p-4">
                          <div className="text-yellow-200 text-sm mb-1">Age</div>
                          <div className="text-3xl font-bold">{currentPlayerInfo.age || '-'}</div>
                        </div>
                        <div className="bg-black/30 rounded-lg p-4">
                          <div className="text-yellow-200 text-sm mb-1">Style</div>
                          <div className="text-xl font-semibold">{currentPlayerInfo.playingStyle || '-'}</div>
                        </div>
                        <div className="bg-black/30 rounded-lg p-4">
                          <div className="text-yellow-200 text-sm mb-1">T-Shirt</div>
                          <div className="text-3xl font-bold">{currentPlayerInfo.tshirtSize || '-'}</div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-white text-4xl">
                    <input
                      type="text"
                      value={currentPlayer}
                      onChange={(e) => setCurrentPlayer(e.target.value)}
                      placeholder="Enter player name..."
                      className="w-full bg-white/20 border-2 border-yellow-400 rounded-lg px-6 py-4 text-center text-white placeholder-white/60 focus:outline-none focus:ring-4 focus:ring-yellow-300"
                      list="playerList"
                    />
                    <datalist id="playerList">
                      {regs.map(r => (
                        <option key={r.fullName} value={r.fullName} />
                      ))}
                    </datalist>
                  </div>
                )}
              </div>
            </div>

            {/* Previous Player Sold */}
            {previousPlayer && (
              <div className="bg-gradient-to-r from-green-700 to-green-900 rounded-2xl p-6 shadow-xl border-2 border-green-500">
                <div className="text-center">
                  <div className="text-green-200 text-xl font-semibold mb-3 uppercase tracking-wider">
                    Last Player Sold
                  </div>
                  <div className="text-white text-4xl font-bold mb-2">
                    {previousPlayer.name}
                  </div>
                  <div className="flex justify-center gap-8 text-white text-xl">
                    <div>
                      <span className="text-green-300">Team:</span> <span className="font-semibold">{previousPlayer.team}</span>
                    </div>
                    <div>
                      <span className="text-green-300">Points:</span> <span className="font-bold text-yellow-300">{previousPlayer.points}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Team Balances */}
            <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-2xl p-6 shadow-xl border-2 border-blue-500">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Team Balances</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(state?.summary || {}).map(([name, s]) => {
                  const regIndex = new Map(regs.map(r => [norm(r.fullName), r]))
                  const baseFee = (state?.retentions?.[name] || []).reduce((acc, r) => {
                    const rr = regIndex.get(norm(r.fullName))
                    const n = typeof rr?.age === 'number' ? rr.age : parseInt(String(rr?.age ?? ''), 10)
                    if (Number.isFinite(n) && (n as number) >= 35) return acc + 1000
                    return acc + 2500
                  }, 0)
                  const spent = s.spent + baseFee
                  const remaining = s.budget - spent
                  const totalPlayers = s.count + (state?.retentions?.[name] || []).length

                  return (
                    <div key={name} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <div className="text-white font-bold text-lg mb-3 truncate" title={name}>
                        {name}
                      </div>
                      <div className="space-y-2 text-white">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-200">Budget:</span>
                          <span className="font-semibold">{s.budget}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-200">Spent:</span>
                          <span className="font-semibold">{spent}</span>
                        </div>
                        <div className="flex justify-between text-lg">
                          <span className="text-yellow-300">Remaining:</span>
                          <span className="font-bold text-yellow-300">{remaining}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-white/20 pt-2">
                          <span className="text-blue-200">Players:</span>
                          <span className="font-semibold">{totalPlayers}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Control Panel */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div className="text-gray-300 text-sm">
                  Auto-refresh: Every 3 seconds
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={load}
                    className="px-4 py-2 rounded-lg bg-cricket-gold text-black font-semibold hover:bg-yellow-500 transition"
                  >
                    Refresh Now
                  </button>
                  <button
                    onClick={() => setCurrentPlayer('')}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                  >
                    Clear Current
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
