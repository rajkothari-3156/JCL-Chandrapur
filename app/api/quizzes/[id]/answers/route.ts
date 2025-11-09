import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

function nowInIST() {
  const nowUtc = new Date()
  return new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000))
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const quizPath = path.join(process.cwd(), 'public', 'data', 'quizzes', `${id}.json`)
    const text = await fs.readFile(quizPath, 'utf8')
    const quiz = JSON.parse(text)

    // Only allow answers after the weekly window closes (if defined)
    const ww = quiz?.weeklyWindow
    if (ww) {
      const istNow = nowInIST()
      const day = istNow.getUTCDay()
      const [sh, sm] = String(ww.start || '20:00').split(':').map((x: string)=>parseInt(x,10))
      const [eh, em] = String(ww.end || '20:15').split(':').map((x: string)=>parseInt(x,10))
      const isToday = day === (ww.dayOfWeek ?? 0)
      const endIST = new Date(istNow); endIST.setUTCHours(eh, em, 0, 0)
      const startIST = new Date(istNow); startIST.setUTCHours(sh, sm, 0, 0)
      const active = isToday && istNow >= startIST && istNow <= endIST
      const beforeWindowToday = isToday && istNow < endIST
      if (active || beforeWindowToday) {
        return NextResponse.json({ error: 'Answers will be available after the quiz window closes.' }, { status: 403 })
      }
    }

    const answers = (quiz.questions || []).map((q: any) => ({ id: q.id, answer: q.answer }))
    return NextResponse.json({ id, answers })
  } catch (e: any) {
    return NextResponse.json({ error: 'Quiz not found', details: e?.message ?? String(e) }, { status: 404 })
  }
}
