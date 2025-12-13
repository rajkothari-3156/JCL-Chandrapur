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
  const teamSchedule: Record<string, Set<string>> = {} // Track which days each team has played
  const globalTimeSlots: Record<string, Set<string>> = {} // Track used time slots per day globally
  
  // Initialize team schedules and global time slot tracking
  const allTeams = [...groupA, ...groupB]
  allTeams.forEach(team => {
    teamSchedule[team] = new Set()
  })
  
  DAYS.forEach(day => {
    globalTimeSlots[day.date] = new Set()
  })

  // Create all possible matchups between Group A and Group B
  const allMatchups: Array<{ teamA: string; teamB: string }> = []
  groupA.forEach(teamA => {
    groupB.forEach(teamB => {
      allMatchups.push({ teamA, teamB })
    })
  })
  
  // Shuffle matchups for randomness
  const shuffledMatchups = shuffleArray(allMatchups)
  
  // Schedule matches day by day, ensuring each team plays max 1 match per day
  DAYS.forEach(day => {
    const teamsPlayedToday = new Set<string>()
    
    // Try to schedule matches for this day
    for (const matchup of shuffledMatchups) {
      // Check if both teams are available today (haven't played yet today)
      if (!teamsPlayedToday.has(matchup.teamA) && !teamsPlayedToday.has(matchup.teamB)) {
        // Check if both teams haven't played on this specific day before
        if (!teamSchedule[matchup.teamA].has(day.date) && !teamSchedule[matchup.teamB].has(day.date)) {
          // Find available time slot
          const availableSlots = TIME_SLOTS.filter(slot => !globalTimeSlots[day.date].has(slot))
          
          if (availableSlots.length > 0) {
            const timeSlot = availableSlots[0]
            
            // Schedule the match
            matches.push({
              id: `${matchup.teamA}-${matchup.teamB}-${day.date}`,
              teamA: matchup.teamA,
              teamB: matchup.teamB,
              date: day.date,
              time: timeSlot,
              day: day.day,
            })
            
            // Mark teams as played today and on this date
            teamsPlayedToday.add(matchup.teamA)
            teamsPlayedToday.add(matchup.teamB)
            teamSchedule[matchup.teamA].add(day.date)
            teamSchedule[matchup.teamB].add(day.date)
            globalTimeSlots[day.date].add(timeSlot)
          }
        }
      }
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
