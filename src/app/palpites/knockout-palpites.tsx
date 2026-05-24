'use client'

import { useReducer, useMemo } from 'react'
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

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {playableMatches.map((m, i) => {
          const s = states[m.id]
          if (!s) return null
          const home = teamName.get(m.home_team_id ?? '') ?? '—'
          const away = teamName.get(m.away_team_id ?? '') ?? '—'
          const isDirty =
            s.home !== (s.savedHome?.toString() ?? '') ||
            s.away !== (s.savedAway?.toString() ?? '')
          const isFilled = s.home !== '' && s.away !== ''
          const isSaved = s.savedHome !== null && s.savedAway !== null

          const time = new Date(m.scheduled_at).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
          })

          const inputClass = `w-12 rounded border px-1.5 py-1 text-center text-sm outline-none transition-colors disabled:bg-zinc-50 disabled:text-zinc-400 ${
            isLocked
              ? 'border-zinc-200 bg-zinc-50 text-zinc-400'
              : isDirty && isFilled
                ? 'border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-400'
                : isSaved && !isDirty
                  ? 'border-green-400 focus:border-green-500 focus:ring-1 focus:ring-green-400'
                  : 'border-zinc-300 focus:border-green-600 focus:ring-1 focus:ring-green-600'
          }`

          return (
            <div key={m.id} className={`${i < playableMatches.length - 1 ? 'border-b border-zinc-100' : ''}`}>
              <div className="flex items-center gap-2 px-3 py-3 sm:px-4">
                <div className="w-20 shrink-0 text-center">
                  <div className="text-xs text-zinc-400">{time}</div>
                </div>

                <span className="min-w-0 flex-1 truncate text-right text-sm font-semibold text-zinc-900">
                  {home}
                </span>

                <div className="flex shrink-0 items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={s.home}
                    disabled={isLocked || s.saving}
                    onChange={e => dispatch({ type: 'change', matchId: m.id, field: 'home', value: e.target.value })}
                    className={inputClass}
                    placeholder="—"
                  />
                  <span className="text-xs text-zinc-400">×</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={s.away}
                    disabled={isLocked || s.saving}
                    onChange={e => dispatch({ type: 'change', matchId: m.id, field: 'away', value: e.target.value })}
                    className={inputClass}
                    placeholder="—"
                  />
                </div>

                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900">
                  {away}
                </span>

                <div className="w-14 shrink-0 text-right">
                  {!isLocked && isFilled && isDirty && (
                    <button
                      onClick={() => handleSave(m.id)}
                      disabled={s.saving}
                      className="rounded bg-green-700 px-2 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                    >
                      {s.saving ? '…' : 'Salvar'}
                    </button>
                  )}
                  {!isDirty && isSaved && (
                    <span className="text-xs text-green-600">✓</span>
                  )}
                  {s.error && (
                    <span className="text-xs text-red-600" title={s.error}>!</span>
                  )}
                </div>
              </div>
              {s.error && (
                <div className="px-4 pb-2 text-xs text-red-600">{s.error}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
