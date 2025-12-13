'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Hash, Shuffle, Trophy, Calendar, Download, FileText } from 'lucide-react'

type TeamNumberAssignment = {
  teamNumbers: Record<string, number>
  groupA: string[]
  groupB: string[]
}

type Match = {
  id: string
  teamA: string
  teamB: string
  date: string
  time: string
  day: string
  matchNumber?: number
}

type PracticeSchedule = {
  matches: Match[]
  teamNumbers: Record<string, number>
  groupA: string[]
  groupB: string[]
}

type GroupStageSchedule = {
  matches: Match[]
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
  const [activeTab, setActiveTab] = useState<'numbers' | 'practice' | 'groupstage'>('numbers')
  const [practiceSchedule, setPracticeSchedule] = useState<PracticeSchedule | null>(null)
  const [groupStageSchedule, setGroupStageSchedule] = useState<GroupStageSchedule | null>(null)
  const [generatingPractice, setGeneratingPractice] = useState(false)
  const [generatingGroupStage, setGeneratingGroupStage] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

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

  const loadPracticeSchedule = async () => {
    try {
      const res = await fetch('/api/auction/practice-schedule', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        setPracticeSchedule(data)
      }
    } catch (e: any) {
      console.error('Failed to load practice schedule:', e)
    }
  }

  const loadGroupStageSchedule = async () => {
    try {
      const res = await fetch('/api/auction/group-stage-schedule', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        setGroupStageSchedule(data)
      }
    } catch (e: any) {
      console.error('Failed to load group stage schedule:', e)
    }
  }

  useEffect(() => {
    if (auth) {
      loadState()
      loadPracticeSchedule()
      loadGroupStageSchedule()
    }
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

  const handleGeneratePracticeSchedule = async () => {
    if (generatingPractice) return
    setGeneratingPractice(true)
    
    try {
      const res = await fetch('/api/auction/practice-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      })

      const data = await res.json()
      if (res.ok) {
        notify('Practice schedule generated!', 'success')
        await loadPracticeSchedule()
      } else {
        notify(data.error || 'Failed to generate practice schedule', 'error')
      }
    } catch (e: any) {
      notify(e?.message ?? 'Unknown error', 'error')
    } finally {
      setGeneratingPractice(false)
    }
  }

  const handleGenerateGroupStageSchedule = async () => {
    if (generatingGroupStage) return
    setGeneratingGroupStage(true)
    
    try {
      const res = await fetch('/api/auction/group-stage-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      })

      const data = await res.json()
      if (res.ok) {
        notify('Group stage schedule generated!', 'success')
        await loadGroupStageSchedule()
      } else {
        notify(data.error || 'Failed to generate group stage schedule', 'error')
      }
    } catch (e: any) {
      notify(e?.message ?? 'Unknown error', 'error')
    } finally {
      setGeneratingGroupStage(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      notify('Generating PDF...', 'success')
      const element = printRef.current
      if (!element) {
        notify('Content not ready for PDF generation', 'error')
        return
      }

      const html2pdf = (await import('html2pdf.js')).default
      const opt = {
        margin: 10,
        filename: 'JCL-Team-Numbers-Schedule.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      }
      
      await html2pdf().set(opt).from(element).save()
      notify('PDF downloaded successfully!', 'success')
    } catch (e: any) {
      notify('Failed to generate PDF. Please try again.', 'error')
      console.error('PDF generation error:', e)
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
            <h1 className="text-4xl font-bold text-cricket-gold">Team Numbers & Schedule</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('numbers')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === 'numbers' 
                ? 'bg-cricket-gold text-black' 
                : 'bg-green-900/30 text-green-200 hover:bg-green-900/50'
            }`}
          >
            <Hash className="w-5 h-5" />
            Team Numbers
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === 'practice' 
                ? 'bg-cricket-gold text-black' 
                : 'bg-green-900/30 text-green-200 hover:bg-green-900/50'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Practice Schedule
          </button>
          <button
            onClick={() => setActiveTab('groupstage')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === 'groupstage' 
                ? 'bg-cricket-gold text-black' 
                : 'bg-green-900/30 text-green-200 hover:bg-green-900/50'
            }`}
          >
            <Trophy className="w-5 h-5" />
            Group Stage
          </button>
        </div>

        <div ref={printRef}>
        {!hasAssignments ? (
          <div className="bg-green-900/30 border border-green-800 rounded-lg p-12 text-center">
            <Hash className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Team Numbers Assigned</h2>
            <p className="text-green-300 mb-6">Click "Assign Numbers" to randomly assign team numbers 1-8</p>
          </div>
        ) : (
          <>
          {activeTab === 'numbers' && (
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

          {/* Practice Schedule Tab */}
          {activeTab === 'practice' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Practice Match Schedule</h2>
                <button
                  onClick={handleGeneratePracticeSchedule}
                  disabled={generatingPractice}
                  className="px-4 py-2 rounded-lg bg-cricket-gold text-black font-semibold hover:bg-yellow-500 transition disabled:opacity-50"
                >
                  {generatingPractice ? 'Generating...' : practiceSchedule?.matches.length ? 'Regenerate' : 'Generate Schedule'}
                </button>
              </div>

              {!practiceSchedule?.matches.length ? (
                <div className="bg-green-900/30 border border-green-800 rounded-lg p-12 text-center">
                  <Calendar className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Practice Schedule</h3>
                  <p className="text-green-300">Generate practice matches for teams</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {['2025-12-22', '2025-12-23', '2025-12-24', '2025-12-25'].map((date, idx) => {
                    const dayMatches = practiceSchedule.matches.filter(m => m.date === date)
                    if (!dayMatches.length) return null
                    return (
                      <div key={date} className="bg-green-900/30 border border-green-800 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-cricket-gold mb-4">Day {idx + 1} - {dayMatches[0]?.day} ({date})</h3>
                        <div className="grid gap-3">
                          {dayMatches.map((match, i) => (
                            <div key={match.id} className="bg-green-950/50 border border-green-700 rounded-lg p-4 flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className="text-white font-bold">Match {i + 1}</div>
                                <div className="text-green-200">
                                  <span className="font-semibold">{match.teamA}</span>
                                  <span className="mx-2 text-cricket-gold">vs</span>
                                  <span className="font-semibold">{match.teamB}</span>
                                </div>
                              </div>
                              <div className="text-cricket-gold font-bold">{match.time}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Group Stage Schedule Tab */}
          {activeTab === 'groupstage' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Group Stage Match Schedule</h2>
                <button
                  onClick={handleGenerateGroupStageSchedule}
                  disabled={generatingGroupStage}
                  className="px-4 py-2 rounded-lg bg-cricket-gold text-black font-semibold hover:bg-yellow-500 transition disabled:opacity-50"
                >
                  {generatingGroupStage ? 'Generating...' : groupStageSchedule?.matches.length ? 'Regenerate' : 'Generate Schedule'}
                </button>
              </div>

              {!groupStageSchedule?.matches.length ? (
                <div className="bg-green-900/30 border border-green-800 rounded-lg p-12 text-center">
                  <Trophy className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Group Stage Schedule</h3>
                  <p className="text-green-300">Generate group stage matches</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group A Matches */}
                  <div className="bg-blue-900/30 border-2 border-blue-600 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-blue-400" />
                      Group A Matches
                    </h3>
                    <div className="grid gap-3">
                      {groupStageSchedule.matches
                        .filter(m => groupStageSchedule.groupA.includes(m.teamA) && groupStageSchedule.groupA.includes(m.teamB))
                        .map((match, i) => (
                          <div key={match.id} className="bg-blue-950/50 border border-blue-700 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className="text-white font-bold">Match {match.matchNumber || i + 1}</div>
                                <div className="text-blue-200">
                                  <span className="font-semibold">{match.teamA}</span>
                                  <span className="mx-2 text-cricket-gold">vs</span>
                                  <span className="font-semibold">{match.teamB}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-cricket-gold font-bold">{match.time}</div>
                                <div className="text-blue-300 text-sm">{match.day}, {match.date}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Group B Matches */}
                  <div className="bg-orange-900/30 border-2 border-orange-600 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-orange-400" />
                      Group B Matches
                    </h3>
                    <div className="grid gap-3">
                      {groupStageSchedule.matches
                        .filter(m => groupStageSchedule.groupB.includes(m.teamA) && groupStageSchedule.groupB.includes(m.teamB))
                        .map((match, i) => (
                          <div key={match.id} className="bg-orange-950/50 border border-orange-700 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className="text-white font-bold">Match {match.matchNumber || i + 1}</div>
                                <div className="text-orange-200">
                                  <span className="font-semibold">{match.teamA}</span>
                                  <span className="mx-2 text-cricket-gold">vs</span>
                                  <span className="font-semibold">{match.teamB}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-cricket-gold font-bold">{match.time}</div>
                                <div className="text-orange-300 text-sm">{match.day}, {match.date}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          </>
        )}
        </div>
      </div>
    </div>
  )
}
