import React from 'react'

interface BattingData {
  player_id: string
  name: string
  team_name: string
  total_match: string
  innings: string
  total_runs: string
  highest_run: string
  average: string
  strike_rate: string
  '4s': string
  '6s': string
  '50s': string
  '100s': string
}

export default function BattingLeaderboard({ data, search }: { data: BattingData[]; search?: string }) {
  const term = (search || '').trim().toLowerCase()
  // Filter by search, keep players with >0 runs, sort by runs (desc)
  const sortedData = data
    .filter(p => parseInt(p.total_runs) > 0)
    .filter(p => (term ? p.name.toLowerCase().includes(term) : true))
    .sort((a, b) => parseInt(b.total_runs) - parseInt(a.total_runs))

  return (
    <div className="overflow-x-auto">
      <h2 className="text-2xl font-bold text-cricket-green mb-4">Batting Leaderboard</h2>
      <table className="w-full text-sm">
        <thead className="bg-cricket-green text-white">
          <tr>
            <th className="p-3 text-left">Rank</th>
            <th className="p-3 text-left">Player</th>
            <th className="p-3 text-left">Team</th>
            <th className="p-3 text-center">Mat</th>
            <th className="p-3 text-center">Inns</th>
            <th className="p-3 text-center">Runs</th>
            <th className="p-3 text-center">HS</th>
            <th className="p-3 text-center">Avg</th>
            <th className="p-3 text-center">SR</th>
            <th className="p-3 text-center">4s</th>
            <th className="p-3 text-center">6s</th>
            <th className="p-3 text-center">50s</th>
            <th className="p-3 text-center">100s</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((player, index) => (
            <tr 
              key={player.player_id} 
              className={`border-b hover:bg-green-50 ${index < 3 ? 'bg-yellow-50' : ''}`}
            >
              <td className="p-3 font-semibold">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && index + 1}
              </td>
              <td className="p-3 font-medium">{player.name}</td>
              <td className="p-3 text-gray-600">{player.team_name}</td>
              <td className="p-3 text-center">{player.total_match}</td>
              <td className="p-3 text-center">{player.innings}</td>
              <td className="p-3 text-center font-bold text-cricket-green">{player.total_runs}</td>
              <td className="p-3 text-center">{player.highest_run}</td>
              <td className="p-3 text-center">{player.average}</td>
              <td className="p-3 text-center">{player.strike_rate}</td>
              <td className="p-3 text-center">{player['4s']}</td>
              <td className="p-3 text-center">{player['6s']}</td>
              <td className="p-3 text-center">{player['50s']}</td>
              <td className="p-3 text-center">{player['100s']}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
