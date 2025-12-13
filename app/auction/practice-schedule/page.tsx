'use client'

import React, { useEffect, useState } from 'react'
import { Calendar, Clock, Shuffle } from 'lucide-react'

type Match = {
  id: string
  teamA: string
  teamB: string
  date: string
  time: string
  day: string
}

type PracticeSchedule = {
  matches: Match[]
  teamNumbers: Record<string, number>
  groupA: string[]
  groupB: string[]
}

const DAYS = [
  { date: '2024-12-22', day: 'Monday', label: 'Day 1' },
  { date: '2024-12-23', day: 'Tuesday', label: 'Day 2' },
  { date: '2024-12-24', day: 'Wednesday', label: 'Day 3' },
  { date: '2024-12-25', day: 'Thursday', label: 'Day 4' },
]

const TIME_SLOTS = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM',
  '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM',
]

export default function PracticeSchedulePage() {
  const [auth, setAuth] = useState(false)
  const [password, setPassword] = useState('')
  const [state, setState] = useState<PracticeSchedule | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [animating, setAnimating] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string>('all')

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
      const res = await fetch('/api/auction/practice-schedule', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        setState(data)
      } else {
        notify('Failed to load practice schedule', 'error')
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

  const handleGenerateSchedule = async () => {
    if (animating) return
    
    setAnimating(true)
    
    // Simulate animation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    try {
      const res = await fetch('/api/auction/practice-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      })

      const data = await res.json()
      if (res.ok) {
        notify('Practice schedule generated successfully!', 'success')
        await loadState()
      } else {
        notify(data.error || 'Failed to generate schedule', 'error')
      }
    } catch (e: any) {
      notify(e?.message ?? 'Unknown error', 'error')
    } finally {
      setAnimating(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset the practice schedule?')) return

    try {
      const res = await fetch('/api/auction/practice-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })

      if (res.ok) {
        notify('Practice schedule reset successfully', 'success')
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
          <h1 className="text-3xl font-bold text-cricket-gold mb-6 text-center">Practice Schedule Admin</h1>
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

  const hasSchedule = state?.matches && state.matches.length > 0
  const filteredMatches = selectedDay === 'all' 
    ? state?.matches || []
    : state?.matches.filter(m => m.date === selectedDay) || []

  const getTeamGroup = (team: string) => {
    if (state?.groupA.includes(team)) return 'A'
    if (state?.groupB.includes(team)) return 'B'
    return '?'
  }

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
            <Calendar className="w-10 h-10 text-cricket-gold" />
            <div>
              <h1 className="text-4xl font-bold text-cricket-gold">Practice Match Schedule</h1>
              <p className="text-green-300 text-sm mt-1">December 22-25, 2024</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerateSchedule}
              disabled={animating}
              className="px-6 py-3 rounded-lg bg-cricket-gold text-black font-bold hover:bg-yellow-500 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Shuffle className="w-5 h-5" />
              {animating ? 'Generating...' : hasSchedule ? 'Regenerate Schedule' : 'Generate Schedule'}
            </button>
            {hasSchedule && (
              <button
                onClick={handleReset}
                className="px-4 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
          <h3 className="text-blue-200 font-bold mb-2">Practice Match Format</h3>
          <ul className="text-blue-300 text-sm space-y-1">
            <li>• Each team plays 4 practice matches against 4 teams from the opposite group</li>
            <li>• Matches are scheduled across 4 days (Monday to Thursday, Dec 22-25)</li>
            <li>• Each team gets a different time slot each day (no team plays at the same time twice)</li>
            <li>• One hour per match slot</li>
          </ul>
        </div>

        {!hasSchedule ? (
          <div className="bg-green-900/30 border border-green-800 rounded-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Schedule Generated</h2>
            <p className="text-green-300 mb-6">Click "Generate Schedule" to create practice match schedule</p>
          </div>
        ) : (
          <>
            {/* Day Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedDay('all')}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                  selectedDay === 'all'
                    ? 'bg-cricket-gold text-black'
                    : 'bg-green-900/50 text-green-200 hover:bg-green-800/50'
                }`}
              >
                All Days
              </button>
              {DAYS.map(d => (
                <button
                  key={d.date}
                  onClick={() => setSelectedDay(d.date)}
                  className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                    selectedDay === d.date
                      ? 'bg-cricket-gold text-black'
                      : 'bg-green-900/50 text-green-200 hover:bg-green-800/50'
                  }`}
                >
                  {d.label} - {d.day}
                </button>
              ))}
            </div>

            {/* Schedule Grid */}
            <div className="grid gap-4">
              {DAYS.filter(d => selectedDay === 'all' || selectedDay === d.date).map(day => {
                const dayMatches = state.matches.filter(m => m.date === day.date)
                return (
                  <div key={day.date} className="bg-green-900/30 border border-green-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Clock className="w-6 h-6 text-cricket-gold" />
                      <div>
                        <h3 className="text-2xl font-bold text-white">{day.day}, {day.label}</h3>
                        <p className="text-green-300 text-sm">{new Date(day.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div className="ml-auto text-green-300 text-sm">
                        {dayMatches.length} matches
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dayMatches.sort((a, b) => a.time.localeCompare(b.time)).map(match => (
                        <div
                          key={match.id}
                          className="bg-green-950/50 border border-green-700 rounded-lg p-4 hover:border-cricket-gold transition"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-cricket-gold" />
                            <span className="text-cricket-gold font-bold">{match.time}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-white font-semibold text-sm">{match.teamA}</div>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                getTeamGroup(match.teamA) === 'A' ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'
                              }`}>
                                {state.teamNumbers[match.teamA] || '?'}
                              </div>
                            </div>
                            <div className="text-center text-green-400 text-xs font-bold">VS</div>
                            <div className="flex items-center justify-between">
                              <div className="text-white font-semibold text-sm">{match.teamB}</div>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                getTeamGroup(match.teamB) === 'A' ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'
                              }`}>
                                {state.teamNumbers[match.teamB] || '?'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Team Schedule Summary */}
            <div className="mt-8 bg-green-900/30 border border-green-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Team Schedule Summary</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[...(state.groupA || []), ...(state.groupB || [])].map(team => {
                  const teamMatches = state.matches.filter(m => m.teamA === team || m.teamB === team)
                  return (
                    <div key={team} className="bg-green-950/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white font-bold">{team}</div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          getTeamGroup(team) === 'A' ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'
                        }`}>
                          {state.teamNumbers[team]}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {teamMatches.map(m => (
                          <div key={m.id} className="text-green-300 text-xs flex justify-between">
                            <span>{DAYS.find(d => d.date === m.date)?.day}</span>
                            <span className="text-cricket-gold">{m.time}</span>
                            <span>vs {m.teamA === team ? m.teamB : m.teamA}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
