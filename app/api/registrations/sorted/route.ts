import { NextResponse } from 'next/server'
import { GET as getRegistrations } from '../route'

export async function GET(req: Request) {
  try {
    // Call the main registrations API directly
    const response = await getRegistrations(req)
    const json = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({ error: json?.error || 'Failed to load registrations' }, { status: response.status })
    }
    
    const data = json.data || []
    const sorted = [...data].sort((a: any, b: any) => a.fullName.localeCompare(b.fullName))
    const withSerialNumbers = sorted.map((player: any, index: number) => ({
      ...player,
      serialNumber: index + 1
    }))
    
    return NextResponse.json({ data: withSerialNumbers, count: withSerialNumbers.length, cached: json.cached, appended: json.appended })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch sorted registrations', details: err?.message ?? String(err) },
      { status: 500 }
    )
  }
}
