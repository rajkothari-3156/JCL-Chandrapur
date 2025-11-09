import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

function nowInIST() {
  // IST is UTC+5:30, no DST
  const nowUtc = new Date()
  return new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000))
}

function computeWindow(quiz: any) {
  const ww = quiz?.weeklyWindow
  if (!ww) return { active: true }
  const istNow = nowInIST()
  const day = istNow.getUTCDay() // after shifting to IST, using UTC methods corresponds to IST-based weekday
  const isToday = day === (ww.dayOfWeek ?? 0)
  // Build today's start/end in IST
  const [sh, sm] = String(ww.start || '20:00').split(':').map((x: string)=>parseInt(x,10))
  const [eh, em] = String(ww.end || '20:15').split(':').map((x: string)=>parseInt(x,10))
  const startIST = new Date(istNow)
  startIST.setUTCHours(sh, sm, 0, 0)
  const endIST = new Date(istNow)
  endIST.setUTCHours(eh, em, 0, 0)
  const active = isToday && istNow >= startIST && istNow <= endIST

  // Compute nextOpenAt and closesAt in ISO (UTC) by reverting IST shift
  const toUTCIso = (d: Date) => new Date(d.getTime() - (5.5 * 60 * 60 * 1000)).toISOString()
  let nextOpenAt: string | null = null
  let closesAt: string | null = null
  if (isToday) {
    nextOpenAt = toUTCIso(startIST)
    closesAt = toUTCIso(endIST)
  } else {
    // find next Sunday (or ww.dayOfWeek) from IST now
    const targetDow = ww.dayOfWeek ?? 0
    const curDow = day
    const delta = (targetDow - curDow + 7) % 7 || 7
    const next = new Date(istNow)
    next.setUTCDate(next.getUTCDate() + delta)
    const nextStart = new Date(next)
    nextStart.setUTCHours(sh, sm, 0, 0)
    const nextEnd = new Date(next)
    nextEnd.setUTCHours(eh, em, 0, 0)
    nextOpenAt = toUTCIso(nextStart)
    closesAt = toUTCIso(nextEnd)
  }
  return { active, nextOpenAt, closesAt }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const quizPath = path.join(process.cwd(), 'public', 'data', 'quizzes', `${id}.json`)
    const text = await fs.readFile(quizPath, 'utf8')
    const quiz = JSON.parse(text)
    const window = computeWindow(quiz)
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
