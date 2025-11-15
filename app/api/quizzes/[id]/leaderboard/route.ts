import { NextResponse } from 'next/server'
import { kv } from '@/lib/kv'

type StoredResult = {
  name: string
  phone: string
  score: number
  durationMs: number
  startedAt: string
  submittedAt: string
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const resultsKey = `quiz:${id}:results`
    let rows: StoredResult[] = []
    try {
      const existing = (await kv.get(resultsKey)) as StoredResult[] | null
      if (Array.isArray(existing)) rows = existing
    } catch {}

    rows.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.durationMs !== b.durationMs) return a.durationMs - b.durationMs
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    })

    const redacted = rows.map((r, i) => ({
      rank: i + 1,
      name: r.name,
      phone: r.phone.replace(/(\d{3})\d+(\d{2})$/, '$1****$2'),
      score: r.score,
      durationMs: r.durationMs,
      submittedAt: r.submittedAt,
    }))

    return NextResponse.json({ id, leaderboard: redacted })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to load leaderboard', details: e?.message ?? String(e) }, { status: 500 })
  }
}
