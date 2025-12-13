'use client'

import React, { useEffect, useState } from 'react'

type AuctionState = {
  teams: Record<string, { budget: number; players: Array<{ fullName: string; points: number; time: string }> }>
  sold: Record<string, { team: string; points: number; time: string }>
  summary: Record<string, { budget: number; spent: number; remaining: number; count: number }>
  owners?: Record<string, { name: string; playing: boolean }>
  retentions?: Record<string, Array<{ fullName: string; time: string }>>
  unsold?: Array<{ fullName: string; time: string; rounds?: number; unassigned?: boolean }>
  currentPick?: { fullName: string; time: string } | null
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

// Google Drive helpers
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
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w400` : url
}

const driveViewUrl = (url: string): string => {
  const id = extractDriveId(url)
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url
}

export default function AuctionOBSPage() {
  const [state, setState] = useState<AuctionState | null>(null)
  const [regs, setRegs] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previousPlayer, setPreviousPlayer] = useState<{ name: string; team: string; points: number } | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [showSoldAnimation, setShowSoldAnimation] = useState(false)
  const [lastSoldPlayer, setLastSoldPlayer] = useState<{ name: string; team: string; points: number } | null>(null)

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
          const newSoldPlayer = { name, team: soldData.team, points: soldData.points }
          
          // Check if this is a new sold player
          if (!previousPlayer || previousPlayer.name !== name || previousPlayer.team !== soldData.team) {
            setPreviousPlayer(newSoldPlayer)
            setLastSoldPlayer(newSoldPlayer)
            setShowSoldAnimation(true)
            setTimeout(() => setShowSoldAnimation(false), 5000) // Hide after 5 seconds
          } else {
            setPreviousPlayer(newSoldPlayer)
          }
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

  const currentPlayer = state?.currentPick?.fullName || ''
  const currentPlayerInfo = currentPlayer ? getPlayerInfo(currentPlayer) : null

  useEffect(() => {
    setImgLoaded(false)
    setImgError(false)
  }, [currentPlayer])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-black" style={{ width: '800px', height: '1000px', overflow: 'hidden' }}>
      <div className="w-full h-full p-4 space-y-3 overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-3">
          <h1 className="text-4xl font-bold text-white drop-shadow-2xl mb-1">JCL AUCTION 2025</h1>
          <p className="text-xl text-cricket-gold">LIVE</p>
        </div>

        {/* Sold Player Celebration Animation */}
        {showSoldAnimation && lastSoldPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="text-center animate-scale-in">
              <div className="text-8xl mb-4 animate-bounce">🎉</div>
              <div className="text-6xl font-bold text-yellow-400 mb-4 drop-shadow-2xl animate-pulse">
                SOLD!
              </div>
              <div className="text-4xl font-bold text-white mb-3">
                {lastSoldPlayer.name}
              </div>
              <div className="text-3xl text-green-400 font-semibold mb-2">
                {lastSoldPlayer.team}
              </div>
              <div className="text-5xl font-bold text-yellow-300">
                {lastSoldPlayer.points} Points
              </div>
              <div className="mt-6 flex justify-center gap-4">
                <div className="text-6xl animate-bounce" style={{ animationDelay: '0.1s' }}>🏏</div>
                <div className="text-6xl animate-bounce" style={{ animationDelay: '0.2s' }}>⭐</div>
                <div className="text-6xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎊</div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center text-white text-2xl">Loading auction data...</div>
        )}

        {error && (
          <div className="text-center text-red-300 text-xl">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* Current Player Being Sold */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-4 shadow-2xl border-4 border-yellow-400">
              <div className="text-center">
                <div className="text-yellow-200 text-xl font-semibold mb-2 uppercase tracking-wider">
                  Current Player
                </div>
                {currentPlayer ? (
                  <>
                    <div className="flex flex-col items-center justify-center gap-3 mb-3">
                      {/* Player Photo */}
                      {currentPlayerInfo?.photoUrl && !imgError ? (
                        <div className="w-40 h-40 bg-black/30 rounded-xl flex items-center justify-center overflow-hidden border-4 border-yellow-400 shadow-2xl relative">
                          <img
                            src={driveThumbUrl(currentPlayerInfo.photoUrl)}
                            alt={currentPlayer}
                            onLoad={() => setImgLoaded(true)}
                            onError={(e) => {
                              console.error('Failed to load thumbnail, trying view URL:', currentPlayerInfo?.photoUrl)
                              const img = e.target as HTMLImageElement
                              if (img.src.includes('thumbnail') && currentPlayerInfo?.photoUrl) {
                                img.src = driveViewUrl(currentPlayerInfo.photoUrl)
                              } else {
                                setImgError(true)
                              }
                            }}
                            className={`max-w-full max-h-full object-contain transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                          />
                          {!imgLoaded && !imgError && (
                            <div className="absolute text-yellow-200 text-sm">Loading...</div>
                          )}
                        </div>
                      ) : (
                        <div className="w-40 h-40 bg-black/30 rounded-xl flex items-center justify-center border-4 border-yellow-400">
                          <div className="text-yellow-200 text-sm">{imgError ? 'Photo Load Failed' : 'No Photo'}</div>
                        </div>
                      )}
                      
                      {/* Player Name */}
                      <div className="w-full">
                        {(() => {
                          const age = currentPlayerInfo?.age
                          const n = typeof age === 'number' ? age : parseInt(String(age ?? ''), 10)
                          const is35Plus = Number.isFinite(n) && (n as number) >= 35
                          return (
                            <div className={`text-3xl font-bold drop-shadow-lg ${is35Plus ? 'text-orange-400' : 'text-white'}`}>
                              {currentPlayer}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                    
                    {currentPlayerInfo && (() => {
                      const age = currentPlayerInfo.age
                      const n = typeof age === 'number' ? age : parseInt(String(age ?? ''), 10)
                      const is35Plus = Number.isFinite(n) && (n as number) >= 35
                      return (
                        <div className="grid grid-cols-4 gap-2 mt-3 text-white">
                          <div className="bg-black/30 rounded-lg p-2">
                            <div className="text-yellow-200 text-xs mb-1">Serial #</div>
                            <div className={`text-xl font-bold ${is35Plus ? 'text-orange-400' : 'text-white'}`}>{currentPlayerInfo.serialNumber || '-'}</div>
                          </div>
                          <div className="bg-black/30 rounded-lg p-2">
                            <div className="text-yellow-200 text-xs mb-1">Age</div>
                            <div className={`text-xl font-bold ${is35Plus ? 'text-orange-400' : 'text-white'}`}>{currentPlayerInfo.age || '-'}</div>
                          </div>
                          <div className="bg-black/30 rounded-lg p-2">
                            <div className="text-yellow-200 text-xs mb-1">Style</div>
                            <div className="text-sm font-semibold truncate">{currentPlayerInfo.playingStyle || '-'}</div>
                          </div>
                          <div className="bg-black/30 rounded-lg p-2">
                            <div className="text-yellow-200 text-xs mb-1">T-Shirt</div>
                            <div className="text-xl font-bold">{currentPlayerInfo.tshirtSize || '-'}</div>
                          </div>
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  <div className="text-white text-2xl">
                    Waiting for random pick...
                  </div>
                )}
              </div>
            </div>

            {/* Previous Player Sold */}
            <div className="bg-gradient-to-r from-green-700 to-green-900 rounded-xl p-3 shadow-xl border-2 border-green-500">
              <div className="text-center">
                <div className="text-green-200 text-sm font-semibold mb-2 uppercase tracking-wider">
                  Last Player Sold
                </div>
                {previousPlayer ? (
                  <>
                    <div className="text-white text-2xl font-bold mb-2">
                      {previousPlayer.name}
                    </div>
                    <div className="flex justify-center gap-6 text-white text-base">
                      <div>
                        <span className="text-green-300">Team:</span> <span className="font-semibold">{previousPlayer.team}</span>
                      </div>
                      <div>
                        <span className="text-green-300">Points:</span> <span className="font-bold text-yellow-300">{previousPlayer.points}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-white text-lg opacity-60">
                    No player sold yet
                  </div>
                )}
              </div>
            </div>

            {/* Team Balances */}
            <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl p-3 shadow-xl border-2 border-blue-500">
              <div className="text-center mb-2">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Team Balances</h2>
              </div>
              <div className="space-y-1">
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

                  return (
                    <div key={name} className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20 flex justify-between items-center">
                      <div className="text-white font-bold text-sm truncate flex-1" title={name}>
                        {name}
                      </div>
                      <div className="text-yellow-300 font-bold text-base ml-2">
                        {remaining}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Control Panel */}
            <div className="bg-gray-800 rounded-lg p-2 border border-gray-600">
              <div className="flex items-center justify-between">
                <div className="text-gray-300 text-xs">
                  Auto-refresh: 3s
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={load}
                    className="px-3 py-1 rounded-lg bg-cricket-gold text-black text-xs font-semibold hover:bg-yellow-500 transition"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await fetch('/api/auction/state', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'clearCurrentPick' })
                        })
                        await load()
                      } catch (err) {
                        console.error('Failed to clear current pick:', err)
                      }
                    }}
                    className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
                  >
                    Clear
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
