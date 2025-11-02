'use client'

import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { Trophy, TrendingUp, Target, Award } from 'lucide-react'
import BattingLeaderboard from '@/components/BattingLeaderboard'
import BowlingLeaderboard from '@/components/BowlingLeaderboard'
import FieldingLeaderboard from '@/components/FieldingLeaderboard'
import MVPLeaderboard from '@/components/MVPLeaderboard'

type LeaderboardType = 'batting' | 'bowling' | 'fielding' | 'mvp'

export default function Home() {
  const [year, setYear] = useState<'2023' | '2024'>('2024')
  const [category, setCategory] = useState<LeaderboardType>('batting')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [year, category])

  const loadData = async () => {
    setLoading(true)
    const tournamentId = year === '2023' ? '840910' : '1243558'
    const filename = `${tournamentId}_${category}_leaderboard.csv`
    
    try {
      const response = await fetch(`/data/${filename}`)
      const csvText = await response.text()
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          setData(results.data)
          setLoading(false)
        },
        error: (error: any) => {
          console.error('Error parsing CSV:', error)
          setLoading(false)
        }
      })
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  const categories = [
    { id: 'batting' as LeaderboardType, name: 'Batting', icon: Trophy },
    { id: 'bowling' as LeaderboardType, name: 'Bowling', icon: Target },
    { id: 'fielding' as LeaderboardType, name: 'Fielding', icon: TrendingUp },
    { id: 'mvp' as LeaderboardType, name: 'MVP', icon: Award },
  ]

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
            JCL Cricket Leaderboard
          </h1>
          <p className="text-xl text-green-100">Player Performance Statistics</p>
        </div>

        {/* Year Selector */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setYear('2023')}
            className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 ${
              year === '2023'
                ? 'bg-white text-cricket-green shadow-lg scale-105'
                : 'bg-cricket-lightgreen text-white hover:bg-green-700'
            }`}
          >
            2023 Season
          </button>
          <button
            onClick={() => setYear('2024')}
            className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 ${
              year === '2024'
                ? 'bg-white text-cricket-green shadow-lg scale-105'
                : 'bg-cricket-lightgreen text-white hover:bg-green-700'
            }`}
          >
            2024 Season
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`p-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  category === cat.id
                    ? 'bg-white text-cricket-green shadow-lg scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Icon size={20} />
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Leaderboard Content */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-green"></div>
              <p className="mt-4 text-gray-600">Loading leaderboard...</p>
            </div>
          ) : (
            <>
              {category === 'batting' && <BattingLeaderboard data={data} />}
              {category === 'bowling' && <BowlingLeaderboard data={data} />}
              {category === 'fielding' && <FieldingLeaderboard data={data} />}
              {category === 'mvp' && <MVPLeaderboard data={data} />}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
