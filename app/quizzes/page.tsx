'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'

type QuizIndex = {
  quizzes: Array<{ id: string; title: string; durationMinutes: number }>
}

export default function QuizzesPage() {
  const [data, setData] = useState<QuizIndex | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/quizzes', { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load quizzes')
        setData(json)
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <>
      <Navbar />
      <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg">JCL Quizzes</h1>
        {loading && <div className="text-green-100">Loading...</div>}
        {error && <div className="text-red-200">{error}</div>}
        {!loading && !error && (
          <div className="grid gap-4 md:grid-cols-2">
            {(data?.quizzes ?? []).map((q) => (
              <a key={q.id} href={`/quizzes/${q.id}`} className="block bg-green-900/30 border border-green-800 rounded-lg p-4 hover:bg-green-900/50">
                <div className="text-white font-semibold text-lg mb-1">{q.title}</div>
                <div className="text-green-200 text-sm">Duration: {q.durationMinutes} minutes</div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
    </>
  )
}
