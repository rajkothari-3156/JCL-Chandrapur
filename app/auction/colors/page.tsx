'use client'

import React, { useEffect, useState } from 'react'
import { Palette, Trophy, Shuffle } from 'lucide-react'

type ColorOption = {
  name: string
  hex: string
  textColor: string
}

type ColorAuction = {
  colors: Record<string, { owner: string; bidAmount: number } | null>
  owners: string[]
  ownerTeams: Record<string, string>
}

const AVAILABLE_COLORS: ColorOption[] = [
  { name: 'Orange', hex: '#FF6B35', textColor: '#000000' },
  { name: 'Yellow', hex: '#FFD23F', textColor: '#000000' },
  { name: 'Royal Blue', hex: '#0047AB', textColor: '#FFFFFF' },
  { name: 'Red', hex: '#DC143C', textColor: '#FFFFFF' },
  { name: 'Black', hex: '#000000', textColor: '#FFFFFF' },
  { name: 'White', hex: '#FFFFFF', textColor: '#000000' },
  { name: 'Grey', hex: '#808080', textColor: '#FFFFFF' },
  { name: 'Dark Green', hex: '#006400', textColor: '#FFFFFF' },
]

export default function ColorAuctionPage() {
  const [auth, setAuth] = useState(false)
  const [password, setPassword] = useState('')
  const [state, setState] = useState<ColorAuction | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [bidOwner, setBidOwner] = useState('')
  const [bidAmount, setBidAmount] = useState<number | ''>('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [randomPickAnimating, setRandomPickAnimating] = useState(false)
  const [randomPickResult, setRandomPickResult] = useState<{ color: string; owner: string } | null>(null)

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message })
    window.clearTimeout((notify as any)._t)
    ;(notify as any)._t = window.setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const saved = localStorage.getItem('auction_admin')
    if (saved === '1') setAuth(true)
  }, [])

  const loadState = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auction/colors', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        setState(data)
      } else {
        notify('Failed to load color auction state', 'error')
      }
    } catch (e: any) {
      notify(e?.message ?? 'Unknown error', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (auth) loadState()
  }, [auth])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'jcl2025') {
      setAuth(true)
      localStorage.setItem('auction_admin', '1')
    } else {
      notify('Incorrect password', 'error')
    }
  }

  const handleBid = async () => {
    if (!selectedColor || !bidOwner || !bidAmount) {
      notify('Please select color, owner, and bid amount', 'error')
      return
    }

    try {
      const res = await fetch('/api/auction/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bid',
          color: selectedColor,
          owner: bidOwner,
          bidAmount: Number(bidAmount),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        notify(`${bidOwner} won ${selectedColor} for ${bidAmount}!`, 'success')
        setSelectedColor(null)
        setBidOwner('')
        setBidAmount('')
        await loadState()
      } else {
        notify(data.error || 'Failed to place bid', 'error')
      }
    } catch (e: any) {
      notify(e?.message ?? 'Unknown error', 'error')
    }
  }

  const handleRandomPick = async () => {
    if (randomPickAnimating) return

    const unsoldColors = AVAILABLE_COLORS.filter(c => !state?.colors[c.name])
    const ownersWithoutColor = state?.owners.filter(owner => 
      !Object.values(state?.colors || {}).some(c => c?.owner === owner)
    ) || []

    if (!unsoldColors.length) {
      notify('All colors have been assigned', 'error')
      return
    }

    if (!ownersWithoutColor.length) {
      notify('All owners have colors', 'error')
      return
    }

    setRandomPickAnimating(true)
    setRandomPickResult(null)

    const duration = 2500
    const tick = 100
    const start = Date.now()
    let finalColor = ''
    let finalOwner = ''

    const timer = setInterval(() => {
      const colorIdx = Math.floor(Math.random() * unsoldColors.length)
      const ownerIdx = Math.floor(Math.random() * ownersWithoutColor.length)
      finalColor = unsoldColors[colorIdx].name
      finalOwner = ownersWithoutColor[ownerIdx]
      setRandomPickResult({ color: finalColor, owner: finalOwner })

      if (Date.now() - start > duration) {
        clearInterval(timer)
        setRandomPickAnimating(false)
      }
    }, tick)
  }

  const confirmRandomPick = async () => {
    if (!randomPickResult) return

    try {
      const res = await fetch('/api/auction/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bid',
          color: randomPickResult.color,
          owner: randomPickResult.owner,
          bidAmount: 0,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        notify(`${randomPickResult.owner} assigned ${randomPickResult.color}!`, 'success')
        setRandomPickResult(null)
        await loadState()
      } else {
        notify(data.error || 'Failed to assign color', 'error')
      }
    } catch (e: any) {
      notify(e?.message ?? 'Unknown error', 'error')
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset the color auction?')) return

    try {
      const res = await fetch('/api/auction/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })

      if (res.ok) {
        notify('Color auction reset successfully', 'success')
        await loadState()
      } else {
        notify('Failed to reset', 'error')
      }
    } catch (e: any) {
      notify(e?.message ?? 'Unknown error', 'error')
    }
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-black flex items-center justify-center p-4">
        <div className="bg-green-900/50 border-2 border-cricket-gold rounded-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-cricket-gold mb-6 text-center">Color Auction Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 rounded-lg bg-green-950 border border-green-700 text-white"
            />
            <button type="submit" className="w-full px-4 py-2 rounded-lg bg-cricket-gold text-black font-semibold">
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  const soldColors = Object.entries(state?.colors || {}).filter(([_, v]) => v !== null)
  const unsoldColors = AVAILABLE_COLORS.filter(c => !state?.colors[c.name])
  const ownersWithoutColor = state?.owners.filter(owner => 
    !Object.values(state?.colors || {}).some(c => c?.owner === owner)
  ) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-black p-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white font-semibold`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Palette className="w-10 h-10 text-cricket-gold" />
            <h1 className="text-4xl font-bold text-cricket-gold">Color Auction</h1>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
          >
            Reset Auction
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
            <div className="text-green-300 text-sm mb-1">Total Colors</div>
            <div className="text-white text-3xl font-bold">{AVAILABLE_COLORS.length}</div>
          </div>
          <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4">
            <div className="text-blue-300 text-sm mb-1">Sold Colors</div>
            <div className="text-white text-3xl font-bold">{soldColors.length}</div>
          </div>
          <div className="bg-orange-900/30 border border-orange-800 rounded-lg p-4">
            <div className="text-orange-300 text-sm mb-1">Available Colors</div>
            <div className="text-white text-3xl font-bold">{unsoldColors.length}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Bidding Section */}
          <div className="bg-green-900/30 border border-green-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-cricket-gold" />
              Place Bid
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-green-200 text-sm mb-2 block">Select Color</label>
                <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                  {AVAILABLE_COLORS.map(color => {
                    const isSold = !!state?.colors[color.name]
                    return (
                      <button
                        key={color.name}
                        onClick={() => !isSold && setSelectedColor(color.name)}
                        disabled={isSold}
                        className={`p-3 rounded-lg border-2 transition ${
                          selectedColor === color.name
                            ? 'border-cricket-gold scale-105'
                            : isSold
                            ? 'border-gray-600 opacity-40 cursor-not-allowed'
                            : 'border-green-700 hover:border-green-500'
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        <div className={`font-bold text-sm`} style={{ color: color.textColor }}>
                          {color.name}
                        </div>
                        {isSold && (
                          <div className="text-xs mt-1" style={{ color: color.textColor }}>
                            SOLD
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-green-200 text-sm mb-2 block">Team Owner</label>
                <select
                  value={bidOwner}
                  onChange={(e) => setBidOwner(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-green-950 border border-green-700 text-white"
                >
                  <option value="">Select Team Owner</option>
                  {state?.owners.map(owner => (
                    <option key={owner} value={owner}>
                      {owner} {state?.ownerTeams?.[owner] ? `(${state.ownerTeams[owner]})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-green-200 text-sm mb-2 block">Bid Amount</label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Enter bid amount"
                  className="w-full px-4 py-2 rounded-lg bg-green-950 border border-green-700 text-white"
                />
              </div>

              <button
                onClick={handleBid}
                disabled={!selectedColor || !bidOwner || !bidAmount}
                className="w-full px-4 py-3 rounded-lg bg-cricket-gold text-black font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-500 transition"
              >
                Confirm Bid
              </button>
            </div>
          </div>

          {/* Random Pick Section */}
          <div className="bg-purple-900/30 border border-purple-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Shuffle className="w-6 h-6 text-purple-400" />
              Random Pick
            </h2>

            <div className="space-y-4">
              <div className="text-purple-200 text-sm">
                Owners without color: <span className="font-bold">{ownersWithoutColor.length}</span>
              </div>

              {randomPickResult && (
                <div className={`p-6 rounded-lg border-2 ${randomPickAnimating ? 'animate-pulse border-purple-500' : 'border-cricket-gold'}`}>
                  <div className="text-center">
                    <div className="text-white text-xl mb-3">
                      {randomPickAnimating ? 'Picking...' : 'Result'}
                    </div>
                    <div
                      className="w-full h-24 rounded-lg mb-3 flex items-center justify-center"
                      style={{ backgroundColor: AVAILABLE_COLORS.find(c => c.name === randomPickResult.color)?.hex }}
                    >
                      <div
                        className="text-2xl font-bold"
                        style={{ color: AVAILABLE_COLORS.find(c => c.name === randomPickResult.color)?.textColor }}
                      >
                        {randomPickResult.color}
                      </div>
                    </div>
                    <div className="text-white text-xl font-bold">
                      {randomPickResult.owner}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleRandomPick}
                disabled={randomPickAnimating || !unsoldColors.length || !ownersWithoutColor.length}
                className="w-full px-4 py-3 rounded-lg bg-purple-600 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition"
              >
                {randomPickAnimating ? 'Picking...' : 'Start Random Pick'}
              </button>

              {randomPickResult && !randomPickAnimating && (
                <button
                  onClick={confirmRandomPick}
                  className="w-full px-4 py-3 rounded-lg bg-cricket-gold text-black font-bold text-lg hover:bg-yellow-500 transition"
                >
                  Confirm Assignment
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sold Colors Table */}
        <div className="mt-8 bg-green-900/30 border border-green-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Sold Colors</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-green-700">
                  <th className="text-left text-green-200 py-2 px-4">Color</th>
                  <th className="text-left text-green-200 py-2 px-4">Team Name</th>
                  <th className="text-left text-green-200 py-2 px-4">Owner</th>
                  <th className="text-left text-green-200 py-2 px-4">Bid Amount</th>
                </tr>
              </thead>
              <tbody>
                {soldColors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-green-300 py-8">
                      No colors sold yet
                    </td>
                  </tr>
                ) : (
                  soldColors.map(([colorName, data]) => {
                    const colorInfo = AVAILABLE_COLORS.find(c => c.name === colorName)
                    const teamName = data?.owner ? state?.ownerTeams?.[data.owner] : null
                    return (
                      <tr key={colorName} className="border-b border-green-800">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded border-2 border-white"
                              style={{ backgroundColor: colorInfo?.hex }}
                            />
                            <span className="text-white font-semibold">{colorName}</span>
                          </div>
                        </td>
                        <td className="text-white font-semibold py-3 px-4">{teamName || '—'}</td>
                        <td className="text-white py-3 px-4">{data?.owner}</td>
                        <td className="text-cricket-gold font-bold py-3 px-4">
                          {data?.bidAmount === 0 ? 'Random Pick' : `₹${data?.bidAmount}`}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
