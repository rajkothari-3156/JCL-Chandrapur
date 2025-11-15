'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'
import Navbar from '@/components/layout/Navbar'

type Registration = {
  timestamp: string | null
  fullName: string
  age: string | number | null
  contact: string | null
  playingStyle: string | null
  tshirtSize: string | null
  photoUrl: string | null
  auctionGroup?: string | null
  auctionAgeCategory?: string | null
  auctionPoints?: number | null
  auctionTeam?: string | null
}

export default function RegistrationsPage() {
  const [data, setData] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [cached, setCached] = useState<boolean | null>(null)
  const [appended, setAppended] = useState<number | null>(null)
  const [mapping, setMapping] = useState<any | null>(null)
  const [stats2024, setStats2024] = useState<Record<string, any[]>>({})
  const [stats2023, setStats2023] = useState<Record<string, any[]>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [selectedName, setSelectedName] = useState<string>('')
  const [modalError, setModalError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'batting' | 'bowling' | 'fielding' | 'mvp'>('fielding')
  const [photoOpen, setPhotoOpen] = useState(false)
  const [photoSrc, setPhotoSrc] = useState<string>('')
  const [photoAlt, setPhotoAlt] = useState<string>('')
  const [zoom, setZoom] = useState<number>(1)
  const [tx, setTx] = useState<number>(0)
  const [ty, setTy] = useState<number>(0)
  const [panning, setPanning] = useState<boolean>(false)
  const [last, setLast] = useState<{ x: number; y: number } | null>(null)

  // Google Drive helpers: extract file id and build reliable URLs
  const extractDriveId = (url: string): string | null => {
    if (!url) return null
    try {
      // Pattern: https://drive.google.com/file/d/FILE_ID/view...
      const m1 = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
      if (m1 && m1[1]) return m1[1]
      // Pattern: ...?id=FILE_ID (open or uc)
      const u = new URL(url)
      const id = u.searchParams.get('id')
      if (id) return id
      // Already a uc link with id param in path (rare)
      const m2 = url.match(/[?&]id=([^&]+)/)
      if (m2 && m2[1]) return m2[1]
      return null
    } catch {
      return null
    }
  }

  const driveThumbUrl = (url: string): string => {
    const id = extractDriveId(url)
    // Use Drive's thumbnail endpoint when we have an id; fall back to original
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w200` : url
  }

  const driveViewUrl = (url: string): string => {
    const id = extractDriveId(url)
    return id ? `https://drive.google.com/uc?export=view&id=${id}` : url
  }

  useEffect(() => {
    const load = async (force = false) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/registrations${force ? '?refresh=1' : ''}`, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load')
        setData(json.data as Registration[])
        setCached(Boolean(json.cached))
        setAppended(typeof json.appended === 'number' ? json.appended : null)
        
        // Debug: Log first 3 photoUrl values
        console.log('[registrations] Photo URL samples:', 
          (json.data as Registration[]).slice(0, 3).map(r => ({
            name: r.fullName,
            photoUrl: r.photoUrl,
            hasPhoto: !!r.photoUrl,
            thumbUrl: r.photoUrl ? driveThumbUrl(r.photoUrl) : null,
            extractedId: r.photoUrl ? extractDriveId(r.photoUrl) : null
          }))
        )
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleRefresh = async () => {
    await (async () => {
      setAppended(null)
      setCached(null)
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/registrations?refresh=1', { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to refresh')
        setData(json.data as Registration[])
        setCached(Boolean(json.cached))
        setAppended(typeof json.appended === 'number' ? json.appended : null)
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    })()
  }

  const filtered = data.filter((r: Registration) =>
    [r.fullName, r.playingStyle, r.tshirtSize]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const normalizeName = (name: string) => name.toLowerCase().replace(/\s+/g, ' ').trim()

  // Lazy-load mapping and CSVs once when a player is first opened
  const ensureAuxData = async () => {
    if (!mapping) {
      try {
        const res = await fetch('/data/name_mapping.json', { cache: 'no-store' })
        if (res.ok) {
          setMapping(await res.json())
        } else {
          setMapping({})
        }
      } catch {
        setMapping({})
      }
    }
    const loadCsv = async (path: string) => {
      const text = await (await fetch(path, { cache: 'no-store' })).text()
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
      return (parsed.data as any[])
    }
    // Load all categories for 2024 (1243558) and 2023 (840910)
    const loaders: Array<Promise<void>> = []
    const categories = ['batting', 'bowling', 'fielding', 'mvp'] as const
    for (const cat of categories) {
      if (!stats2024[cat]) {
        loaders.push(
          loadCsv(`/data/1243558_${cat}_leaderboard.csv`).then(rows => {
            setStats2024(prev => ({ ...prev, [cat]: rows }))
          }).catch(() => setStats2024(prev => ({ ...prev, [cat]: [] })))
        )
      }
      if (!stats2023[cat]) {
        loaders.push(
          loadCsv(`/data/840910_${cat}_leaderboard.csv`).then(rows => {
            setStats2023(prev => ({ ...prev, [cat]: rows }))
          }).catch(() => setStats2023(prev => ({ ...prev, [cat]: [] })))
        )
      }
    }
    if (loaders.length) await Promise.allSettled(loaders)
  }

  const onClickPlayer = async (name: string) => {
    setSelectedName(name)
    setModalOpen(true)
    setModalLoading(true)
    setModalError(null)
    try {
      await ensureAuxData()
    } catch (e: any) {
      setModalError(e?.message ?? 'Failed to load stats')
    } finally {
      setModalLoading(false)
    }
  }

  const matchedStats = useMemo(() => {
    if (!selectedName) return { y2024: [], y2023: [] }
    const normSel = normalizeName(selectedName)

    // Derive candidate names from mapping if available
    const map = mapping || {}
    const m2423 = map.jcl_2024_to_2023 || {}
    const m2324 = map.jcl_2023_to_2024 || {}
    const regTo24 = map.reg_to_2024 || {}
    const regTo23 = map.reg_to_2023 || {}

    // find closest key by normalization
    const keys2024 = Object.keys(m2423 || {})
    const key2024 = keys2024.find(k => normalizeName(k) === normSel)
    const mapped23Candidates: string[] = key2024 ? (m2423[key2024] || []) : []

    const keys2023 = Object.keys(m2324 || {})
    const key2023 = keys2023.find(k => normalizeName(k) === normSel)
    const mapped24Candidates: string[] = key2023 ? (m2324[key2023] || []) : []

    // registration -> season mappings (selectedName comes from registration list)
    const reg24Keys = Object.keys(regTo24)
    const regKey24 = reg24Keys.find(k => normalizeName(k) === normSel)
    const regMapped24: string[] = regKey24 ? (regTo24[regKey24] || []) : []

    const reg23Keys = Object.keys(regTo23)
    const regKey23 = reg23Keys.find(k => normalizeName(k) === normSel)
    const regMapped23: string[] = regKey23 ? (regTo23[regKey23] || []) : []

    const names24 = [selectedName, ...mapped24Candidates, ...regMapped24].map(normalizeName)
    const names23 = [selectedName, ...mapped23Candidates, ...regMapped23].map(normalizeName)

    const pick = (rows: any[] | undefined, names: string[]) => {
      if (!rows) return []
      return rows.filter(r => names.includes(normalizeName(r.name || r.Name || '')))
    }

    return {
      y2024: pick(stats2024[activeTab], names24),
      y2023: pick(stats2023[activeTab], names23),
    }
  }, [selectedName, mapping, stats2024, stats2023, activeTab])

  return (
    <>
      <Navbar />
      <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">JCL Player Registrations</h1>
          <p className="text-green-100">Live data from Google Sheets</p>
          <div className="mt-4">
            <a
              href="https://forms.gle/nqHc8RjNQcL2JKk76"
              target="_blank"
              rel="noreferrer"
              className="inline-block px-5 py-2 rounded-md bg-cricket-gold text-black font-semibold shadow hover:opacity-90"
            >
              Register Now
            </a>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <input
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search by name, style, size"
            className="w-full md:w-80 rounded-md border border-green-800 bg-green-900/40 text-white placeholder-green-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cricket-gold"
          />
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-2 rounded-md bg-cricket-gold text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <span className="text-green-100 text-sm">{filtered.length} of {data.length}</span>
          {cached !== null && (
            <span className="text-green-200 text-xs">{cached ? 'served from cache' : 'fresh'}</span>
          )}
          {appended !== null && appended > 0 && (
            <span className="text-green-200 text-xs">+{appended} new</span>
          )}
        </div>

        {loading && (
          <div className="text-center text-green-100">Loading...</div>
        )}
        {error && (
          <div className="text-center text-red-200">{error}</div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-cricket-lightgreen text-white">
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Auction Team</th>
                  <th className="px-3 py-2 text-left">Auction Points</th>
                  <th className="px-3 py-2 text-left">Age</th>
                  <th className="px-3 py-2 text-left">Contact</th>
                  <th className="px-3 py-2 text-left">Playing Style</th>
                  <th className="px-3 py-2 text-left">T-shirt Size</th>
                  <th className="px-3 py-2 text-left">Photo</th>
                  <th className="px-3 py-2 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} className={i % 2 ? 'bg-green-900/30' : 'bg-green-900/10'}>
                    <td className="px-3 py-2 text-green-100 font-medium">
                      <button
                        className="hover:underline text-cricket-gold"
                        onClick={() => onClickPlayer(r.fullName)}
                        title="View stats"
                      >
                        {r.fullName}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-green-100">{r.auctionTeam ?? ''}</td>
                    <td className="px-3 py-2 text-green-100">{typeof r.auctionPoints === 'number' ? r.auctionPoints : ''}</td>
                    <td className="px-3 py-2 text-green-100">{r.age ?? ''}</td>
                    <td className="px-3 py-2 text-green-100">
                      {r.contact ? (
                        <a className="text-cricket-gold hover:underline" href={`tel:${r.contact}`}>{r.contact}</a>
                      ) : ''}
                    </td>
                    <td className="px-3 py-2 text-green-100">{r.playingStyle ?? ''}</td>
                    <td className="px-3 py-2 text-green-100">{r.tshirtSize ?? ''}</td>
                    <td className="px-3 py-2 text-green-100">
                      {r.photoUrl ? (
                        <button
                          type="button"
                          className="group inline-flex items-center gap-2 focus:outline-none"
                          onClick={() => {
                            console.log('[photo-click]', { name: r.fullName, photoUrl: r.photoUrl, driveId: extractDriveId(r.photoUrl || ''), viewUrl: driveViewUrl(r.photoUrl || '') })
                            const direct = driveViewUrl(r.photoUrl || '') || ''
                            setPhotoSrc(direct)
                            setPhotoAlt(r.fullName + ' photo')
                            setZoom(1)
                            setTx(0)
                            setTy(0)
                            setPanning(false)
                            setLast(null)
                            setPhotoOpen(true)
                          }}
                          title="View photo"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={driveThumbUrl(r.photoUrl) || ''}
                            alt={r.fullName + ' photo'}
                            className="h-12 w-12 object-cover rounded-md border border-green-800/50 bg-green-900/40"
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement
                              console.log('[photo-error]', { name: r.fullName, photoUrl: r.photoUrl, src: img.src, fallback: img.dataset.fallback })
                              // Fallback to view URL once, then hide if still failing
                              if (img.dataset.fallback !== '1') {
                                img.dataset.fallback = '1'
                                img.src = driveViewUrl(r.photoUrl || '') || ''
                              } else {
                                img.style.display = 'none'
                              }
                            }}
                          />
                          <span className="sr-only">Open photo</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500" title={`No photo URL for ${r.fullName}`}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-green-100">{r.timestamp ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Player stats modal */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selectedName ? `Stats: ${selectedName}` : 'Stats'}>
          {modalLoading && (
            <div className="text-green-100 p-4">Loading stats...</div>
          )}
          {modalError && (
            <div className="text-red-200 p-4">{modalError}</div>
          )}
          {!modalLoading && !modalError && (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                {(['batting','bowling','fielding','mvp'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${activeTab === tab ? 'bg-cricket-gold text-black' : 'bg-green-900/40 text-green-100'} px-3 py-1.5 rounded-md border border-green-800`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex flex-col md:flex-row -m-2">
                <StatTable title={`JCL 2024 — ${activeTab.toUpperCase()}`} rows={matchedStats.y2024} />
                <StatTable title={`JCL 2023 — ${activeTab.toUpperCase()}`} rows={matchedStats.y2023} />
              </div>
            </>
          )}
        </Modal>
      </div>
    </main>
    </>
  )
}

