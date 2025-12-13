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
  { date: '2025-12-28', day: 'Sunday' },
  { date: '2025-12-29', day: 'Monday' },
  { date: '2025-12-30', day: 'Tuesday' },
  { date: '2025-12-31', day: 'Wednesday' },
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

function generateGroupStageMatches(teams: string[]): Match[] {
  const matches: Match[] = []
  const n = teams.length
  
  // Round-robin: each team plays every other team once
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matches.push({
        id: `${teams[i]}-${teams[j]}`,
        teamA: teams[i],
        teamB: teams[j],
        date: '',
        time: '',
        day: '',
      })
    }
  }
  
  return shuffleArray(matches)
}

function assignSchedule(matches: Match[]): Match[] {
  const scheduled: Match[] = []
  const teamSchedule: Record<string, Set<string>> = {}
  
  matches.forEach(match => {
    if (!teamSchedule[match.teamA]) teamSchedule[match.teamA] = new Set()
    if (!teamSchedule[match.teamB]) teamSchedule[match.teamB] = new Set()
  })
  
  let dayIndex = 0
  let timeIndex = 0
  
  for (const match of matches) {
    // Find next available slot where neither team is playing
    let found = false
    let attempts = 0
    const maxAttempts = DAYS.length * TIME_SLOTS.length
    
    while (!found && attempts < maxAttempts) {
      const day = DAYS[dayIndex % DAYS.length]
      const time = TIME_SLOTS[timeIndex % TIME_SLOTS.length]
      const slot = `${day.date}-${time}`
      
      if (!teamSchedule[match.teamA].has(slot) && !teamSchedule[match.teamB].has(slot)) {
        scheduled.push({
          ...match,
          date: day.date,
          time: time,
          day: day.day,
          matchNumber: scheduled.length + 1,
        })
        teamSchedule[match.teamA].add(slot)
        teamSchedule[match.teamB].add(slot)
        found = true
      }
      
      timeIndex++
      if (timeIndex % TIME_SLOTS.length === 0) {
        dayIndex++
      }
      attempts++
    }
    
    if (!found) {
      // Fallback: just assign to next slot
      const day = DAYS[dayIndex % DAYS.length]
      const time = TIME_SLOTS[timeIndex % TIME_SLOTS.length]
      scheduled.push({
        ...match,
        date: day.date,
        time: time,
        day: day.day,
        matchNumber: scheduled.length + 1,
      })
      timeIndex++
      if (timeIndex % TIME_SLOTS.length === 0) {
        dayIndex++
      }
    }
  }
  
  return scheduled
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

      // Generate matches for each group
      const groupAMatches = generateGroupStageMatches(groupA)
      const groupBMatches = generateGroupStageMatches(groupB)
      
      // Assign schedule
      const scheduledGroupA = assignSchedule(groupAMatches)
      const scheduledGroupB = assignSchedule(groupBMatches)
      
      const allMatches = [...scheduledGroupA, ...scheduledGroupB]

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
