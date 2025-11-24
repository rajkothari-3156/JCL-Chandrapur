import { NextResponse } from 'next/server'
import { kv } from '@/lib/kv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const quizId = searchParams.get('quizId') || 'jcl-quiz-2025-wk3'
    
    // Fetch all results for the quiz
    const resultsKey = `quiz:${quizId}:results`
    const results = await kv.get(resultsKey)
    
    // Fetch active status
    const activeKey = `quiz:${quizId}:active`
    const isActive = await kv.get(activeKey)
    
    return NextResponse.json({
      quizId,
      isActive,
      resultsKey,
      totalSubmissions: Array.isArray(results) ? results.length : 0,
      results: results || [],
      timestamp: new Date().toISOString()
    })
  } catch (e: any) {
    return NextResponse.json({
      status: 'error',
      message: e?.message ?? 'Unknown error',
      stack: e?.stack,
    }, { status: 500 })
  }
}
