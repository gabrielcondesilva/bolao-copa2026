'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateStandings, type GroupStanding } from '@/lib/engines/standings'
import type { Database } from '@/lib/supabase/types'

type DbMatch = Database['public']['Tables']['matches']['Row']
type DbTeam = Database['public']['Tables']['teams']['Row']

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const

interface Props {
  initialMatches: DbMatch[]
  teams: DbTeam[]
}

export function StandingsView({ initialMatches, teams }: Props) {
  const [matches, setMatches] = useState(initialMatches)

  useEffect(() => { setMatches(initialMatches) }, [initialMatches])

  useEffect(() => {
    const client = createClient()
    const channel = client
      .channel('standings-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        (payload) => {
          const updated = payload.new as DbMatch
          if (updated.phase === 'group_stage') {
            setMatches(prev => prev.map(m => m.id === updated.id ? updated : m))
          }
        },
      )
      .subscribe()

    return () => { client.removeChannel(channel) }
  }, [])

  const finishedMatches = matches.filter(
    m => m.is_finished && m.home_score !== null && m.away_score !== null && m.home_team_id && m.away_team_id,
  )

  const groupsWithTeams = GROUPS.filter(g => teams.some(t => t.group === g))

  if (groupsWithTeams.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-400">
        Nenhum time cadastrado ainda.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groupsWithTeams.map(group => {
        const groupTeams = teams
          .filter(t => t.group === group)
          .map(t => ({ id: t.id, name: t.name, fifa_ranking_reference: t.fifa_ranking_reference }))

        const groupMatches = finishedMatches
          .filter(m => m.group === group)
          .map(m => ({
            id: m.id,
            home_team_id: m.home_team_id!,
            away_team_id: m.away_team_id!,
            home_score: m.home_score!,
            away_score: m.away_score!,
          }))

        const standings = calculateStandings(groupTeams, groupMatches)

        return <GroupTable key={group} group={group} standings={standings} />
      })}
    </div>
  )
}

function GroupTable({ group, standings }: { group: string; standings: GroupStanding[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 bg-zinc-50 px-3 py-2">
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-600">
          Grupo {group}
        </span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-100 text-zinc-400">
            <th className="py-2 pl-3 pr-1 text-left font-medium">Time</th>
            <th className="w-6 px-1 text-center font-medium">J</th>
            <th className="w-6 px-1 text-center font-medium">V</th>
            <th className="w-6 px-1 text-center font-medium">E</th>
            <th className="w-6 px-1 text-center font-medium">D</th>
            <th className="w-7 px-1 text-center font-medium">GP</th>
            <th className="w-7 px-1 text-center font-medium">GC</th>
            <th className="w-7 px-1 text-center font-medium">SG</th>
            <th className="w-8 pr-3 pl-1 text-center font-bold text-zinc-500">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr
              key={s.team.id}
              className={`border-b border-zinc-100 last:border-0 ${
                i < 2 ? 'bg-green-50' : i === 2 ? 'bg-amber-50' : ''
              }`}
            >
              <td className="py-2 pl-3 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400">{s.position}</span>
                  <span className="truncate font-medium text-zinc-900 max-w-[90px] sm:max-w-none">
                    {s.team.name}
                  </span>
                </div>
              </td>
              <td className="px-1 text-center text-zinc-600">{s.played}</td>
              <td className="px-1 text-center text-zinc-600">{s.won}</td>
              <td className="px-1 text-center text-zinc-600">{s.drawn}</td>
              <td className="px-1 text-center text-zinc-600">{s.lost}</td>
              <td className="px-1 text-center text-zinc-600">{s.goals_for}</td>
              <td className="px-1 text-center text-zinc-600">{s.goals_against}</td>
              <td className={`px-1 text-center font-medium ${s.goal_diff > 0 ? 'text-green-700' : s.goal_diff < 0 ? 'text-red-600' : 'text-zinc-500'}`}>
                {s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}
              </td>
              <td className="py-2 pr-3 pl-1 text-center font-bold text-zinc-900">{s.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
