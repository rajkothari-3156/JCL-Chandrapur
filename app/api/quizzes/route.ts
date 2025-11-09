import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function GET() {
  try {
    const idxPath = path.join(process.cwd(), 'public', 'data', 'quizzes', 'index.json')
    const text = await fs.readFile(idxPath, 'utf8')
    const json = JSON.parse(text)
    return NextResponse.json(json)
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to read quizzes index', details: e?.message ?? String(e) }, { status: 500 })
  }
}
