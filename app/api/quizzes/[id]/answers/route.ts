import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const quizPath = path.join(process.cwd(), 'public', 'data', 'quizzes', `${id}.json`)
    const text = await fs.readFile(quizPath, 'utf8')
    const quiz = JSON.parse(text)

    // Only allow answers after the weekly window closes (if defined), using IST arithmetic
    const ww = quiz?.weeklyWindow
    if (ww) {
      const nowUtc = new Date()
      const IST_OFFSET_MIN = 330
      const istNow = new Date(nowUtc.getTime() + IST_OFFSET_MIN * 60 * 1000)
      const istY = istNow.getUTCFullYear()
      const istM = istNow.getUTCMonth()
      const istD = istNow.getUTCDate()
      const istDow = istNow.getUTCDay()
      const targetDow = ww.dayOfWeek ?? 0
      const [sh, sm] = String(ww.start || '20:00').split(':').map((x: string)=>parseInt(x,10))
      const [eh, em] = String(ww.end || '20:15').split(':').map((x: string)=>parseInt(x,10))
      const endUtcMs = Date.UTC(istY, istM, istD, eh, em) - IST_OFFSET_MIN * 60 * 1000
      const nowMs = nowUtc.getTime()
      const isToday = istDow === targetDow
      // If it's the quiz day and we haven't passed end time yet, block
      if (isToday && nowMs < endUtcMs) {
        return NextResponse.json({ error: 'Answers will be available after the quiz window closes.' }, { status: 403 })
      }
    }

    const answers = (quiz.questions || []).map((q: any) => ({ id: q.id, answer: q.answer }))
    return NextResponse.json({ id, answers })
  } catch (e: any) {
    return NextResponse.json({ error: 'Quiz not found', details: e?.message ?? String(e) }, { status: 404 })
  }
}
