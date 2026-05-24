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

const PHASE_LABEL: Record<string, string> = {
  round_of_32:   '16-avos de Final',
  round_of_16:   'Oitavas de Final',
  quarterfinals: 'Quartas de Final',
  semifinals:    'Semifinais',
  third_place:   'Disputa de 3º Lugar',
  final:         'Final',
}

export function MatchList({ initialMatches, teams, phase }: Props) {
  const [matches, setMatches] = useState(initialMatches)
  const teamName = new Map(teams.map(t => [t.id, t.name]))

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
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-400">
        Nenhum jogo cadastrado para esta fase.
      </div>
    )
  }

  // Group by local date
  const grouped = new Map<string, Match[]>()
  for (const m of [...matches].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))) {
    const key = new Date(m.scheduled_at).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    })
    grouped.set(key, [...(grouped.get(key) ?? []), m])
  }

  const isGroupStage = phase === 'group_stage'

  return (
    <div className="space-y-6">
      {[...grouped.entries()].map(([date, dayMatches]) => (
        <div key={date}>
          {/* Date header */}
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400 capitalize">
            {date}
          </h3>

          <div className="space-y-3">
            {dayMatches.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                teamName={teamName}
                isGroupStage={isGroupStage}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function MatchCard({
  match,
  teamName,
  isGroupStage,
}: {
  match: Match
  teamName: Map<string, string>
  isGroupStage: boolean
}) {
  const home = teamName.get(match.home_team_id ?? '') ?? '—'
  const away = teamName.get(match.away_team_id ?? '') ?? '—'

  const time = new Date(match.scheduled_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  })

  const contextLabel = isGroupStage && match.group
    ? `Grupo ${match.group}`
    : (PHASE_LABEL[match.phase] ?? match.phase)

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">

      {/* Card header: group/phase + time */}
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-4 py-2">
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
          {contextLabel}
        </span>
        <div className="flex items-center gap-2">
          {match.is_finished ? (
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-500">
              Encerrado
            </span>
          ) : (
            <span className="text-xs font-medium text-zinc-400">{time}</span>
          )}
        </div>
      </div>

      {/* Teams + score */}
      <div className="flex items-center gap-2 px-4 py-5">
        {/* Home team */}
        <span className="min-w-0 flex-1 truncate text-right text-base font-bold text-zinc-900 sm:text-lg">
          {home}
        </span>

        {/* Score / VS */}
        <div className="w-24 shrink-0 text-center sm:w-28">
          {match.is_finished ? (
            <span className="text-2xl font-black tabular-nums text-zinc-900 sm:text-3xl">
              {match.home_score} <span className="text-zinc-300">–</span> {match.away_score}
            </span>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-bold text-zinc-300">vs</span>
              <span className="text-xs text-zinc-400">{time}</span>
            </div>
          )}
        </div>

        {/* Away team */}
        <span className="min-w-0 flex-1 truncate text-base font-bold text-zinc-900 sm:text-lg">
          {away}
        </span>
      </div>

      {/* Card footer: stadium */}
      {match.stadium && (
        <div className="border-t border-zinc-100 px-4 py-2">
          <span className="text-xs text-zinc-400">{match.stadium}</span>
        </div>
      )}
    </div>
  )
}
