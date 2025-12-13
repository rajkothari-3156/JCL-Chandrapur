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
  { date: '2024-12-22', day: 'Monday' },
  { date: '2024-12-23', day: 'Tuesday' },
  { date: '2024-12-24', day: 'Wednesday' },
  { date: '2024-12-25', day: 'Thursday' },
]

const TIME_SLOTS = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM',
  '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM',
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
    return JSON.parse(data as string)
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
  const teamSchedule: Record<string, { day: string; time: string }[]> = {}
  
  // Initialize team schedules
  const allTeams = [...groupA, ...groupB]
  allTeams.forEach(team => {
    teamSchedule[team] = []
  })

  // For each team in Group A, schedule 4 matches against 4 teams from Group B
  groupA.forEach(teamA => {
    // Shuffle Group B teams to randomize opponents
    const shuffledGroupB = shuffleArray(groupB)
    
    // Each team plays 4 matches (one per day)
    DAYS.forEach((day, dayIdx) => {
      const opponent = shuffledGroupB[dayIdx]
      
      // Find available time slot for both teams on this day
      let timeSlot = ''
      const usedTimesTeamA = teamSchedule[teamA]
        .filter(s => s.day === day.date)
        .map(s => s.time)
      const usedTimesTeamB = teamSchedule[opponent]
        .filter(s => s.day === day.date)
        .map(s => s.time)
      const usedTimesThisDay = [...usedTimesTeamA, ...usedTimesTeamB]
      
      // Also check which times each team has used across all days (to ensure variety)
      const allUsedTimesTeamA = teamSchedule[teamA].map(s => s.time)
      const allUsedTimesTeamB = teamSchedule[opponent].map(s => s.time)
      
      // Find a time slot that:
      // 1. Neither team is using on this day
      // 2. Preferably neither team has used before (for variety)
      const availableSlots = TIME_SLOTS.filter(slot => !usedTimesThisDay.includes(slot))
      const preferredSlots = availableSlots.filter(
        slot => !allUsedTimesTeamA.includes(slot) && !allUsedTimesTeamB.includes(slot)
      )
      
      if (preferredSlots.length > 0) {
        timeSlot = preferredSlots[Math.floor(Math.random() * preferredSlots.length)]
      } else if (availableSlots.length > 0) {
        timeSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)]
      } else {
        // Fallback: use any slot
        timeSlot = TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)]
      }
      
      // Record the match
      matches.push({
        id: `${teamA}-${opponent}-${day.date}`,
        teamA,
        teamB: opponent,
        date: day.date,
        time: timeSlot,
        day: day.day,
      })
      
      // Update team schedules
      teamSchedule[teamA].push({ day: day.date, time: timeSlot })
      teamSchedule[opponent].push({ day: day.date, time: timeSlot })
    })
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

      const teamNumbers = JSON.parse(teamNumbersData as string)
      const { groupA, groupB, teamNumbers: numbers } = teamNumbers

      if (!groupA || !groupB || groupA.length !== 4 || groupB.length !== 4) {
        return NextResponse.json({ error: 'Invalid group configuration' }, { status: 400 })
      }

      // Generate matches
      const matches = generateSchedule(groupA, groupB)

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
