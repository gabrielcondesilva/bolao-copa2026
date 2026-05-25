'use client'

import { useReducer, useMemo } from 'react'
import { savePalpiteJogo } from '@/app/actions/palpites'
import { teamFlag } from '@/lib/flags'
import type { Database } from '@/lib/supabase/types'

type Match = Database['public']['Tables']['matches']['Row']
type Palpite = Database['public']['Tables']['palpites_jogos']['Row']

interface Props {
  matches: Match[]
  palpites: Palpite[]
  teams: { id: string; name: string; country_code: string }[]
  deadlineAt: string | null
  exceptionUntil: string | null
}

const PHASE_LABEL: Record<string, string> = {
  round_of_32:   '16-avos de Final',
  round_of_16:   'Oitavas de Final',
  quarterfinals: 'Quartas de Final',
  semifinals:    'Semifinais',
  third_place:   'Disputa de 3º Lugar',
  final:         'Final',
}

type MatchState = {
  home: string
  away: string
  savedHome: number | null
  savedAway: number | null
  saving: boolean
  error: string | null
}

type State = Record<string, MatchState>

type Action =
  | { type: 'change'; matchId: string; field: 'home' | 'away'; value: string }
  | { type: 'save_start'; matchId: string }
  | { type: 'save_ok'; matchId: string; homeScore: number; awayScore: number }
  | { type: 'save_err'; matchId: string; error: string }

function reducer(state: State, action: Action): State {
  const s = state[action.matchId]
  switch (action.type) {
    case 'change':
      return { ...state, [action.matchId]: { ...s, [action.field]: action.value, error: null } }
    case 'save_start':
      return { ...state, [action.matchId]: { ...s, saving: true, error: null } }
    case 'save_ok':
      return { ...state, [action.matchId]: { ...s, saving: false, savedHome: action.homeScore, savedAway: action.awayScore } }
    case 'save_err':
      return { ...state, [action.matchId]: { ...s, saving: false, error: action.error } }
  }
}

