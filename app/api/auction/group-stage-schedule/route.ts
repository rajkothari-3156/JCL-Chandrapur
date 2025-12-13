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
  const teamLastMatchIndex: Record<string, number> = {}
  
  matches.forEach(match => {
    teamLastMatchIndex[match.teamA] = -2 // Initialize with -2 so first match at index 0 is not consecutive
    teamLastMatchIndex[match.teamB] = -2
  })
  
  let currentMatchIndex = 0
  const unscheduled = [...matches]
  
  while (unscheduled.length > 0) {
    let matchScheduled = false
    
    // Try to find a match where neither team played in the immediately previous match
    for (let i = 0; i < unscheduled.length; i++) {
      const match = unscheduled[i]
      const teamALastIndex = teamLastMatchIndex[match.teamA]
      const teamBLastIndex = teamLastMatchIndex[match.teamB]
      
      // Check if neither team played in the previous match (prevent consecutive matches)
      if (teamALastIndex !== currentMatchIndex - 1 && teamBLastIndex !== currentMatchIndex - 1) {
        // Schedule this match
        scheduled.push({
          ...match,
          date: '', // Will be assigned later based on match sequence
          time: START_TIME,
          day: '',
          matchNumber: currentMatchIndex + 1,
        })
        
        // Update last match index for both teams
        teamLastMatchIndex[match.teamA] = currentMatchIndex
        teamLastMatchIndex[match.teamB] = currentMatchIndex
        
        // Remove from unscheduled
        unscheduled.splice(i, 1)
        currentMatchIndex++
        matchScheduled = true
        break
      }
    }
    
    // If no match could be scheduled without consecutive play, just schedule the first one
    if (!matchScheduled && unscheduled.length > 0) {
      const match = unscheduled[0]
      scheduled.push({
        ...match,
        date: '',
        time: START_TIME,
        day: '',
        matchNumber: currentMatchIndex + 1,
      })
      teamLastMatchIndex[match.teamA] = currentMatchIndex
      teamLastMatchIndex[match.teamB] = currentMatchIndex
      unscheduled.splice(0, 1)
      currentMatchIndex++
    }
  }
  
  // Assign dates to matches (distribute across days)
  const matchesPerDay = Math.ceil(scheduled.length / DAYS.length)
  scheduled.forEach((match, index) => {
    const dayIndex = Math.floor(index / matchesPerDay)
    const day = DAYS[Math.min(dayIndex, DAYS.length - 1)]
    match.date = day.date
    match.day = day.day
  })
  
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
