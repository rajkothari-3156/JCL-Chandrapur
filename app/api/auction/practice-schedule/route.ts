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
  '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM', '12:00 AM',
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
  const teamSchedule: Record<string, { day: string; time: string }[]> = {}
  const globalTimeSlots: Record<string, Set<string>> = {} // Track used time slots per day globally
  
  // Initialize team schedules and global time slot tracking
  const allTeams = [...groupA, ...groupB]
  allTeams.forEach(team => {
    teamSchedule[team] = []
  })
  
  DAYS.forEach(day => {
    globalTimeSlots[day.date] = new Set()
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
      
      // Find a time slot that:
      // 1. Neither team is using on this day
      // 2. The time slot is not already used globally on this day
      const availableSlots = TIME_SLOTS.filter(slot => 
        !usedTimesThisDay.includes(slot) && !globalTimeSlots[day.date].has(slot)
      )
      
      if (availableSlots.length > 0) {
        timeSlot = availableSlots[0] // Take first available slot for consistency
      } else {
        // If no slots available, reuse slots (shouldn't happen with 5 slots and 4 teams per group)
        const fallbackSlots = TIME_SLOTS.filter(slot => !usedTimesThisDay.includes(slot))
        if (fallbackSlots.length > 0) {
          timeSlot = fallbackSlots[0]
        } else {
          timeSlot = TIME_SLOTS[0]
        }
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
      
      // Update team schedules and global time slot tracking
      teamSchedule[teamA].push({ day: day.date, time: timeSlot })
      teamSchedule[opponent].push({ day: day.date, time: timeSlot })
      globalTimeSlots[day.date].add(timeSlot)
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

      const teamNumbers = typeof teamNumbersData === 'string' ? JSON.parse(teamNumbersData) : teamNumbersData
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
