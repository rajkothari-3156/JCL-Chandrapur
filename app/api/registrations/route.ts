import { NextResponse } from 'next/server'
import Papa from 'papaparse'
import fs from 'node:fs/promises'
import path from 'node:path'

// Fetch registrations from either a published CSV or a private Google Sheet via Service Account
// Simple in-memory cache (resets on server restart)
let CACHE: { data: any[]; lastUpdated: number; totalRows: number } | null = null

const ALIASES: Record<string, string> = {
  'Pranay Pugliya': 'Pranay Pravin Pugliya',
  'Rishabh Saklecha': 'Rishab Mahendra Saklecha',
  'Harsh Choradiya': 'Harsh Chordia',
}

// Build a normalized name -> auction attributes map and enrich rows
async function enrichWithAuction<T extends { fullName: string }>(rows: T[]) {
  try {
    const auctionCsvPath = path.join(process.cwd(), 'public', 'data', 'JCL 2k24 Final Players List For Owners - Auction sheet.csv')
    const csvText = await fs.readFile(auctionCsvPath, 'utf8')
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true })
    const norm = (s: any) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
    const map = new Map<string, { auctionGroup: string | null; auctionAgeCategory: string | null; auctionPoints: number | null; auctionTeam: string | null }>()
    for (const r of parsed.data as any[]) {
      const fullName = r['Full Name'] ?? r['full name'] ?? r['Name'] ?? r['name']
      if (!fullName) continue
      const key = norm(fullName)
      const group = r['Group'] ?? r['group'] ?? null
      const ageCat = r['Age Category'] ?? r['age category'] ?? null
      const pointsRaw = r['Points'] ?? r['points']
      const team = r['Team'] ?? r['team'] ?? null
      const points = pointsRaw === undefined || pointsRaw === null || String(pointsRaw).trim() === '' ? null : Number(String(pointsRaw).replace(/[^\d.-]/g, ''))
      map.set(key, {
        auctionGroup: group != null && group !== '' ? String(group) : null,
        auctionAgeCategory: ageCat != null && ageCat !== '' ? String(ageCat) : null,
        auctionPoints: Number.isFinite(points as number) ? (points as number) : null,
        auctionTeam: team != null && team !== '' ? String(team) : null,
      })
    }

    const aliasMap = new Map<string, string>(Object.entries(ALIASES).map(([k, v]) => [norm(k), norm(v)]))

    return rows.map((row) => {
      const key = norm(row.fullName)
      const canonical = map.has(key) ? key : (aliasMap.get(key) || key)
      const a = map.get(canonical)
      return {
        ...row,
        auctionGroup: a?.auctionGroup ?? null,
        auctionAgeCategory: a?.auctionAgeCategory ?? null,
        auctionPoints: a?.auctionPoints ?? null,
        auctionTeam: a?.auctionTeam ?? null,
      }
    })
  } catch (e) {
    // On any failure, just return original rows (no auction info)
    return rows.map((row) => ({
      ...row,
      auctionGroup: null,
      auctionAgeCategory: null,
      auctionPoints: null,
      auctionTeam: null,
    }))
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const forceRefresh = searchParams.get('refresh') === '1'

    const csvUrl = process.env.SHEETS_CSV_URL
    if (csvUrl) {
      console.log('[registrations] Using CSV mode (SHEETS_CSV_URL present)')
      // CSV mode: no incremental append available; optionally serve cache
      if (!forceRefresh && CACHE?.data) {
        return NextResponse.json({ count: CACHE.data.length, data: CACHE.data, cached: true })
      }

      const data = await fetchFromCsv(csvUrl)
      const enriched = await enrichWithAuction(data)
      CACHE = { data: enriched, lastUpdated: Date.now(), totalRows: enriched.length }
      return NextResponse.json({ count: enriched.length, data: enriched })
    }

    const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const saKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    const sheetId = process.env.GOOGLE_SHEET_ID
    const range = process.env.GOOGLE_SHEET_RANGE || 'Registrations!A:G'

    if (saEmail && saKey && sheetId) {
      console.log('[registrations] Using Google Service Account mode', {
        emailPresent: Boolean(saEmail),
        keyPresent: Boolean(saKey),
        sheetId: sheetId?.slice(0, 6) + '...'
      })
      if (!forceRefresh && CACHE?.data) {
        return NextResponse.json({ count: CACHE.data.length, data: CACHE.data, cached: true })
      }

      // Try incremental append when we have a cache
      if (CACHE?.data && CACHE.totalRows >= 1) {
        const inc = await tryIncrementalAppend({ saEmail, saKey, sheetId, baseRange: range, startRow: CACHE.totalRows + 2 })
        if (inc?.appended && inc.rows && inc.rows.length > 0) {
          // Append and re-enrich only the new rows, then merge
          const appendedEnriched = await enrichWithAuction(inc.rows)
          CACHE.data = [...CACHE.data, ...appendedEnriched]
          CACHE.lastUpdated = Date.now()
          CACHE.totalRows += inc.rowsRawCount
          return NextResponse.json({ count: CACHE.data.length, data: CACHE.data, cached: false, appended: inc.rowsRawCount })
        }
        // Fallback to full if incremental not possible
      }

      const data = await fetchFromPrivateSheet({ saEmail, saKey, sheetId, range })
      const enriched = await enrichWithAuction(data)
      CACHE = { data: enriched, lastUpdated: Date.now(), totalRows: enriched.length }
      return NextResponse.json({ count: enriched.length, data: enriched, cached: false })
    }

    return NextResponse.json(
      { error: 'No data source configured. Provide SHEETS_CSV_URL for public CSV or GOOGLE_SERVICE_ACCOUNT_EMAIL/GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY/GOOGLE_SHEET_ID for private access.' },
      { status: 500 }
    )
  } catch (err: any) {
    console.error('[registrations] Unhandled error', err)
    return NextResponse.json(
      { error: 'Unexpected server error fetching registrations', details: err?.message ?? String(err) },
      { status: 500 }
    )
  }
}

