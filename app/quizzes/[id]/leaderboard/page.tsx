'use client'

import React, { useEffect, useState } from 'react'

export default function QuizLeaderboardPage({ params }: { params: { id: string } }) {
  const quizId = params.id
  const [data, setData] = useState<{ id: string; leaderboard: Array<{ rank: number; name: string; phone: string; score: number; durationMs: number; submittedAt: string }> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/quizzes/${quizId}/leaderboard`, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load leaderboard')
        setData(json)
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [quizId])

  const fmt = (ms: number) => {
    const total = Math.ceil(ms / 1000)
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Leaderboard — {quizId}</h1>
          <a href={`/quizzes/${quizId}`} className="text-cricket-gold hover:underline">Back to Quiz</a>
        </div>
        {loading && <div className="text-green-100">Loading leaderboard...</div>}
        {error && <div className="text-red-200">{error}</div>}
        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-cricket-lightgreen text-white">
                  <th className="px-3 py-2 text-left">Rank</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                  <th className="px-3 py-2 text-left">Score</th>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-left">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {(data?.leaderboard ?? []).map((row, i) => (
                  <tr key={i} className={i % 2 ? 'bg-green-900/30' : 'bg-green-900/10'}>
                    <td className="px-3 py-2 text-green-100">{row.rank}</td>
                    <td className="px-3 py-2 text-green-100">{row.name}</td>
                    <td className="px-3 py-2 text-green-100">{row.phone}</td>
                    <td className="px-3 py-2 text-green-100">{row.score}</td>
                    <td className="px-3 py-2 text-green-100">{fmt(row.durationMs)}</td>
                    <td className="px-3 py-2 text-green-100">{new Date(row.submittedAt).toLocaleString()}</td>
                  </tr>
                ))}
                {(data?.leaderboard ?? []).length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-green-300" colSpan={6}>No submissions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
