import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@/lib/kv'

const PRACTICE_SCHEDULE_KEY = 'jcl:practice_schedule'
const TEAM_NUMBERS_KEY = 'jcl:team_numbers'

type Match = {
  id: string
  teamA: string
  teamB: string
  date: string
  time: string
  day: string
}

type PracticeSchedule = {
  matches: Match[]
  teamNumbers: Record<string, number>
  groupA: string[]
  groupB: string[]
}

const DAYS = [
  { date: '2025-12-22', day: 'Monday' },
  { date: '2025-12-23', day: 'Tuesday' },
  { date: '2025-12-24', day: 'Wednesday' },
  { date: '2025-12-25', day: 'Thursday' },
]

const TIME_SLOTS = [
  '08:00 PM - 09:00 PM',
  '09:00 PM - 10:00 PM',
  '10:00 PM - 11:00 PM',
  '11:00 PM - 12:00 AM',
]

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

async function getPracticeSchedule(): Promise<PracticeSchedule> {
  const data = await kv.get(PRACTICE_SCHEDULE_KEY)
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

async function savePracticeSchedule(data: PracticeSchedule) {
  await kv.set(PRACTICE_SCHEDULE_KEY, JSON.stringify(data))
}

function generateSchedule(groupA: string[], groupB: string[]): Match[] {
  const matches: Match[] = []
  
  // Master schedule based on team numbers
  // Group A = Teams 1-4, Group B = Teams 5-8
  const masterSchedule = [
    // Dec 22
    { date: '2025-12-22', day: 'Monday', time: '08:00 PM - 09:00 PM', teamANum: 1, teamBNum: 5 },
    { date: '2025-12-22', day: 'Monday', time: '09:00 PM - 10:00 PM', teamANum: 2, teamBNum: 6 },
    { date: '2025-12-22', day: 'Monday', time: '10:00 PM - 11:00 PM', teamANum: 3, teamBNum: 7 },
    { date: '2025-12-22', day: 'Monday', time: '11:00 PM - 12:00 AM', teamANum: 4, teamBNum: 8 },
    // Dec 23
    { date: '2025-12-23', day: 'Tuesday', time: '08:00 PM - 09:00 PM', teamANum: 3, teamBNum: 8 },
    { date: '2025-12-23', day: 'Tuesday', time: '09:00 PM - 10:00 PM', teamANum: 4, teamBNum: 7 },
    { date: '2025-12-23', day: 'Tuesday', time: '10:00 PM - 11:00 PM', teamANum: 1, teamBNum: 6 },
    { date: '2025-12-23', day: 'Tuesday', time: '11:00 PM - 12:00 AM', teamANum: 2, teamBNum: 5 },
    // Dec 24
    { date: '2025-12-24', day: 'Wednesday', time: '08:00 PM - 09:00 PM', teamANum: 4, teamBNum: 6 },
    { date: '2025-12-24', day: 'Wednesday', time: '09:00 PM - 10:00 PM', teamANum: 3, teamBNum: 5 },
    { date: '2025-12-24', day: 'Wednesday', time: '10:00 PM - 11:00 PM', teamANum: 2, teamBNum: 8 },
    { date: '2025-12-24', day: 'Wednesday', time: '11:00 PM - 12:00 AM', teamANum: 1, teamBNum: 7 },
    // Dec 25
    { date: '2025-12-25', day: 'Thursday', time: '08:00 PM - 09:00 PM', teamANum: 2, teamBNum: 7 },
    { date: '2025-12-25', day: 'Thursday', time: '09:00 PM - 10:00 PM', teamANum: 1, teamBNum: 8 },
    { date: '2025-12-25', day: 'Thursday', time: '10:00 PM - 11:00 PM', teamANum: 4, teamBNum: 5 },
    { date: '2025-12-25', day: 'Thursday', time: '11:00 PM - 12:00 AM', teamANum: 3, teamBNum: 6 },
  ]
  
  // Map team numbers to team names
  // Group A teams are indexed 0-3, mapped to team numbers 1-4
  // Group B teams are indexed 0-3, mapped to team numbers 5-8
  const teamNumberToName: Record<number, string> = {}
  groupA.forEach((team, idx) => {
    teamNumberToName[idx + 1] = team
  })
  groupB.forEach((team, idx) => {
    teamNumberToName[idx + 5] = team
  })
  
  // Create matches from master schedule
  masterSchedule.forEach((slot, index) => {
    const teamA = teamNumberToName[slot.teamANum]
    const teamB = teamNumberToName[slot.teamBNum]
    
    if (teamA && teamB) {
      matches.push({
        id: `${teamA}-${teamB}-${slot.date}`,
        teamA,
        teamB,
        date: slot.date,
        time: slot.time,
        day: slot.day,
      })
    }
  })
  
  return matches
}

export async function GET() {
  try {
    const data = await getPracticeSchedule()
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
      await savePracticeSchedule({ matches: [], teamNumbers: {}, groupA: [], groupB: [] })
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

      // Sort groups by team number to ensure correct mapping
      // Team numbers are already assigned 1-4 for groupA and 5-8 for groupB
      const sortedGroupA = [...groupA].sort((a, b) => numbers[a] - numbers[b])
      const sortedGroupB = [...groupB].sort((a, b) => numbers[a] - numbers[b])

      // Generate matches using sorted groups
      const matches = generateSchedule(sortedGroupA, sortedGroupB)

      const data: PracticeSchedule = {
        matches,
        teamNumbers: numbers,
        groupA,
        groupB,
      }

      await savePracticeSchedule(data)
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
