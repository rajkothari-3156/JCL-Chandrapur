import fs from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'

const root = process.cwd()

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()

async function loadCsvRows(csvPath) {
  const text = await fs.readFile(csvPath, 'utf8')
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
  return parsed.data
}

async function main() {
  const [,, registrationsJsonPath] = process.argv
  if (!registrationsJsonPath) {
    console.error('Usage: node scripts/generate_reg_mappings.mjs <registrations.json>')
    process.exit(1)
  }

  // Load registrations JSON from dev API output
  const regJsonText = await fs.readFile(registrationsJsonPath, 'utf8')
  const regJson = JSON.parse(regJsonText)
  const registrations = Array.isArray(regJson?.data) ? regJson.data : []
  const regNames = Array.from(new Set(registrations.map(r => r.fullName).filter(Boolean)))

  // Load 2024 and 2023 CSVs (fielding chosen for name coverage, consistent with existing mapping sources)
  const dataDir = path.join(root, 'public', 'data')
  const y2024 = await loadCsvRows(path.join(dataDir, '1243558_fielding_leaderboard.csv')).catch(() => [])
  const y2023 = await loadCsvRows(path.join(dataDir, '840910_fielding_leaderboard.csv')).catch(() => [])

  const map24 = new Map()
  const map23 = new Map()
  for (const r of y2024) {
    const name = r.name ?? r.Name
    if (!name) continue
    map24.set(norm(name), name)
  }
  for (const r of y2023) {
    const name = r.name ?? r.Name
    if (!name) continue
    map23.set(norm(name), name)
  }

  // Build mappings: exact normalized matches
  const regTo24 = {}
  const regTo23 = {}
  for (const regName of regNames) {
    const key = norm(regName)
    const m24 = map24.get(key)
    const m23 = map23.get(key)

    if (m24) {
      regTo24[regName] = Array.from(new Set([m24]))
    }
    if (m23) {
      regTo23[regName] = Array.from(new Set([m23]))
    }

    // If no exact match, try a conservative fallback: case-insensitive exact token match
    if (!m24) {
      const found24 = [...map24.keys()].find(k => k === key)
      if (found24) regTo24[regName] = Array.from(new Set([map24.get(found24)]))
    }
    if (!m23) {
      const found23 = [...map23.keys()].find(k => k === key)
      if (found23) regTo23[regName] = Array.from(new Set([map23.get(found23)]))
    }
  }

  // Merge into existing name_mapping.json
  const nmPath = path.join(dataDir, 'name_mapping.json')
  const nmText = await fs.readFile(nmPath, 'utf8')
  const nm = JSON.parse(nmText)

  nm.reg_to_2024 = nm.reg_to_2024 || {}
  nm.reg_to_2023 = nm.reg_to_2023 || {}

  const mergeMap = (dst, src) => {
    for (const [k, v] of Object.entries(src)) {
      const existing = Array.isArray(dst[k]) ? dst[k] : []
      const merged = Array.from(new Set([...existing, ...v]))
      dst[k] = merged
    }
  }

  mergeMap(nm.reg_to_2024, regTo24)
  mergeMap(nm.reg_to_2023, regTo23)

  await fs.writeFile(nmPath, JSON.stringify(nm, null, 2), 'utf8')
  console.log('Updated name_mapping.json with', Object.keys(regTo24).length, 'reg_to_2024 and', Object.keys(regTo23).length, 'reg_to_2023 entries')
}

main().catch((e) => {
  console.error('Failed to generate registration mappings:', e)
  process.exit(1)
})
