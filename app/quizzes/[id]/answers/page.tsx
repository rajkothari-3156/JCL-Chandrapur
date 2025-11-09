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

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [quizRes, ansRes] = await Promise.all([
          fetch(`/api/quizzes/${quizId}`, { cache: 'no-store' }),
          fetch(`/api/quizzes/${quizId}/answers`, { cache: 'no-store' }),
        ])
        const quizJson = await quizRes.json()
        if (!quizRes.ok) throw new Error(quizJson?.error || 'Failed to load quiz')
        setQuiz(quizJson as Quiz)

        const ansJson = await ansRes.json()
        if (!ansRes.ok) throw new Error(ansJson?.error || 'Answers not available yet')
        const map: Record<string, number> = {}
        for (const a of (ansJson.answers as Array<{ id: string; answer: number }>)) map[a.id] = a.answer
        setAnswers(map)
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [quizId])

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Answers — {quizId}</h1>
          <a href={`/quizzes/${quizId}`} className="text-cricket-gold hover:underline">Back to Quiz</a>
        </div>
        {loading && <div className="text-green-100">Loading answers...</div>}
        {error && <div className="text-red-200">{error}</div>}
        {!loading && !error && quiz && answers && (
          <div className="space-y-4">
            {quiz.questions.map((q, qi) => {
              const idx = answers[q.id]
              const correct = typeof idx === 'number' ? q.options[idx] : ''
              return (
                <div key={q.id} className="bg-green-900/30 border border-green-800 rounded-lg p-4">
                  <div className="text-white font-medium mb-2">Q{qi + 1}. {q.text}</div>
                  <div className="text-green-100"><span className="text-cricket-gold font-semibold">Correct:</span> {correct}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
