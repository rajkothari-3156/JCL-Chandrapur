import React from 'react'

interface BowlingData {
  player_id: string
  name: string
  team_name: string
  total_match: string
  innings: string
  total_wickets: string
  balls: string
  highest_wicket: string
  economy: string
  SR: string
  avg: string
  overs: string
  maidens: string
}

export default function BowlingLeaderboard({ data }: { data: BowlingData[] }) {
  const sortedData = data
    .filter(player => parseInt(player.total_wickets) > 0)
    .sort((a, b) => parseInt(b.total_wickets) - parseInt(a.total_wickets))
    .slice(0, 20)

  return (
    <div className="overflow-x-auto">
      <h2 className="text-2xl font-bold text-cricket-green mb-4">Bowling Leaderboard</h2>
      <table className="w-full text-sm">
        <thead className="bg-cricket-green text-white">
          <tr>
            <th className="p-3 text-left">Rank</th>
            <th className="p-3 text-left">Player</th>
            <th className="p-3 text-left">Team</th>
            <th className="p-3 text-center">Mat</th>
            <th className="p-3 text-center">Inns</th>
            <th className="p-3 text-center">Wkts</th>
            <th className="p-3 text-center">Best</th>
            <th className="p-3 text-center">Overs</th>
            <th className="p-3 text-center">Econ</th>
            <th className="p-3 text-center">Avg</th>
            <th className="p-3 text-center">SR</th>
            <th className="p-3 text-center">M</th>
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
              <td className="p-3 text-center font-bold text-cricket-green">{player.total_wickets}</td>
              <td className="p-3 text-center">{player.highest_wicket}</td>
              <td className="p-3 text-center">{player.overs}</td>
              <td className="p-3 text-center">{player.economy}</td>
              <td className="p-3 text-center">{player.avg}</td>
              <td className="p-3 text-center">{player.SR}</td>
              <td className="p-3 text-center">{player.maidens}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
