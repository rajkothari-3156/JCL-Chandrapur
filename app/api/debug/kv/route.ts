import { NextResponse } from 'next/server'
import { kv } from '@/lib/kv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Test write
    const testKey = 'debug:test'
    const testValue = { timestamp: new Date().toISOString(), test: 'KV connection test' }
    await kv.set(testKey, testValue)
    
    // Test read
    const retrieved = await kv.get(testKey)
    
    return NextResponse.json({
      status: 'success',
      message: 'KV is working correctly',
      test: {
        written: testValue,
        retrieved: retrieved,
        match: JSON.stringify(testValue) === JSON.stringify(retrieved)
      },
      env: {
        hasRedisUrl: !!process.env.REDIS_URL,
        hasUpstashUrl: !!process.env.UPSTASH_REDIS_REST_URL,
        hasUpstashToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        isVercel: !!process.env.VERCEL,
      }
    })
  } catch (e: any) {
    return NextResponse.json({
      status: 'error',
      message: e?.message ?? 'Unknown error',
      stack: e?.stack,
    }, { status: 500 })
  }
}
