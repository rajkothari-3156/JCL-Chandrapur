import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/registrations`, { cache: 'no-store' })
    const json = await res.json()
    
    if (!res.ok) {
      return NextResponse.json({ error: json?.error || 'Failed to load registrations' }, { status: res.status })
    }
    
    const data = json.data || []
    const sorted = [...data].sort((a: any, b: any) => a.fullName.localeCompare(b.fullName))
    const withSerialNumbers = sorted.map((player: any, index: number) => ({
      ...player,
      serialNumber: index + 1
    }))
    
    return NextResponse.json({ data: withSerialNumbers, count: withSerialNumbers.length })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch sorted registrations', details: err?.message ?? String(err) },
      { status: 500 }
    )
  }
}
