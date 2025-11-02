import React from 'react'

interface FieldingData {
  player_id: string
  name: string
  team_name: string
  total_match: string
  catches: string
  caught_behind: string
  run_outs: string
  stumpings: string
  total_dismissal: string
}

export default function FieldingLeaderboard({ data }: { data: FieldingData[] }) {
  const sortedData = data
    .filter(player => parseInt(player.total_dismissal) > 0)
    .sort((a, b) => parseInt(b.total_dismissal) - parseInt(a.total_dismissal))
    .slice(0, 20)

  return (
    <div className="overflow-x-auto">
      <h2 className="text-2xl font-bold text-cricket-green mb-4">Fielding Leaderboard</h2>
      <table className="w-full text-sm">
        <thead className="bg-cricket-green text-white">
          <tr>
            <th className="p-3 text-left">Rank</th>
            <th className="p-3 text-left">Player</th>
            <th className="p-3 text-left">Team</th>
            <th className="p-3 text-center">Matches</th>
            <th className="p-3 text-center">Catches</th>
            <th className="p-3 text-center">Caught Behind</th>
            <th className="p-3 text-center">Run Outs</th>
            <th className="p-3 text-center">Stumpings</th>
            <th className="p-3 text-center">Total</th>
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
              <td className="p-3 text-center">{player.catches}</td>
              <td className="p-3 text-center">{player.caught_behind}</td>
              <td className="p-3 text-center">{player.run_outs}</td>
              <td className="p-3 text-center">{player.stumpings}</td>
              <td className="p-3 text-center font-bold text-cricket-green">{player.total_dismissal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
