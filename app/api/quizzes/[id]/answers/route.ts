import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { kv } from '@/lib/kv'

const ANSWERS_PASSWORD = 'ForClarity@123'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const url = new URL(req.url)
    const password = url.searchParams.get('password') || ''
    if (password !== ANSWERS_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }
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
