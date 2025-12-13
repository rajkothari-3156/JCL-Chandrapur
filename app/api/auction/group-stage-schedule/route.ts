import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@/lib/kv'

const GROUP_STAGE_SCHEDULE_KEY = 'jcl:group_stage_schedule'
const TEAM_NUMBERS_KEY = 'jcl:team_numbers'

type Match = {
  id: string
  teamA: string
  teamB: string
  date: string
  time: string
  day: string
  matchNumber?: number
}

type GroupStageSchedule = {
  matches: Match[]
  teamNumbers: Record<string, number>
  groupA: string[]
  groupB: string[]
}

const DAYS = [
  { date: '2025-12-26', day: 'Friday' },
  { date: '2025-12-27', day: 'Saturday' },
]

const START_TIME = '06:30 PM'

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

async function getGroupStageSchedule(): Promise<GroupStageSchedule> {
  const data = await kv.get(GROUP_STAGE_SCHEDULE_KEY)
  if (data) {
    return typeof data === 'string' ? JSON.parse(data) : data
  }
  
  return {
    matches: [],
    teamNumbers: {},
    groupA: [],
    groupB: [],
  }
}

async function saveGroupStageSchedule(data: GroupStageSchedule) {
  await kv.set(GROUP_STAGE_SCHEDULE_KEY, JSON.stringify(data))
}

function generateGroupStageSchedule(groupA: string[], groupB: string[], teamNumbers: Record<string, number>): Match[] {
  const matches: Match[] = []
  
  // Create team number to name mapping
  const teamNumberToName: Record<number, string> = {}
  Object.entries(teamNumbers).forEach(([name, num]) => {
    teamNumberToName[num] = name
  })
  
  // Fixed master schedule for tournament matches
  // Day 1 - Friday, Dec 26
  const day1Schedule = [
    { matchNumber: 1, group: 'A', teamANum: 1, teamBNum: 2 },
    { matchNumber: 2, group: 'B', teamANum: 5, teamBNum: 6 },
    { matchNumber: 3, group: 'A', teamANum: 3, teamBNum: 4 },
    { matchNumber: 4, group: 'B', teamANum: 7, teamBNum: 8 },
    { matchNumber: 5, group: 'A', teamANum: 1, teamBNum: 3 },
    { matchNumber: 6, group: 'B', teamANum: 5, teamBNum: 7 },
  ]
  
  // Day 2 - Saturday, Dec 27
  const day2Schedule = [
    { matchNumber: 7, group: 'A', teamANum: 2, teamBNum: 4 },
    { matchNumber: 8, group: 'B', teamANum: 6, teamBNum: 8 },
    { matchNumber: 9, group: 'A', teamANum: 1, teamBNum: 4 },
    { matchNumber: 10, group: 'B', teamANum: 5, teamBNum: 8 },
    { matchNumber: 11, group: 'A', teamANum: 2, teamBNum: 3 },
    { matchNumber: 12, group: 'B', teamANum: 6, teamBNum: 7 },
  ]
  
  // Create matches for Day 1
  day1Schedule.forEach(slot => {
    const teamA = teamNumberToName[slot.teamANum]
    const teamB = teamNumberToName[slot.teamBNum]
    
    if (teamA && teamB) {
      matches.push({
        id: `${teamA}-${teamB}-day1`,
        teamA,
        teamB,
        date: DAYS[0].date,
        time: START_TIME,
        day: DAYS[0].day,
        matchNumber: slot.matchNumber,
      })
    }
  })
  
  // Create matches for Day 2
  day2Schedule.forEach(slot => {
    const teamA = teamNumberToName[slot.teamANum]
    const teamB = teamNumberToName[slot.teamBNum]
    
    if (teamA && teamB) {
      matches.push({
        id: `${teamA}-${teamB}-day2`,
        teamA,
        teamB,
        date: DAYS[1].date,
        time: START_TIME,
        day: DAYS[1].day,
        matchNumber: slot.matchNumber,
      })
    }
  })
  
  return matches
}

export async function GET() {
  try {
    const data = await getGroupStageSchedule()
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
      await saveGroupStageSchedule({ matches: [], teamNumbers: {}, groupA: [], groupB: [] })
      return NextResponse.json({ success: true })
    }

    if (action === 'generate') {
      // Get team numbers and groups
      const teamNumbersData = await kv.get(TEAM_NUMBERS_KEY)
      if (!teamNumbersData) {
        return NextResponse.json({ error: 'Team numbers not assigned yet' }, { status: 400 })
      }

      const teamNumbers = typeof teamNumbersData === 'string' ? JSON.parse(teamNumbersData) : teamNumbersData
      const { groupA, groupB, teamNumbers: numbers } = teamNumbers

      if (!groupA || !groupB || groupA.length !== 4 || groupB.length !== 4) {
        return NextResponse.json({ error: 'Invalid group configuration' }, { status: 400 })
      }

      // Generate matches using fixed master schedule
      const allMatches = generateGroupStageSchedule(groupA, groupB, numbers)

      const data: GroupStageSchedule = {
        matches: allMatches,
        teamNumbers: numbers,
        groupA,
        groupB,
      }

      await saveGroupStageSchedule(data)
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