async function fetchFromCsv(csvUrl: string) {
  const res = await fetch(csvUrl, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`)
  }
  const csvText = await res.text()
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true })
  if (parsed.errors && parsed.errors.length) {
    throw new Error(`Error parsing CSV: ${parsed.errors[0]?.message || 'parse error'}`)
  }
  const rows = (parsed.data as any[]).map((r) => normalizeRowFromObject(r))
  return selectImportant(rows)
}

async function fetchFromPrivateSheet({ saEmail, saKey, sheetId, range }: { saEmail: string; saKey: string; sheetId: string; range: string }) {
  // googleapis is only used server-side
  const { google } = await import('googleapis')

  // Private keys may contain literal \n that need conversion
  const privateKey = saKey.replace(/\\n/g, '\n')

  const auth = new google.auth.JWT({
    email: saEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  const sheets = google.sheets({ version: 'v4', auth })
  try {
    const resp = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range })
    const values = resp.data.values || []
    if (values.length === 0) return []
  
    const headers = (values[0] || []).map((h: any) => String(h))
    const toObject = (row: any[]) => headers.reduce<Record<string, any>>((acc, h, i) => { acc[h] = row[i] ?? ''; return acc }, {})
    const objects = values.slice(1).map((row) => toObject(row as any[]))
    const rows = objects.map((r) => normalizeRowFromObject(r))
    return selectImportant(rows)
  } catch (e: any) {
    const status = e?.code || e?.response?.status || 500
    const message = e?.message || 'Error calling Google Sheets API'
    const googleData = e?.response?.data
    console.error('[registrations] Google API error', {
      status,
      message,
      sheetId: sheetId?.slice(0, 6) + '...',
      range
    })
    throw new Error(`Google Sheets API error (${status}): ${message}${googleData ? ' | ' + JSON.stringify(googleData) : ''}`)
  }
}

function normalizeRowFromObject(r: Record<string, any>) {
  const get = (keys: string[], fallback: any = null) => {
    for (const k of keys) {
      const match = Object.keys(r).find((h) => h.trim().toLowerCase() === k)
      if (match) return (r as any)[match]
    }
    return fallback
  }

  const timestamp = get(['timestamp'])
  const fullName = get(['your full name', 'full name', 'name'])
  const age = get(['your age', 'age'])
  const contact = get(['your contact no.', 'contact', 'phone', 'mobile'])
  const playingStyle = get(['your playing style', 'playing style', 'style'])
  const tshirtSize = get(['your t-shirt size', 't-shirt size', 'tshirt size', 'size'])
  const photoUrl = get(['your photo', 'photo', 'image', 'photo url'])

  return { timestamp, fullName, age, contact, playingStyle, tshirtSize, photoUrl }
}

function selectImportant(rows: Array<{ timestamp: any; fullName: any; age: any; contact: any; playingStyle: any; tshirtSize: any; photoUrl: any }>) {
  return rows
    .filter((r) => r.fullName)
    .map((r) => ({
      timestamp: r.timestamp || null,
      fullName: r.fullName,
      age: normalizeAge(r.age),
      contact: r.contact || null,
      playingStyle: r.playingStyle || null,
      tshirtSize: r.tshirtSize || null,
      photoUrl: r.photoUrl || null,
    }))
}

function normalizeAge(age: any): string | number | null {
  if (age === null || age === undefined) return 'NA'
  let n: number | null = null
  if (typeof age === 'number') {
    n = Number.isFinite(age) ? age : null
  } else {
    const digits = String(age).match(/\d+/)?.[0]
    n = digits ? parseInt(digits, 10) : null
  }
  if (n !== null && n >= 15 && n <= 50) return n
  return 'NA'
}

// Attempt to fetch only new rows after a given start row and append them to cache
async function tryIncrementalAppend({ saEmail, saKey, sheetId, baseRange, startRow }: { saEmail: string; saKey: string; sheetId: string; baseRange: string; startRow: number }) {
  try {
    const { google } = await import('googleapis')
    const privateKey = saKey.replace(/\\n/g, '\n')
    const auth = new google.auth.JWT({
      email: saEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })
    const sheets = google.sheets({ version: 'v4', auth })

    // Expect baseRange like: 'Form responses 1'!A:G or Registrations!A:G
    const match = baseRange.match(/^'?(.+?)'?!(\w):?(\w)?$/)
    if (!match) {
      console.log('[registrations] Incremental parse failed for range, falling back', { baseRange })
      return { appended: false }
    }
    const sheetName = match[1]
    const colStart = match[2] || 'A'
    const colEnd = match[3] || 'G'
    const incRange = `'${sheetName}'!${colStart}${startRow}:${colEnd}`

    const resp = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: incRange })
    const values = resp.data.values || []
    if (values.length === 0) {
      return { appended: true, rows: [], rowsRawCount: 0 }
    }

    // Fetch header row to map columns
    const headerResp = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: `'${sheetName}'!${colStart}1:${colEnd}1` })
    const headerValues = headerResp.data.values || []
    const headers = (headerValues[0] || []).map((h: any) => String(h))
    const toObject = (row: any[]) => headers.reduce<Record<string, any>>((acc, h, i) => { acc[h] = row[i] ?? ''; return acc }, {})
    const objects = values.map((row) => toObject(row as any[]))
    const rows = objects.map((r) => normalizeRowFromObject(r))
    const selected = selectImportant(rows)
    return { appended: true, rows: selected, rowsRawCount: values.length }
  } catch (e) {
    console.log('[registrations] Incremental append failed, will full refresh', e)
    return { appended: false }
  }
}
