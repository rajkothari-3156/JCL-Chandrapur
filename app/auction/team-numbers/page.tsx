'use client'

import React, { useEffect, useState } from 'react'
import { Hash, Shuffle, Trophy } from 'lucide-react'

type TeamNumberAssignment = {
  teamNumbers: Record<string, number>
  groupA: string[]
  groupB: string[]
}

export default function TeamNumbersPage() {
  const [auth, setAuth] = useState(false)
  const [password, setPassword] = useState('')
  const [state, setState] = useState<TeamNumberAssignment | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [animating, setAnimating] = useState(false)

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
      const res = await fetch('/api/auction/team-numbers', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        setState(data)
      } else {
        notify('Failed to load team numbers', 'error')
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

  const handleRandomAssignment = async () => {
    if (animating) return
    
    setAnimating(true)
    
    // Simulate animation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    try {
      const res = await fetch('/api/auction/team-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'randomize' }),
      })

      const data = await res.json()
      if (res.ok) {
        notify('Team numbers assigned successfully!', 'success')
        await loadState()
      } else {
        notify(data.error || 'Failed to assign team numbers', 'error')
      }
    } catch (e: any) {
      notify(e?.message ?? 'Unknown error', 'error')
    } finally {
      setAnimating(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset team numbers?')) return

    try {
      const res = await fetch('/api/auction/team-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })

      if (res.ok) {
        notify('Team numbers reset successfully', 'success')
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
          <h1 className="text-3xl font-bold text-cricket-gold mb-6 text-center">Team Numbers Admin</h1>
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

  const hasAssignments = state?.teamNumbers && Object.keys(state.teamNumbers).length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-black p-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white font-semibold`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Hash className="w-10 h-10 text-cricket-gold" />
            <h1 className="text-4xl font-bold text-cricket-gold">Team Numbers Assignment</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRandomAssignment}
              disabled={animating}
              className="px-6 py-3 rounded-lg bg-cricket-gold text-black font-bold hover:bg-yellow-500 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Shuffle className="w-5 h-5" />
              {animating ? 'Assigning...' : hasAssignments ? 'Reassign Numbers' : 'Assign Numbers'}
            </button>
            {hasAssignments && (
              <button
                onClick={handleReset}
                className="px-4 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {!hasAssignments ? (
          <div className="bg-green-900/30 border border-green-800 rounded-lg p-12 text-center">
            <Hash className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Team Numbers Assigned</h2>
            <p className="text-green-300 mb-6">Click "Assign Numbers" to randomly assign team numbers 1-8</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Group A */}
            <div className="bg-blue-900/30 border-2 border-blue-600 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-8 h-8 text-blue-400" />
                <h2 className="text-3xl font-bold text-white">Group A</h2>
              </div>
              <div className="space-y-3">
                {state?.groupA.map((team, idx) => (
                  <div
                    key={team}
                    className={`bg-blue-950/50 border border-blue-700 rounded-lg p-4 flex items-center justify-between ${animating ? 'animate-pulse' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl font-bold">{state.teamNumbers[team]}</span>
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">{team}</div>
                        <div className="text-blue-300 text-sm">Team #{state.teamNumbers[team]}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Group B */}
            <div className="bg-orange-900/30 border-2 border-orange-600 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-8 h-8 text-orange-400" />
                <h2 className="text-3xl font-bold text-white">Group B</h2>
              </div>
              <div className="space-y-3">
                {state?.groupB.map((team, idx) => (
                  <div
                    key={team}
                    className={`bg-orange-950/50 border border-orange-700 rounded-lg p-4 flex items-center justify-between ${animating ? 'animate-pulse' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl font-bold">{state.teamNumbers[team]}</span>
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">{team}</div>
                        <div className="text-orange-300 text-sm">Team #{state.teamNumbers[team]}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tournament Format Info */}
        {hasAssignments && (
          <div className="mt-8 bg-green-900/30 border border-green-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Tournament Format</h3>
            <div className="grid md:grid-cols-3 gap-4 text-green-200">
              <div className="bg-green-950/50 rounded-lg p-4">
                <div className="text-cricket-gold font-bold mb-2">Group Stage</div>
                <div className="text-sm">Each team plays against teams in their own group</div>
              </div>
              <div className="bg-green-950/50 rounded-lg p-4">
                <div className="text-cricket-gold font-bold mb-2">Semifinals</div>
                <div className="text-sm">Top 2 teams from each group advance</div>
              </div>
              <div className="bg-green-950/50 rounded-lg p-4">
                <div className="text-cricket-gold font-bold mb-2">Finals</div>
                <div className="text-sm">Winners of semifinals compete for championship</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
