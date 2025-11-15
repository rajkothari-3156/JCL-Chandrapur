'use client'

import React, { useEffect, useState } from 'react'

type QuizIdx = { quizzes: Array<{ id: string; title: string }> }

type Item = { id: string; title: string; active: boolean | null; saving: boolean }

export default function AdminQuizTogglePage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/quizzes', { cache: 'no-store' })
        const data: QuizIdx = await res.json()
        if (!res.ok) throw new Error((data as any)?.error || 'Failed to load quizzes')
        const base: Item[] = (data.quizzes || []).map((q) => ({ id: q.id, title: q.title, active: null, saving: false }))
        setItems(base)
        await Promise.all(
          base.map(async (q) => {
            try {
              const r = await fetch(`/api/quizzes/${q.id}/active`, { cache: 'no-store' })
              const j = await r.json()
              const v = typeof j?.active === 'boolean' ? j.active : null
              setItems((prev) => prev.map((p) => (p.id === q.id ? { ...p, active: v } : p)))
            } catch {}
          })
        )
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggle = async (id: string, next: boolean) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, saving: true } : p)))
    try {
      const res = await fetch(`/api/quizzes/${id}/active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: next }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed to update')
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, active: j.active === true, saving: false } : p)))
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update')
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, saving: false } : p)))
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 drop-shadow-lg">Quiz Admin</h1>
        {loading && <div className="text-green-100">Loading...</div>}
        {error && <div className="text-red-200">{error}</div>}
        {!loading && !error && (
          <div className="space-y-3">
            {items.map((q) => (
              <div key={q.id} className="flex items-center justify-between bg-green-900/30 border border-green-800 rounded-lg p-4">
                <div>
                  <div className="text-white font-semibold">{q.title}</div>
                  <div className="text-green-200 text-sm">ID: {q.id}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={q.active ? 'text-cricket-gold' : 'text-green-200'}>{q.active ? 'ON' : 'OFF'}</span>
                  <button
                    disabled={q.saving}
                    onClick={() => toggle(q.id, !(q.active === true))}
                    className={`px-3 py-1 rounded-md border ${q.saving ? 'opacity-60' : ''} ${q.active ? 'border-cricket-gold text-black bg-cricket-gold' : 'border-green-700 text-green-100'}`}
                  >
                    {q.saving ? 'Saving...' : q.active ? 'Turn Off' : 'Turn On'}
                  </button>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
