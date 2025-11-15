'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'

type Quiz = {
  id: string
  title: string
  durationMinutes: number
  questions: Array<{ id: string; type: 'mcq'; text: string; options: string[] }>
  status?: { active: boolean; nextOpenAt?: string | null; closesAt?: string | null }
}

export default function QuizRunPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const quizId = params.id

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<{ active: boolean; nextOpenAt?: string | null; closesAt?: string | null } | null>(null)

  // User details and answers
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [answers, setAnswers] = useState<Record<string, number | null>>({})

  // Timer
  const [remaining, setRemaining] = useState<number>(0)
  const startedAtRef = useRef<string | null>(null)
  const tickRef = useRef<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/quizzes/${quizId}`, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load quiz')
        setQuiz(json)
        setStatus(json.status || null)
        // Init answers
        const init: Record<string, number | null> = {}
        for (const q of json.questions) init[q.id] = null
        setAnswers(init)

        // Start timer only if quiz is active
        if (json?.status?.active) {
          startedAtRef.current = new Date().toISOString()
          const durationMs = (json.durationMinutes ?? 15) * 60 * 1000
          const deadline = Date.now() + durationMs
          setRemaining(durationMs)
          tickRef.current = window.setInterval(() => {
            const r = Math.max(0, deadline - Date.now())
            setRemaining(r)
            if (r <= 0 && tickRef.current) {
              window.clearInterval(tickRef.current)
              tickRef.current = null
            }
          }, 250)
        } else {
          setRemaining(0)
        }
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
    }
  }, [quizId])

  const mmss = useMemo(() => {
    const total = Math.ceil(remaining / 1000)
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [remaining])

  const handlePick = (qid: string, idx: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: idx }))
  }

  const submittingRef = useRef(false)
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (submittingRef.current) return
    setSubmitMsg(null)

    if (!name.trim() || !phone.trim()) {
      setSubmitMsg('Please enter your name and phone number')
      return
    }

    submittingRef.current = true
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        answers: Object.entries(answers).map(([id, ans]) => ({ id, answer: ans })),
        startedAt: startedAtRef.current || new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      }
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to submit')
      setSubmitMsg(`Submitted! Score ${json.score}/${json.total}`)
      // Redirect to leaderboard after short delay
      setTimeout(() => router.push(`/quizzes/${quizId}/leaderboard`), 1000)
    } catch (e: any) {
      setSubmitMsg(e?.message ?? 'Submission failed')
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {loading && <div className="text-green-100">Loading quiz...</div>}
        {error && <div className="text-red-200">{error}</div>}
        {!loading && !error && quiz && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">{quiz.title}</h1>
              <div className={`px-3 py-1 rounded-md border ${status?.active ? 'border-green-700 text-cricket-gold' : 'border-red-800 text-red-300'}`}>{status?.active ? `Time Left: ${mmss}` : 'Quiz not active'}</div>
            </div>

            {!status?.active && (
              <div className="bg-yellow-900/20 border border-yellow-700 text-yellow-200 rounded-md p-3">
                <div className="font-semibold text-white">Quiz is not active right now.</div>
                <div>Please check back later when the quiz is turned on by the admins.</div>
              </div>
            )}

            {status?.active && (
              <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-green-200 text-sm mb-1">Your Name</label>
                  <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full rounded-md border border-green-800 bg-green-900/40 text-white px-3 py-2" placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-green-200 text-sm mb-1">Phone Number</label>
                  <input value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full rounded-md border border-green-800 bg-green-900/40 text-white px-3 py-2" placeholder="Phone" />
                </div>
              </div>
            )}

            {status?.active && (
              <div className="space-y-4">
                {quiz.questions.map((q, qi) => (
                  <div key={q.id} className="bg-green-900/30 border border-green-800 rounded-lg p-4">
                    <div className="text-white font-medium mb-2">Q{qi+1}. {q.text}</div>
                    <div className="grid gap-2">
                      {q.options.map((opt, idx) => {
                        const picked = answers[q.id] === idx
                        return (
                          <label key={idx} className={`flex items-center gap-2 p-2 rounded border ${picked ? 'border-cricket-gold bg-green-900/60' : 'border-green-800 hover:bg-green-900/40'}`}>
                            <input type="radio" name={q.id} checked={picked} onChange={()=>handlePick(q.id, idx)} />
                            <span className="text-green-100">{opt}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              {status?.active && (
                <button onClick={handleSubmit} disabled={remaining<=0} className="px-4 py-2 rounded-md bg-cricket-gold text-black font-semibold disabled:opacity-50">Submit</button>
              )}
              {submitMsg && <div className="text-green-100 text-sm">{submitMsg}</div>}
              <a href={`/quizzes/${quizId}/leaderboard`} className="ml-auto text-cricket-gold hover:underline">View Leaderboard</a>
              <a href={`/quizzes/${quizId}/answers`} className="text-cricket-gold hover:underline">Answers</a>
            </div>
          </div>
        )}
      </div>
    </main>
    </>
  )
}
