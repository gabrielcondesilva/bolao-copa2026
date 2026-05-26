'use client'

import { useEffect, useReducer, useMemo, useState } from 'react'
import { savePalpitesJogoBatch } from '@/app/actions/palpites'
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

// ─── State ───────────────────────────────────────────────────────────────────

type MatchState = {
  home: string
  away: string
  savedHome: number | null
  savedAway: number | null
}

type State = Record<string, MatchState>

type Action =
  | { type: 'change'; matchId: string; field: 'home' | 'away'; value: string }
  | { type: 'save_ok'; matchId: string; homeScore: number; awayScore: number }
  | { type: 'reset_to_saved' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'change': {
      const s = state[action.matchId]
      return { ...state, [action.matchId]: { ...s, [action.field]: action.value } }
    }
    case 'save_ok': {
      const s = state[action.matchId]
      return { ...state, [action.matchId]: { ...s, savedHome: action.homeScore, savedAway: action.awayScore } }
    }
    case 'reset_to_saved':
      return Object.fromEntries(
        Object.entries(state).map(([id, s]) => [
          id, { ...s, home: s.savedHome?.toString() ?? '', away: s.savedAway?.toString() ?? '' },
        ]),
      )
  }
}

function isValid(s: MatchState): boolean {
  const h = parseInt(s.home, 10)
  const a = parseInt(s.away, 10)
  return !isNaN(h) && !isNaN(a) && h >= 0 && a >= 0
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GroupPalpites({ matches, palpites, teams, deadlineAt, exceptionUntil }: Props) {
  const teamName   = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams])
  const flagMap    = useMemo(() => new Map(teams.map(t => [t.id, t.country_code])), [teams])
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
        }]
      }),
    ),
  [matches, palpiteMap])

  const [states, dispatch] = useReducer(reducer, initialState)
  const [isEditing,   setIsEditing]   = useState(() => palpites.length === 0)
  const [isSaving,    setIsSaving]    = useState(false)
  const [saveError,   setSaveError]   = useState<string | null>(null)
  const [showErrors,  setShowErrors]  = useState(false)

  useEffect(() => {
    matches.forEach(m => {
      const p = palpiteMap.get(m.id)
      const cur = states[m.id]
      if (!cur || !p) return
      const isDirty = cur.home !== (cur.savedHome?.toString() ?? '') || cur.away !== (cur.savedAway?.toString() ?? '')
      if (!isDirty) {
        dispatch({ type: 'save_ok', matchId: m.id, homeScore: p.home_score ?? 0, awayScore: p.away_score ?? 0 })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palpites])

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

  const missingIds = useMemo(() => {
    if (!showErrors) return new Set<string>()
    return new Set(matches.filter(m => !isValid(states[m.id])).map(m => m.id))
  }, [showErrors, states, matches])

  async function handleSaveAll() {
    const missing = matches.filter(m => !isValid(states[m.id]))
    if (missing.length > 0) {
      setShowErrors(true)
      return
    }

    setShowErrors(false)
    setIsSaving(true)
    setSaveError(null)

    const items = matches.map(m => ({
      matchId: m.id,
      homeScore: parseInt(states[m.id].home, 10),
      awayScore: parseInt(states[m.id].away, 10),
    }))

    const result = await savePalpitesJogoBatch(items)

    if ('error' in result) {
      setSaveError(result.error)
    } else {
      for (const { matchId, homeScore, awayScore } of items) {
        dispatch({ type: 'save_ok', matchId, homeScore, awayScore })
      }
      setIsEditing(false)
    }

    setIsSaving(false)
  }

  function handleCancel() {
    dispatch({ type: 'reset_to_saved' })
    setSaveError(null)
    setShowErrors(false)
    setIsEditing(false)
  }

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

  const editable = isEditing && !isLocked

  return (
    <div>
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

      <div className="space-y-6">
        {[...grouped.entries()].map(([date, dayMatches]) => (
          <div key={date}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400 capitalize" suppressHydrationWarning>
              {date}
            </h3>
            <div className="space-y-2.5">
              {dayMatches.map(m => (
                <PalpiteCard
                  key={m.id}
                  match={m}
                  state={states[m.id]}
                  home={teamName.get(m.home_team_id ?? '') ?? '—'}
                  away={teamName.get(m.away_team_id ?? '') ?? '—'}
                  homeFlag={teamFlag(flagMap.get(m.home_team_id ?? ''))}
                  awayFlag={teamFlag(flagMap.get(m.away_team_id ?? ''))}
                  editable={editable}
                  hasError={missingIds.has(m.id)}
                  onChange={(field, value) => {
                    if (showErrors) setShowErrors(false)
                    dispatch({ type: 'change', matchId: m.id, field, value })
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom action bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {editable && (
          <>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {isSaving ? 'Salvando…' : 'Salvar tudo'}
            </button>
            {filledCount > 0 && (
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="text-sm text-zinc-500 hover:text-zinc-700 disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
            {showErrors && missingIds.size > 0 && (
              <span className="text-sm text-red-600">
                {missingIds.size} {missingIds.size === 1 ? 'jogo sem palpite' : 'jogos sem palpite'} — preencha todos antes de salvar
              </span>
            )}
            {saveError && <span className="text-sm text-red-600">{saveError}</span>}
          </>
        )}
        {!isEditing && !isLocked && (
          <button
            onClick={() => { setSaveError(null); setShowErrors(false); setIsEditing(true) }}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Editar
          </button>
        )}
        {!isEditing && filledCount > 0 && (
          <span className="text-sm font-medium text-green-600">
            {filledCount === matches.length ? '✓ Todos os palpites salvos' : `✓ ${filledCount} de ${matches.length} salvos`}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function PalpiteCard({
  match, state, home, away, homeFlag, awayFlag, editable, hasError, onChange,
}: {
  match: Match
  state: MatchState
  home: string
  away: string
  homeFlag: string | undefined
  awayFlag: string | undefined
  editable: boolean
  hasError: boolean
  onChange: (field: 'home' | 'away', value: string) => void
}) {
  const isDirty = state.home !== (state.savedHome?.toString() ?? '') || state.away !== (state.savedAway?.toString() ?? '')
  const isFilled = state.home !== '' && state.away !== ''
  const isSaved  = state.savedHome !== null && state.savedAway !== null

  const time = new Date(match.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const homeEmpty = editable && hasError && state.home === ''
  const awayEmpty = editable && hasError && state.away === ''

  const inputBase = 'w-10 rounded border px-1 py-1.5 text-center text-sm font-bold outline-none transition-colors'
  const inputNormal = isDirty && isFilled
    ? `${inputBase} border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-400`
    : isSaved && !isDirty
      ? `${inputBase} border-green-400 focus:border-green-500 focus:ring-1 focus:ring-green-400`
      : `${inputBase} border-zinc-300 focus:border-green-600 focus:ring-1 focus:ring-green-600`
  const inputError = `${inputBase} border-red-400 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-400`

  return (
    <div className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${editable && hasError ? 'border-red-300' : 'border-zinc-200'}`}>

      {/* Header */}
      <div className={`flex items-center justify-between border-b px-4 py-2 ${editable && hasError ? 'border-red-100 bg-red-50/60' : 'border-zinc-100 bg-zinc-50/80'}`}>
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
          {match.group ? `Grupo ${match.group}` : '—'}
        </span>
        <span className="text-xs text-zinc-400" suppressHydrationWarning>{time}</span>
      </div>

      {/* Teams + score */}
      <div className="flex items-center gap-3 px-4 py-4">

        {/* Home */}
        <div className="min-w-0 flex-1 text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="min-w-0 truncate text-sm font-bold text-zinc-900 sm:text-base">{home}</span>
            {homeFlag && <span className={`fi fi-${homeFlag} shrink-0 rounded-sm`} style={{ fontSize: '1.125rem' }} aria-hidden="true" />}
          </div>
        </div>

        {/* Center */}
        <div className="w-28 shrink-0 flex items-center justify-center">
          {editable ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number" min={0} max={99}
                value={state.home}
                onChange={e => onChange('home', e.target.value)}
                className={homeEmpty ? inputError : inputNormal}
                placeholder="—"
              />
              <span className="text-xs text-zinc-400">×</span>
              <input
                type="number" min={0} max={99}
                value={state.away}
                onChange={e => onChange('away', e.target.value)}
                className={awayEmpty ? inputError : inputNormal}
                placeholder="—"
              />
            </div>
          ) : (
            <span className={`text-lg font-bold tabular-nums ${isSaved ? 'text-zinc-900' : 'text-zinc-300'}`}>
              {isSaved ? `${state.savedHome} × ${state.savedAway}` : '? × ?'}
            </span>
          )}
        </div>

        {/* Away */}
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            {awayFlag && <span className={`fi fi-${awayFlag} shrink-0 rounded-sm`} style={{ fontSize: '1.125rem' }} aria-hidden="true" />}
            <span className="min-w-0 truncate text-sm font-bold text-zinc-900 sm:text-base">{away}</span>
          </div>
        </div>

      </div>
    </div>
  )
}