function StatTable({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div className="w-full md:w-1/2 p-2">
      <div className="bg-green-900/30 rounded-lg overflow-hidden shadow">
        <div className="bg-cricket-lightgreen text-white px-3 py-2 font-semibold">{title}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-green-200">
                {/* Build dynamic headers from the first row */}
                {(() => {
                  if (!rows || rows.length === 0) return (
                    <>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Stats</th>
                    </>
                  )
                  const first = rows[0]
                  const exclude = new Set(['player_id','team_id','team_name'])
                  const keys = Object.keys(first).filter(k => !exclude.has(k))
                  return keys.map((k) => (
                    <th key={k} className={`px-3 py-2 ${k.toLowerCase() === 'name' ? 'text-left' : 'text-right'}`}>{k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</th>
                  ))
                })()}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-4 text-green-300">No records</td></tr>
              )}
              {rows.map((row, i) => {
                const exclude = new Set(['player_id','team_id','team_name'])
                const keys = Object.keys(row).filter(k => !exclude.has(k))
                return (
                  <tr key={i} className={i % 2 ? 'bg-green-900/30' : 'bg-green-900/10'}>
                    {keys.map((k) => (
                      <td key={k} className={`px-3 py-2 text-green-100 ${k.toLowerCase() === 'name' ? '' : 'text-right'}`}>{row[k]}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-green-950 border border-green-800 rounded-xl shadow-2xl max-w-5xl w-[95%] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-green-200 hover:text-white">Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}
