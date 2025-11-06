import { NextResponse } from 'next/server'
import Papa from 'papaparse'

// Fetch registrations from either a published CSV or a private Google Sheet via Service Account
// Simple in-memory cache (resets on server restart)
let CACHE: { data: any[]; lastUpdated: number; totalRows: number } | null = null

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
      CACHE = { data, lastUpdated: Date.now(), totalRows: data.length }
      return NextResponse.json({ count: data.length, data })
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
          CACHE.data = [...CACHE.data, ...inc.rows]
          CACHE.lastUpdated = Date.now()
          CACHE.totalRows += inc.rowsRawCount
          return NextResponse.json({ count: CACHE.data.length, data: CACHE.data, cached: false, appended: inc.rowsRawCount })
        }
        // Fallback to full if incremental not possible
      }

      const data = await fetchFromPrivateSheet({ saEmail, saKey, sheetId, range })
      CACHE = { data, lastUpdated: Date.now(), totalRows: data.length }
      return NextResponse.json({ count: data.length, data, cached: false })
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
