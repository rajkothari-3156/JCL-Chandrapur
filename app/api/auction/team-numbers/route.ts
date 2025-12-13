import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@/lib/kv'

const TEAM_NUMBERS_KEY = 'jcl:team_numbers'

type TeamNumberAssignment = {
  teamNumbers: Record<string, number>
  groupA: string[]
  groupB: string[]
}

async function getTeamNumbers(): Promise<TeamNumberAssignment> {
  const data = await kv.get(TEAM_NUMBERS_KEY)
  if (data) {
    return JSON.parse(data as string)
  }
  
  return {
    teamNumbers: {},
    groupA: [],
    groupB: [],
  }
}

async function saveTeamNumbers(data: TeamNumberAssignment) {
  await kv.set(TEAM_NUMBERS_KEY, JSON.stringify(data))
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export async function GET() {
  try {
    const data = await getTeamNumbers()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'reset') {
      await saveTeamNumbers({ teamNumbers: {}, groupA: [], groupB: [] })
      return NextResponse.json({ success: true })
    }

    if (action === 'randomize') {
      // Get teams from auction state
      const auctionState = await kv.get('auction:state:v1')
      if (!auctionState) {
        return NextResponse.json({ error: 'Auction state not found' }, { status: 400 })
      }

      const state = JSON.parse(auctionState as string)
      const teams = Object.keys(state.teams || {})

      if (teams.length !== 8) {
        return NextResponse.json({ error: 'Expected 8 teams' }, { status: 400 })
      }

      // Shuffle teams and assign numbers 1-8
      const shuffledTeams = shuffleArray(teams)
      const teamNumbers: Record<string, number> = {}
      shuffledTeams.forEach((team, idx) => {
        teamNumbers[team] = idx + 1
      })

      // Split into Group A (teams 1-4) and Group B (teams 5-8)
      const groupA = shuffledTeams.slice(0, 4)
      const groupB = shuffledTeams.slice(4, 8)

      const data: TeamNumberAssignment = {
        teamNumbers,
        groupA,
        groupB,
      }

      await saveTeamNumbers(data)
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
