'use client'

import React, { useEffect, useState } from 'react'

type Registration = {
  timestamp: string | null
  fullName: string
  age: string | number | null
  contact: string | null
  playingStyle: string | null
  tshirtSize: string | null
  photoUrl: string | null
}

export default function RegistrationsPage() {
  const [data, setData] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/registrations', { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load')
        setData(json.data as Registration[])
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = data.filter((r: Registration) =>
    [r.fullName, r.playingStyle, r.tshirtSize]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">JCL Player Registrations</h1>
          <p className="text-green-100">Live data from Google Sheets</p>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <input
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search by name, style, size"
            className="w-full md:w-80 rounded-md border border-green-800 bg-green-900/40 text-white placeholder-green-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cricket-gold"
          />
          <span className="text-green-100 text-sm">{filtered.length} of {data.length}</span>
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
                    <td className="px-3 py-2 text-green-100 font-medium">{r.fullName}</td>
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
                        <a className="text-cricket-gold hover:underline" href={r.photoUrl} target="_blank" rel="noreferrer">View</a>
                      ) : ''}
                    </td>
                    <td className="px-3 py-2 text-green-100">{r.timestamp ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
