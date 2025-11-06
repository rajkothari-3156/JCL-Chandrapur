/*
  Compare player names between two CSVs and write a mapping JSON.
  Prior (2024): public/data/840910_fielding_leaderboard.csv -> jcl_2024
  Latter (2023): public/data/1243558_fielding_leaderboard.csv -> jcl_2023

  Usage:
    node scripts/compare-names.js

  Output:
    public/data/name_mapping.json
*/

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

const CSV_2024 = path.join(__dirname, '..', 'public', 'data', '1243558_fielding_leaderboard.csv')
const CSV_2023 = path.join(__dirname, '..', 'public', 'data', '840910_fielding_leaderboard.csv')
const OUTPUT = path.join(__dirname, '..', 'public', 'data', 'name_mapping.json')

function readCsv(filePath) {
  const csvText = fs.readFileSync(filePath, 'utf8')
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true })
  if (parsed.errors && parsed.errors.length) {
    throw new Error(`Error parsing ${path.basename(filePath)}: ${parsed.errors[0].message}`)
  }
  return parsed.data
}

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function buildIndex(rows, label) {
  const index = new Map() // normName -> { originalNames: Set, rows: [] }
  for (const r of rows) {
    const original = (r.name ?? r.Name ?? '').toString()
    if (!original) continue
    const norm = normalizeName(original)
    if (!index.has(norm)) index.set(norm, { originalNames: new Set(), rows: [] })
    const entry = index.get(norm)
    entry.originalNames.add(original)
    entry.rows.push(r)
  }
  return index
}

function main() {
  console.log('Reading CSVs...')
  const rows2024 = readCsv(CSV_2024)
  const rows2023 = readCsv(CSV_2023)

  console.log('Building indexes...')
  const idx2024 = buildIndex(rows2024, 'jcl_2024')
  const idx2023 = buildIndex(rows2023, 'jcl_2023')

  const map2024to2023 = {}
  const map2023to2024 = {}
  const unmatched2024 = []
  const unmatched2023 = []

  // Map 2024 -> 2023
  for (const [norm, e24] of idx2024.entries()) {
    const e23 = idx2023.get(norm)
    if (e23) {
      map2024to2023[[...e24.originalNames][0]] = [...e23.originalNames]
    } else {
      unmatched2024.push([...e24.originalNames][0])
    }
  }

  // Map 2023 -> 2024
  for (const [norm, e23] of idx2023.entries()) {
    const e24 = idx2024.get(norm)
    if (e24) {
      map2023to2024[[...e23.originalNames][0]] = [...e24.originalNames]
    } else {
      unmatched2023.push([...e23.originalNames][0])
    }
  }

  const result = {
    source_2024: path.basename(CSV_2024),
    source_2023: path.basename(CSV_2023),
    jcl_2024_to_2023: map2024to2023,
    jcl_2023_to_2024: map2023to2024,
    unmatched_2024: unmatched2024.sort(),
    unmatched_2023: unmatched2023.sort(),
    generated_at: new Date().toISOString(),
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2), 'utf8')
  console.log(`Mapping written to ${OUTPUT}`)
}

if (require.main === module) {
  try {
    main()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
