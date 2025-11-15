'use client'

import React, { useEffect, useState } from 'react'

type Quiz = {
  id: string
  title: string
  durationMinutes: number
  questions: Array<{ id: string; type: 'mcq'; text: string; options: string[] }>
  status?: { active: boolean; nextOpenAt?: string | null; closesAt?: string | null }
}

export default function QuizAnswersPage({ params }: { params: { id: string } }) {
  const quizId = params.id
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [answers, setAnswers] = useState<Record<string, number> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')

  const loadWithPassword = async (pwd: string) => {
    setLoading(true)
    setError(null)
    try {
      const quizRes = await fetch(`/api/quizzes/${quizId}`, { cache: 'no-store' })
      const quizJson = await quizRes.json()
      if (!quizRes.ok) throw new Error(quizJson?.error || 'Failed to load quiz')
      setQuiz(quizJson as Quiz)

      const ansRes = await fetch(`/api/quizzes/${quizId}/answers?password=${encodeURIComponent(pwd)}`, { cache: 'no-store' })
      const ansJson = await ansRes.json()
      if (!ansRes.ok) throw new Error(ansJson?.error || 'Answers not available yet')
      const map: Record<string, number> = {}
      for (const a of (ansJson.answers as Array<{ id: string; answer: number }>)) map[a.id] = a.answer
      setAnswers(map)
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error')
      setAnswers(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Do not auto-load answers; require password first
    const init = async () => {
      setLoading(true)
      setError(null)
      try {
        const quizRes = await fetch(`/api/quizzes/${quizId}`, { cache: 'no-store' })
        const quizJson = await quizRes.json()
        if (!quizRes.ok) throw new Error(quizJson?.error || 'Failed to load quiz')
        setQuiz(quizJson as Quiz)
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [quizId])

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Answers — {quizId}</h1>
          <a href={`/quizzes/${quizId}`} className="text-cricket-gold hover:underline">Back to Quiz</a>
        </div>
        {loading && <div className="text-green-100">Loading...</div>}
        {error && <div className="text-red-200 mb-3">{error}</div>}
        {!loading && quiz && (
          <>
            <div className="mb-4 flex flex-col md:flex-row md:items-end md:space-x-3 space-y-2 md:space-y-0">
              <div className="flex-1">
                <label className="block text-green-200 text-sm mb-1">Password to view answers</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-green-800 bg-green-900/40 text-white px-3 py-2"
                  placeholder="Enter password"
                />
              </div>
              <button
                onClick={() => password && loadWithPassword(password)}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-cricket-gold text-green-950 font-semibold hover:bg-yellow-400 disabled:opacity-60"
                disabled={!password || loading}
              >
                Load Answers
              </button>
            </div>

            {answers && (
              <div className="overflow-x-auto rounded-lg shadow-lg bg-green-900/30 border border-green-800">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-cricket-lightgreen text-white">
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Question</th>
                      <th className="px-3 py-2 text-left">Correct Option</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quiz.questions.map((q, qi) => {
                      const idx = answers[q.id]
                      const correct = typeof idx === 'number' ? q.options[idx] : ''
                      return (
                        <tr key={q.id} className={qi % 2 ? 'bg-green-900/30' : 'bg-green-900/10'}>
                          <td className="px-3 py-2 text-green-100 align-top">{qi + 1}</td>
                          <td className="px-3 py-2 text-green-100 align-top max-w-xl">{q.text}</td>
                          <td className="px-3 py-2 text-cricket-gold font-semibold align-top">{correct}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
