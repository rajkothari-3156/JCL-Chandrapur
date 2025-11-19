import { NextResponse } from 'next/server'
import { kv } from '@/lib/kv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STATE_KEY = 'auction:state:v1'

/**
 * Reset endpoint to clear all auction data from Redis
 * This will delete all teams, owners, retentions, sold players, and unsold queue
 * 
 * Usage: POST /api/auction/reset
 * Optional body: { confirm: true } - for safety
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    
    // Safety check - require confirmation
    if (body.confirm !== true) {
      return NextResponse.json({ 
        error: 'Confirmation required. Send { "confirm": true } to reset auction data.',
        warning: 'This will delete all teams, owners, retentions, and auction data.'
      }, { status: 400 })
    }

    // Clear the auction state
    const emptyState = { 
      teams: {}, 
      sold: {} as Record<string, { team: string; points: number; time: string }>, 
      owners: {}, 
      retentions: {}, 
      unsold: [] as Array<{ fullName: string; time: string; rounds?: number; unassigned?: boolean }> 
    }
    
    await kv.set(STATE_KEY, emptyState)
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Auction data has been reset successfully',
      state: emptyState,
      timestamp: new Date().toISOString()
    })
  } catch (e: any) {
    console.error('[auction/reset] Error:', e)
    return NextResponse.json({ 
      error: 'Failed to reset auction data', 
      details: e?.message ?? String(e) 
    }, { status: 500 })
  }
}

/**
 * GET endpoint to check current state without resetting
 */
export async function GET() {
  try {
    const state = await kv.get(STATE_KEY)
    return NextResponse.json({
      message: 'Current auction state (use POST with confirm:true to reset)',
      hasData: !!state,
      teamsCount: Object.keys(state?.teams || {}).length,
      soldCount: Object.keys(state?.sold || {}).length,
      ownersCount: Object.keys(state?.owners || {}).length,
      retentionsCount: Object.values(state?.retentions || {}).flat().length,
      unsoldCount: (state?.unsold || []).length,
    })
  } catch (e: any) {
    return NextResponse.json({ 
      error: 'Failed to read auction state', 
      details: e?.message ?? String(e) 
    }, { status: 500 })
  }
}
