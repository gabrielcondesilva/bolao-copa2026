'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { teamFlag } from '@/lib/flags'
import type { Database } from '@/lib/supabase/types'

type Match = Database['public']['Tables']['matches']['Row']

interface Team {
  id: string
  name: string
  country_code: string
}

interface Props {
  initialMatches: Match[]
  teams: Team[]
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

// FIFA 2026 venue → city, state/country
const VENUE_LOCATION: Record<string, string> = {
  'MetLife Stadium':        'East Rutherford, NJ',
  'AT&T Stadium':           'Arlington, TX',
  'SoFi Stadium':           'Inglewood, CA',
  "Levi's Stadium":         'Santa Clara, CA',
  'Hard Rock Stadium':      'Miami Gardens, FL',
  'Gillette Stadium':       'Foxborough, MA',
  'Lincoln Financial Field':'Philadelphia, PA',
  'Arrowhead Stadium':      'Kansas City, MO',
  'State Farm Stadium':     'Glendale, AZ',
  'NRG Stadium':            'Houston, TX',
  'Lumen Field':            'Seattle, WA',
  'BC Place':               'Vancouver, BC',
  'BMO Field':              'Toronto, ON',
  'Estadio Azteca':         'Cidade do México, MX',
  'Estadio BBVA':           'Monterrey, MX',
  'Estadio Akron':          'Guadalajara, MX',
  'Mercedes-Benz Stadium':  'Atlanta, GA',
}

export function MatchList({ initialMatches, teams, phase }: Props) {
  const [matches, setMatches] = useState(initialMatches)
  const teamMap = new Map(teams.map(t => [t.id, t]))

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
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400 capitalize" suppressHydrationWarning>
            {date}
          </h3>
          <div className="space-y-2.5">
            {dayMatches.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                teamMap={teamMap}
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
  teamMap,
  isGroupStage,
}: {
  match: Match
  teamMap: Map<string, Team>
  isGroupStage: boolean
}) {
  const homeTeam = teamMap.get(match.home_team_id ?? '')
  const awayTeam = teamMap.get(match.away_team_id ?? '')
  const home = homeTeam?.name ?? '—'
  const away = awayTeam?.name ?? '—'
  const homeFlag = teamFlag(homeTeam?.country_code)
  const awayFlag = teamFlag(awayTeam?.country_code)

  const scheduledAt = new Date(match.scheduled_at)
  const time = scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const contextLabel = isGroupStage && match.group
    ? `Grupo ${match.group}`
    : (PHASE_LABEL[match.phase] ?? match.phase)

  const venueCity = match.stadium ? VENUE_LOCATION[match.stadium] : null

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">

      {/* Card header */}
      <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-2">
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
          {contextLabel}
        </span>
      </div>

      {/* Teams + center info */}
      <div className="flex items-center gap-3 px-4 py-4">
        {/* Home */}
        <div className="min-w-0 flex-1 text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="min-w-0 truncate text-sm font-bold text-zinc-900 sm:text-base">
              {home}
            </span>
            {homeFlag ? (
              <span className={`fi fi-${homeFlag} shrink-0 rounded-sm`} style={{ fontSize: '1.125rem' }} aria-hidden="true" />
            ) : null}
          </div>
        </div>

        {/* Center: score or time */}
        <div className="w-24 shrink-0 text-center sm:w-28">
          {match.is_finished ? (
            <span className="text-xl font-black tabular-nums text-zinc-900 sm:text-2xl">
              {match.home_score}
              <span className="mx-1 text-zinc-400">–</span>
              {match.away_score}
            </span>
          ) : (
            <span className="text-base font-bold tabular-nums text-zinc-700" suppressHydrationWarning>
              {time}
            </span>
          )}
        </div>

        {/* Away */}
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            {awayFlag ? (
              <span className={`fi fi-${awayFlag} shrink-0 rounded-sm`} style={{ fontSize: '1.125rem' }} aria-hidden="true" />
            ) : null}
            <span className="min-w-0 truncate text-sm font-bold text-zinc-900 sm:text-base">
              {away}
            </span>
          </div>
        </div>
      </div>

      {/* Venue footer */}
      {match.stadium && (
        <div className="border-t border-zinc-100 px-4 py-1.5 text-center text-[11px] text-zinc-400">
          {match.stadium}
          {venueCity && <> · <span className="text-zinc-500">{venueCity}</span></>}
        </div>
      )}
    </div>
  )
}
