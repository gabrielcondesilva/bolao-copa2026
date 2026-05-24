'use client'

import { useEffect, useReducer, useMemo } from 'react'
import { savePalpiteJogo } from '@/app/actions/palpites'
import type { Database } from '@/lib/supabase/types'

type Match = Database['public']['Tables']['matches']['Row']
type Palpite = Database['public']['Tables']['palpites_jogos']['Row']

interface Props {
  matches: Match[]
  palpites: Palpite[]
  teams: { id: string; name: string }[]
  deadlineAt: string | null
  exceptionUntil: string | null
}

// ─── State ───────────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

export function GroupPalpites({ matches, palpites, teams, deadlineAt, exceptionUntil }: Props) {
  const teamName = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams])
  const palpiteMap = useMemo(() => new Map(palpites.map(p => [p.match_id, p])), [palpites])

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

  // Re-sync when server data changes (e.g. navigation)
  useEffect(() => {
    matches.forEach(m => {
      const p = palpiteMap.get(m.id)
      const cur = states[m.id]
      if (!cur) return
      // Only sync if not currently editing (clean state)
      const isDirty = cur.home !== (cur.savedHome?.toString() ?? '') || cur.away !== (cur.savedAway?.toString() ?? '')
      if (!isDirty && p) {
        dispatch({ type: 'save_ok', matchId: m.id, homeScore: p.home_score ?? 0, awayScore: p.away_score ?? 0 })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palpites])

  // Deadline lock — re-check every minute
  const isLocked = useMemo(() => {
    const now = new Date()
    const afterDeadline = deadlineAt !== null && new Date(deadlineAt) <= now
    const exceptionActive = exceptionUntil !== null && new Date(exceptionUntil) > now
    return afterDeadline && !exceptionActive
  }, [deadlineAt, exceptionUntil])

  const filledCount = useMemo(
    () => Object.values(states).filter(s => s.savedHome !== null && s.savedAway !== null).length,
    [states],
  )

  async function handleSave(matchId: string) {
    const s = states[matchId]
    const homeScore = parseInt(s.home, 10)
    const awayScore = parseInt(s.away, 10)
    if (isNaN(homeScore) || isNaN(awayScore)) return

    dispatch({ type: 'save_start', matchId })
    const result = await savePalpiteJogo(matchId, homeScore, awayScore)
    if ('error' in result) {
      dispatch({ type: 'save_err', matchId, error: result.error })
    } else {
      dispatch({ type: 'save_ok', matchId, homeScore, awayScore })
    }
  }

  // Group matches by local date
  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>()
    for (const m of [...matches].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))) {
      const key = new Date(m.scheduled_at).toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long',
      })
      map.set(key, [...(map.get(key) ?? []), m])
    }
    return map
  }, [matches])

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-400">
        Jogos da Fase de Grupos ainda não foram importados.
      </div>
    )
  }

  return (
    <div>
      {/* Header bar: counter + lock status */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">
          {filledCount}
          <span className="text-zinc-400">/{matches.length} preenchidos</span>
        </span>
        {isLocked && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
            Prazo encerrado
          </span>
        )}
        {!isLocked && exceptionUntil && deadlineAt && new Date(deadlineAt) <= new Date() && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Exceção ativa até {new Date(exceptionUntil).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {[...grouped.entries()].map(([date, dayMatches]) => (
          <div key={date} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 capitalize">
                {date}
              </span>
            </div>
            {dayMatches.map(m => (
              <PalpiteRow
                key={m.id}
                match={m}
                state={states[m.id]}
                home={teamName.get(m.home_team_id ?? '') ?? '—'}
                away={teamName.get(m.away_team_id ?? '') ?? '—'}
                isLocked={isLocked}
                onSave={handleSave}
                onChange={(field, value) => dispatch({ type: 'change', matchId: m.id, field, value })}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function PalpiteRow({
  match,
  state,
  home,
  away,
  isLocked,
  onSave,
  onChange,
}: {
  match: Match
  state: MatchState
  home: string
  away: string
  isLocked: boolean
  onSave: (matchId: string) => void
  onChange: (field: 'home' | 'away', value: string) => void
}) {
  const isDirty =
    state.home !== (state.savedHome?.toString() ?? '') ||
    state.away !== (state.savedAway?.toString() ?? '')
  const isFilled = state.home !== '' && state.away !== ''
  const isSaved = state.savedHome !== null && state.savedAway !== null

  const time = new Date(match.scheduled_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  })

  const inputClass = (filled: boolean, dirty: boolean, saved: boolean) =>
    `w-12 rounded border px-1.5 py-1 text-center text-sm outline-none transition-colors disabled:bg-zinc-50 disabled:text-zinc-400 ${
      isLocked
        ? 'border-zinc-200 bg-zinc-50 text-zinc-400'
        : dirty && filled
          ? 'border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-400'
          : saved && !dirty
            ? 'border-green-400 focus:border-green-500 focus:ring-1 focus:ring-green-400'
            : 'border-zinc-300 focus:border-green-600 focus:ring-1 focus:ring-green-600'
    }`

  return (
    <div className="border-b border-zinc-100 last:border-0">
      <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
        {/* Time + group */}
        <div className="w-10 shrink-0 text-center">
          <div className="text-xs font-medium text-zinc-500">{time}</div>
          {match.group && <div className="text-xs text-zinc-400">{match.group}</div>}
        </div>

        {/* Home team */}
        <span className="min-w-0 flex-1 truncate text-right text-sm font-semibold text-zinc-900">
          {home}
        </span>

        {/* Inputs */}
        <div className="flex shrink-0 items-center gap-1">
          <input
            type="number"
            min={0}
            max={99}
            value={state.home}
            disabled={isLocked || state.saving}
            onChange={e => onChange('home', e.target.value)}
            className={inputClass(isFilled, isDirty, isSaved)}
            placeholder="—"
          />
          <span className="text-xs text-zinc-400">×</span>
          <input
            type="number"
            min={0}
            max={99}
            value={state.away}
            disabled={isLocked || state.saving}
            onChange={e => onChange('away', e.target.value)}
            className={inputClass(isFilled, isDirty, isSaved)}
            placeholder="—"
          />
        </div>

        {/* Away team */}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900">
          {away}
        </span>

        {/* Action */}
        <div className="w-14 shrink-0 text-right">
          {!isLocked && isFilled && isDirty && (
            <button
              onClick={() => onSave(match.id)}
              disabled={state.saving}
              className="rounded bg-green-700 px-2 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {state.saving ? '…' : 'Salvar'}
            </button>
          )}
          {!isDirty && isSaved && (
            <span className="text-xs text-green-600">✓</span>
          )}
          {state.error && (
            <span className="text-xs text-red-600" title={state.error}>!</span>
          )}
        </div>
      </div>

      {state.error && (
        <div className="px-4 pb-2 text-xs text-red-600">{state.error}</div>
      )}
    </div>
  )
}
