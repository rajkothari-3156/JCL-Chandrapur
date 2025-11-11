import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

function computeWindow(quiz: any) {
  const ww = quiz?.weeklyWindow
  if (!ww) return { active: true }

  const nowUtc = new Date()
  const IST_OFFSET_MIN = 330 // +05:30

  // Compute IST calendar date components by shifting now to IST
  const istNow = new Date(nowUtc.getTime() + IST_OFFSET_MIN * 60 * 1000)
  const istY = istNow.getUTCFullYear()
  const istM = istNow.getUTCMonth()
  const istD = istNow.getUTCDate()
  const istDow = istNow.getUTCDay()

  const targetDow = ww.dayOfWeek ?? 0
  const [sh, sm] = String(ww.start || '20:00').split(':').map((x: string)=>parseInt(x,10))
  const [eh, em] = String(ww.end || '20:15').split(':').map((x: string)=>parseInt(x,10))

  // Build IST start/end for today (in IST), then convert to UTC by subtracting offset
  const istStartUtcMs = Date.UTC(istY, istM, istD, sh, sm) - IST_OFFSET_MIN * 60 * 1000
  const istEndUtcMs = Date.UTC(istY, istM, istD, eh, em) - IST_OFFSET_MIN * 60 * 1000

  const isToday = istDow === targetDow
  const nowMs = nowUtc.getTime()
  const active = isToday && nowMs >= istStartUtcMs && nowMs <= istEndUtcMs

  // Next window computation (in UTC ISO)
  const toIso = (ms: number) => new Date(ms).toISOString()
  let nextOpenAt: string | null = null
  let closesAt: string | null = null
  if (isToday) {
    nextOpenAt = toIso(istStartUtcMs)
    closesAt = toIso(istEndUtcMs)
  } else {
    const curDow = istDow
    const delta = (targetDow - curDow + 7) % 7 || 7
    const nextIstDate = new Date(Date.UTC(istY, istM, istD))
    nextIstDate.setUTCDate(nextIstDate.getUTCDate() + delta)
    const nY = nextIstDate.getUTCFullYear()
    const nM = nextIstDate.getUTCMonth()
    const nD = nextIstDate.getUTCDate()
    const nextStartUtcMs = Date.UTC(nY, nM, nD, sh, sm) - IST_OFFSET_MIN * 60 * 1000
    const nextEndUtcMs = Date.UTC(nY, nM, nD, eh, em) - IST_OFFSET_MIN * 60 * 1000
    nextOpenAt = toIso(nextStartUtcMs)
    closesAt = toIso(nextEndUtcMs)
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
