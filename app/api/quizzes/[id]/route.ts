import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { kv } from '@/lib/kv'

async function computeWindow(quiz: any): Promise<{ active: boolean; nextOpenAt?: string | null; closesAt?: string | null }> {
  try {
    if (quiz?.id) {
      const v = await kv.get(`quiz:${quiz.id}:active`)
      if (typeof v === 'boolean') {
        return { active: v, nextOpenAt: null, closesAt: null }
      }
    }
  } catch {}
  return { active: false, nextOpenAt: null, closesAt: null }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const quizPath = path.join(process.cwd(), 'public', 'data', 'quizzes', `${id}.json`)
    const text = await fs.readFile(quizPath, 'utf8')
    const quiz = JSON.parse(text)
    // ensure quiz.id is available for KV
    if (!quiz.id) quiz.id = id
    const window = await computeWindow(quiz)
    // Strip answers; attach status
    const redacted = {
      ...quiz,
      questions: (quiz.questions || []).map((q: any) => ({ id: q.id, type: q.type, text: q.text, options: q.options })),
      status: window
    }
    return NextResponse.json(redacted)
  } catch (e: any) {
    return NextResponse.json({ error: 'Quiz not found', details: e?.message ?? String(e) }, { status: 404 })
  }
}
