import { NextResponse } from 'next/server'
import { kv } from '@/lib/kv'

function key(id: string) {
  return `quiz:${id}:active`
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const v = await kv.get(key(id))
    if (typeof v === 'boolean') return NextResponse.json({ active: v })
    return NextResponse.json({ active: null })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to read active status', details: e?.message ?? String(e) }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await req.json().catch(() => ({}))
    const active = Boolean(body?.active)
    await kv.set(key(id), active)
    return NextResponse.json({ ok: true, active })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to update active status', details: e?.message ?? String(e) }, { status: 500 })
  }
}