export function KnockoutPalpites({ matches, palpites, teams, deadlineAt, exceptionUntil }: Props) {
  const teamName = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams])
  const flagMap  = useMemo(() => new Map(teams.map(t => [t.id, t.country_code])), [teams])
  const palpiteMap = useMemo(() => new Map(palpites.map(p => [p.match_id, p])), [palpites])

  const playableMatches = useMemo(
    () => matches.filter(m => m.home_team_id && m.away_team_id),
    [matches],
  )

  const initialState: State = useMemo(() =>
    Object.fromEntries(
      matches.map(m => {
        const p = palpiteMap.get(m.id)
        return [m.id, {
          home: p?.home_score?.toString() ?? '',
          away: p?.away_score?.toString() ?? '',
          savedHome: p?.home_score ?? null,
          savedAway: p?.away_score ?? null,
          saving: false,
          error: null,
        }]
      }),
    ),
  [matches, palpiteMap])

  const [states, dispatch] = useReducer(reducer, initialState)

  const isLocked = useMemo(() => {
    const now = new Date()
    const afterDeadline = deadlineAt !== null && new Date(deadlineAt) <= now
    const exceptionActive = exceptionUntil !== null && new Date(exceptionUntil) > now
    return afterDeadline && !exceptionActive
  }, [deadlineAt, exceptionUntil])

  const filledCount = useMemo(
    () => playableMatches.filter(m => {
      const s = states[m.id]
      return s?.savedHome !== null && s?.savedAway !== null
    }).length,
    [states, playableMatches],
  )

  async function handleSave(matchId: string) {
    const s = states[matchId]
    const homeScore = parseInt(s.home, 10)
    const awayScore = parseInt(s.away, 10)
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) return

    dispatch({ type: 'save_start', matchId })
    const result = await savePalpiteJogo(matchId, homeScore, awayScore)
    if ('error' in result) {
      dispatch({ type: 'save_err', matchId, error: result.error })
    } else {
      dispatch({ type: 'save_ok', matchId, homeScore, awayScore })
    }
  }

  // Group by date (same pattern as group-palpites)
  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>()
    for (const m of [...playableMatches].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))) {
      const key = new Date(m.scheduled_at).toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long',
      })
      map.set(key, [...(map.get(key) ?? []), m])
    }
    return map
  }, [playableMatches])

  if (playableMatches.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-400">
        Os confrontos desta fase ainda não foram definidos.
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">
          {filledCount}
          <span className="text-zinc-400">/{playableMatches.length} preenchidos</span>
        </span>
        {isLocked && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
            Prazo encerrado
          </span>
        )}
        {!isLocked && exceptionUntil && deadlineAt && new Date(deadlineAt) <= new Date() && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Exceção ativa até{' '}
            {new Date(exceptionUntil).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            })}
          </span>
        )}
      </div>

      <div className="space-y-6">
        {[...grouped.entries()].map(([date, dayMatches]) => (
          <div key={date}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400 capitalize" suppressHydrationWarning>
              {date}
            </h3>
            <div className="space-y-2.5">
              {dayMatches.map(m => {
                const s = states[m.id]
                if (!s) return null
                return (
                  <KnockoutCard
                    key={m.id}
                    match={m}
                    state={s}
                    home={teamName.get(m.home_team_id ?? '') ?? '—'}
                    away={teamName.get(m.away_team_id ?? '') ?? '—'}
                    homeFlag={teamFlag(flagMap.get(m.home_team_id ?? ''))}
                    awayFlag={teamFlag(flagMap.get(m.away_team_id ?? ''))}
                    isLocked={isLocked}
                    onSave={handleSave}
                    onChange={(field, value) => dispatch({ type: 'change', matchId: m.id, field, value })}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function KnockoutCard({
  match,
  state,
  home,
  away,
  homeFlag,
  awayFlag,
  isLocked,
  onSave,
  onChange,
}: {
  match: Match
  state: MatchState
  home: string
  away: string
  homeFlag: string | undefined
  awayFlag: string | undefined
  isLocked: boolean
  onSave: (matchId: string) => void
  onChange: (field: 'home' | 'away', value: string) => void
}) {
  const isDirty = state.home !== (state.savedHome?.toString() ?? '') || state.away !== (state.savedAway?.toString() ?? '')
  const isFilled = state.home !== '' && state.away !== ''
  const isSaved  = state.savedHome !== null && state.savedAway !== null

  const time = new Date(match.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const phaseLabel = PHASE_LABEL[match.phase] ?? match.phase

  const inputClass = `w-10 rounded border px-1 py-1.5 text-center text-sm font-bold outline-none transition-colors disabled:bg-zinc-50 disabled:text-zinc-400 ${
    isLocked
      ? 'border-zinc-200 bg-zinc-50 text-zinc-400'
      : isDirty && isFilled
        ? 'border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-400'
        : isSaved && !isDirty
          ? 'border-green-400 focus:border-green-500 focus:ring-1 focus:ring-green-400'
          : 'border-zinc-300 focus:border-green-600 focus:ring-1 focus:ring-green-600'
  }`

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-4 py-2">
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{phaseLabel}</span>
        <span className="text-xs text-zinc-400" suppressHydrationWarning>{time}</span>
      </div>

      {/* Teams + inputs */}
      <div className="flex items-center gap-3 px-4 py-4">

        {/* Home */}
        <div className="min-w-0 flex-1 text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="min-w-0 truncate text-sm font-bold text-zinc-900 sm:text-base">{home}</span>
            {homeFlag ? (
              <span className={`fi fi-${homeFlag} shrink-0 rounded-sm`} style={{ fontSize: '1.125rem' }} aria-hidden="true" />
            ) : null}
          </div>
        </div>

        {/* Center: inputs + save/status */}
        <div className="w-28 shrink-0 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <input
              type="number" min={0} max={99}
              value={state.home}
              disabled={isLocked || state.saving}
              onChange={e => onChange('home', e.target.value)}
              className={inputClass}
              placeholder="—"
            />
            <span className="text-xs text-zinc-400">×</span>
            <input
              type="number" min={0} max={99}
              value={state.away}
              disabled={isLocked || state.saving}
              onChange={e => onChange('away', e.target.value)}
              className={inputClass}
              placeholder="—"
            />
          </div>
          {!isLocked && isFilled && isDirty && (
            <button
              onClick={() => onSave(match.id)}
              disabled={state.saving}
              className="rounded bg-green-700 px-3 py-0.5 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {state.saving ? '…' : 'Salvar'}
            </button>
          )}
          {!isDirty && isSaved && (
            <span className="text-xs font-medium text-green-600">✓ Salvo</span>
          )}
          {state.error && (
            <span className="text-xs text-red-600">{state.error}</span>
          )}
        </div>

        {/* Away */}
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            {awayFlag ? (
              <span className={`fi fi-${awayFlag} shrink-0 rounded-sm`} style={{ fontSize: '1.125rem' }} aria-hidden="true" />
            ) : null}
            <span className="min-w-0 truncate text-sm font-bold text-zinc-900 sm:text-base">{away}</span>
          </div>
        </div>

      </div>
    </div>
  )
}
