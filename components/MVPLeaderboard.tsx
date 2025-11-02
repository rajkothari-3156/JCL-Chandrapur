import React from 'react'

interface MVPData {
  'Player Name': string
  'Team Name': string
  'Player Role': string
  'Matches': string
  'Batting': string
  'Bowling': string
  'Fielding': string
  'Total': string
}

export default function MVPLeaderboard({ data, search }: { data: MVPData[]; search?: string }) {
  const term = (search || '').trim().toLowerCase()
  const sortedData = data
    .filter(player => parseFloat(player.Total) > 0)
    .filter(player => (term ? player['Player Name'].toLowerCase().includes(term) : true))
    .sort((a, b) => parseFloat(b.Total) - parseFloat(a.Total))

  return (
    <div className="overflow-x-auto">
      <h2 className="text-2xl font-bold text-cricket-green mb-4">MVP Leaderboard</h2>
      <table className="w-full text-sm">
        <thead className="bg-cricket-green text-white">
          <tr>
            <th className="p-3 text-left">Rank</th>
            <th className="p-3 text-left">Player</th>
            <th className="p-3 text-left">Team</th>
            <th className="p-3 text-left">Role</th>
            <th className="p-3 text-center">Matches</th>
            <th className="p-3 text-center">Batting</th>
            <th className="p-3 text-center">Bowling</th>
            <th className="p-3 text-center">Fielding</th>
            <th className="p-3 text-center">Total</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((player, index) => (
            <tr 
              key={index} 
              className={`border-b hover:bg-green-50 ${index < 3 ? 'bg-yellow-50' : ''}`}
            >
              <td className="p-3 font-semibold">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && index + 1}
              </td>
              <td className="p-3 font-medium">{player['Player Name']}</td>
              <td className="p-3 text-gray-600">{player['Team Name']}</td>
              <td className="p-3 text-gray-600 text-xs">{player['Player Role'] || '-'}</td>
              <td className="p-3 text-center">{player.Matches}</td>
              <td className="p-3 text-center">{parseFloat(player.Batting).toFixed(2)}</td>
              <td className="p-3 text-center">{parseFloat(player.Bowling).toFixed(2)}</td>
              <td className="p-3 text-center">{parseFloat(player.Fielding).toFixed(2)}</td>
              <td className="p-3 text-center font-bold text-cricket-green">{parseFloat(player.Total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
