'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Match = Database['public']['Tables']['matches']['Row']

interface Props {
  initialMatches: Match[]
  teams: { id: string; name: string }[]
  phase: string
}

export function MatchList({ initialMatches, teams, phase }: Props) {
  const [matches, setMatches] = useState(initialMatches)
  const teamName = new Map(teams.map(t => [t.id, t.name]))

  // Sync state when phase filter changes (server re-renders with new initialMatches)
  useEffect(() => { setMatches(initialMatches) }, [initialMatches])

  useEffect(() => {
    const client = createClient()
    const channel = client
      .channel('matches-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        (payload) => {
          const updated = payload.new as Match
          setMatches(prev => prev.map(m => m.id === updated.id ? updated : m))
        },
      )
      .subscribe()

    return () => { client.removeChannel(channel) }
  }, [])

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-400">
        Nenhum jogo cadastrado para esta fase.
      </div>
    )
  }

  // Group by local date
  const grouped = new Map<string, Match[]>()
  for (const m of [...matches].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))) {
    const key = new Date(m.scheduled_at).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long',
    })
    grouped.set(key, [...(grouped.get(key) ?? []), m])
  }

  const showGroup = phase === 'group_stage'

  return (
    <div className="space-y-4">
      {[...grouped.entries()].map(([date, dayMatches]) => (
        <div key={date} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 capitalize">
              {date}
            </span>
          </div>
          {dayMatches.map(m => (
            <MatchRow key={m.id} match={m} teamName={teamName} showGroup={showGroup} />
          ))}
        </div>
      ))}
    </div>
  )
}

function MatchRow({
  match,
  teamName,
  showGroup,
}: {
  match: Match
  teamName: Map<string, string>
  showGroup: boolean
}) {
  const home = teamName.get(match.home_team_id ?? '') ?? '—'
  const away = teamName.get(match.away_team_id ?? '') ?? '—'
  const time = new Date(match.scheduled_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="border-b border-zinc-100 last:border-0">
      <div className="flex items-center gap-2 px-3 py-3 sm:px-4">
        {/* Time + group */}
        <div className="w-10 shrink-0 text-center">
          <div className="text-xs font-medium text-zinc-500">{time}</div>
          {showGroup && match.group && (
            <div className="text-xs text-zinc-400">{match.group}</div>
          )}
        </div>

        {/* Home team */}
        <span className="min-w-0 flex-1 truncate text-right text-sm font-semibold text-zinc-900">
          {home}
        </span>

        {/* Score */}
        <div className="w-14 shrink-0 text-center sm:w-16">
          {match.is_finished ? (
            <span className="text-sm font-bold text-zinc-900 sm:text-base">
              {match.home_score} × {match.away_score}
            </span>
          ) : (
            <span className="text-sm text-zinc-300">— × —</span>
          )}
        </div>

        {/* Away team */}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900">
          {away}
        </span>
      </div>

      {/* Stadium */}
      {match.stadium && (
        <div className="pb-2 text-center text-xs text-zinc-400">{match.stadium}</div>
      )}
    </div>
  )
}
