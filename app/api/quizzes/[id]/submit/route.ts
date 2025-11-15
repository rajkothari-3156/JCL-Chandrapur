import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { kv } from '@/lib/kv'

type Submission = {
  name: string
  phone: string
  answers: Array<{ id: string; answer: number | null }>
  startedAt: string
  submittedAt: string
}

type StoredResult = {
  name: string
  phone: string
  score: number
  durationMs: number
  startedAt: string
  submittedAt: string
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body: Submission = await req.json()
    if (!body?.name || !body?.phone || !Array.isArray(body?.answers) || !body?.startedAt) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Load quiz with answers to compute score
    const quizPath = path.join(process.cwd(), 'public', 'data', 'quizzes', `${id}.json`)
    const quizText = await fs.readFile(quizPath, 'utf8')
    const quiz = JSON.parse(quizText)
    if (!quiz.id) quiz.id = id

    try {
      const v = await kv.get(`quiz:${quiz.id}:active`)
      if (v !== true) {
        return NextResponse.json({ error: 'Quiz is currently turned off.' }, { status: 403 })
      }
    } catch {}
    const keyById = new Map<string, number>()
    for (const q of quiz.questions || []) {
      if (q && typeof q.id === 'string' && typeof q.answer === 'number') {
        keyById.set(q.id, q.answer)
      }
    }

    let score = 0
    for (const a of body.answers) {
      if (!a) continue
      const correct = keyById.get(a.id)
      if (typeof correct === 'number' && a.answer === correct) score += 1
    }

    const startedAt = new Date(body.startedAt)
    const submittedAt = new Date()
    const durationMs = Math.max(0, submittedAt.getTime() - (isNaN(+startedAt) ? submittedAt.getTime() : startedAt.getTime()))

    const result: StoredResult = {
      name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      score,
      durationMs,
      startedAt: startedAt.toISOString(),
      submittedAt: submittedAt.toISOString(),
    }

    // Append to results file per quiz (best-effort; ignore read-only FS errors in production)
    try {
      const resultsDir = path.join(process.cwd(), 'public', 'data', 'quiz_results')
      const resultsPath = path.join(resultsDir, `${id}.json`)
      await fs.mkdir(resultsDir, { recursive: true })
      let existing: StoredResult[] = []
      try {
        const existingText = await fs.readFile(resultsPath, 'utf8')
        existing = JSON.parse(existingText)
        if (!Array.isArray(existing)) existing = []
      } catch {}
      existing.push(result)
      await fs.writeFile(resultsPath, JSON.stringify(existing, null, 2), 'utf8')
    } catch (e: any) {
      // In serverless/read-only environments, just skip persisting results
      if (e && e.code !== 'EROFS') {
        console.error('Failed to persist quiz results', e)
      }
    }

    // Do not return correct answers; only score
    return NextResponse.json({ ok: true, score, total: (quiz.questions || []).length })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to submit quiz', details: e?.message ?? String(e) }, { status: 500 })
  }
}
