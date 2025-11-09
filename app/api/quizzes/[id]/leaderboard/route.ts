import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

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
    const resultsPath = path.join(process.cwd(), 'public', 'data', 'quiz_results', `${id}.json`)
    let rows: StoredResult[] = []
    try {
      const text = await fs.readFile(resultsPath, 'utf8')
      rows = JSON.parse(text)
      if (!Array.isArray(rows)) rows = []
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
