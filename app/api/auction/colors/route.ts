import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@/lib/kv'

const COLOR_AUCTION_KEY = 'jcl:color_auction'

type ColorAuction = {
  colors: Record<string, { owner: string; bidAmount: number } | null>
  owners: string[]
  ownerTeams: Record<string, string>
}

async function getColorAuction(): Promise<ColorAuction> {
  const data = await kv.get(COLOR_AUCTION_KEY)
  if (data) {
    return JSON.parse(data as string)
  }
  
  // Fixed team-to-owner mapping
  const ownerTeams: Record<string, string> = {
    'Piyush Dugad': 'Rajwada Royals',
    'Mayur Bhandari': 'Chandralok Warriors',
    'Siddhant Puglia': 'Dhansiddh Earthmovers',
    'Madhur Pugliya': 'Jain United',
    'Nirav Bohra': 'KT Lions',
    'Vaibhav Jain': 'Parshv Panthers',
    'Manav Banthia': 'Falcon Giants',
    'Jay Baid': 'Dominant Demons',
  }
  
  const owners = Object.keys(ownerTeams)
  
  return {
    colors: {},
    owners,
    ownerTeams,
  }
}

async function saveColorAuction(data: ColorAuction) {
  await kv.set(COLOR_AUCTION_KEY, JSON.stringify(data))
}

export async function GET() {
  try {
    const data = await getColorAuction()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, color, owner, bidAmount } = body

    if (action === 'reset') {
      // Reset the color auction with fixed team-to-owner mapping
      const ownerTeams: Record<string, string> = {
        'Piyush Dugad': 'Rajwada Royals',
        'Mayur Bhandari': 'Chandralok Warriors',
        'Siddhant Puglia': 'Dhansiddh Earthmovers',
        'Madhur Pugliya': 'Jain United',
        'Nirav Bohra': 'KT Lions',
        'Vaibhav Jain': 'Parshv Panthers',
        'Manav Banthia': 'Falcon Giants',
        'Jay Baid': 'Dominant Demons',
      }
      
      const owners = Object.keys(ownerTeams)
      
      await saveColorAuction({ colors: {}, owners, ownerTeams })
      return NextResponse.json({ success: true })
    }

    if (action === 'bid') {
      if (!color || !owner) {
        return NextResponse.json({ error: 'Color and owner are required' }, { status: 400 })
      }

      const data = await getColorAuction()

      // Check if color is already sold
      if (data.colors[color]) {
        return NextResponse.json({ error: 'Color already sold' }, { status: 400 })
      }

      // Assign color to owner
      data.colors[color] = {
        owner,
        bidAmount: bidAmount || 0,
      }

      await saveColorAuction(data)
      return NextResponse.json({ success: true, data })
    }

    if (action === 'updateOwners') {
      const data = await getColorAuction()
      if (body.owners && Array.isArray(body.owners)) {
        data.owners = body.owners
        await saveColorAuction(data)
        return NextResponse.json({ success: true, data })
      }
      return NextResponse.json({ error: 'Invalid owners data' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
