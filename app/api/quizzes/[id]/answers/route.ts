import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { kv } from '@/lib/kv'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const quizPath = path.join(process.cwd(), 'public', 'data', 'quizzes', `${id}.json`)
    const text = await fs.readFile(quizPath, 'utf8')
    const quiz = JSON.parse(text)
    if (!quiz.id) quiz.id = id

    try {
      const v = await kv.get(`quiz:${quiz.id}:active`)
      if (v === true) {
        return NextResponse.json({ error: 'Answers will be available after the quiz ends.' }, { status: 403 })
      }
    } catch {}

    const answers = (quiz.questions || []).map((q: any) => ({ id: q.id, answer: q.answer }))
    return NextResponse.json({ id, answers })
  } catch (e: any) {
    return NextResponse.json({ error: 'Quiz not found', details: e?.message ?? String(e) }, { status: 404 })
  }
}
