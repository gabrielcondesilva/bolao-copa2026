'use client'

import { useState, useEffect, useTransition } from 'react'
import type { Json } from '@/lib/supabase/types'
import type { SimulatedBracket } from '@/lib/engines/bracket-simulator'
import { teamFlag } from '@/lib/flags'
import { savePalpiteFinalDirect } from '@/app/actions/palpites'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BracketPicks {
  round_of_32: (string | null)[]
  round_of_16: (string | null)[]
  quarterfinals: (string | null)[]
  semifinals: (string | null)[]
  final: string | null
  third_place: string | null
}

type ArrayPhase = 'round_of_32' | 'round_of_16' | 'quarterfinals' | 'semifinals'

interface ExistingFinal {
  champion_team_id: string | null
  runner_up_team_id: string | null
  third_team_id: string | null
  fourth_team_id: string | null
  top_scorer: string | null
  best_player: string | null
}

interface Props {
  bracket: SimulatedBracket
  teamName: Record<string, string>
  teamCode: Record<string, string>
  userId: string
  existingFinal: ExistingFinal | null
  initialPicks: Json | null
  deadlineAt: string | null
  groupStageFinished: boolean
}

const STORAGE_KEY = (uid: string) => `bracket_picks_v2_${uid}`

// ── Bracket pairing tables ────────────────────────────────────────────────────
// These mirror ROUND_OF_16_DEFS and QUARTER_FINAL_DEFS in bracket-simulator.ts.
// R32 matches are indexed 0–15 in match-number order (M73=0 … M88=15).

/** Which two R32 picks meet in each R16 match (indexed 0–7 = M89–M96). */
const R16_R32_PAIRS: [number, number][] = [
  [0,  2],  // M89: W73 vs W75
  [1,  4],  // M90: W74 vs W77
  [3,  5],  // M91: W76 vs W78
  [6,  7],  // M92: W79 vs W80
  [10, 11], // M93: W83 vs W84
  [8,  9],  // M94: W81 vs W82
  [13, 15], // M95: W86 vs W88
  [12, 14], // M96: W85 vs W87
]

/** Which two R16 picks meet in each QF (indexed 0–3 = M97–M100). */
const QF_R16_PAIRS: [number, number][] = [
  [0, 1], // M97: W89 vs W90
  [4, 5], // M98: W93 vs W94
  [2, 3], // M99: W91 vs W92
  [6, 7], // M100: W95 vs W96
]

/** For each R32 pick index (0–15), which R16 index it feeds. */
const R32_TO_R16_IDX = [0, 1, 0, 2, 1, 2, 3, 3, 5, 5, 4, 4, 7, 6, 7, 6]

/** For each R16 pick index (0–7), which QF index it feeds. */
const R16_TO_QF_IDX = [0, 0, 2, 2, 1, 1, 3, 3]

function emptyPicks(): BracketPicks {
  return {
    round_of_32: Array(16).fill(null),
    round_of_16: Array(8).fill(null),
    quarterfinals: Array(4).fill(null),
    semifinals: Array(2).fill(null),
    final: null,
    third_place: null,
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function BracketView({
  bracket, teamName, teamCode, userId, existingFinal, initialPicks, deadlineAt, groupStageFinished,
}: Props) {
  const [picks, setPicks] = useState<BracketPicks>(emptyPicks)
  const [mounted, setMounted] = useState(false)
  const [topScorer, setTopScorer] = useState(existingFinal?.top_scorer ?? '')
  const [bestPlayer, setBestPlayer] = useState(existingFinal?.best_player ?? '')
  const [isSaved, setIsSaved] = useState(initialPicks !== null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isLocked = !!deadlineAt && new Date(deadlineAt) <= new Date()

  useEffect(() => {
    if (initialPicks && typeof initialPicks === 'object' && !Array.isArray(initialPicks)) {
      setPicks(initialPicks as unknown as BracketPicks)
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEY(userId))
        if (raw) setPicks(JSON.parse(raw))
      } catch {}
    }
    setMounted(true)
  }, [userId, initialPicks])

  useEffect(() => {
    if (!mounted) return
    try { localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(picks)) } catch {}
  }, [picks, mounted, userId])

  // ── Matchup derivation ────────────────────────────────────────────────────

  const r32 = bracket.round_of_32.map(m => ({ home: m.homeTeamId, away: m.awayTeamId }))

  const r16 = R16_R32_PAIRS.map(([hi, ai]) => ({
    home: picks.round_of_32[hi] ?? null,
    away: picks.round_of_32[ai] ?? null,
  }))

  const qf = QF_R16_PAIRS.map(([hi, ai]) => ({
    home: picks.round_of_16[hi] ?? null,
    away: picks.round_of_16[ai] ?? null,
  }))

  const sf = Array.from({ length: 2 }, (_, i) => ({
    home: picks.quarterfinals[i * 2] ?? null,
    away: picks.quarterfinals[i * 2 + 1] ?? null,
  }))

  const finalM = { home: picks.semifinals[0] ?? null, away: picks.semifinals[1] ?? null }

  const sfLosers = sf.map((m, i) => {
    const w = picks.semifinals[i]
    if (!w || !m.home || !m.away) return null
    return w === m.home ? m.away : m.home
  })
  const thirdM = { home: sfLosers[0] ?? null, away: sfLosers[1] ?? null }

  // Derived final result
  const champion = picks.final
  const runnerUp = picks.final
    ? (picks.final === finalM.home ? finalM.away : finalM.home)
    : null
  const third = picks.third_place
  const fourth = picks.third_place
    ? (picks.third_place === thirdM.home ? thirdM.away : thirdM.home)
    : null

  // ── Pick action ───────────────────────────────────────────────────────────

  const makePick = (
    phase: ArrayPhase | 'final' | 'third_place',
    index: number,
    teamId: string,
  ) => {
    if (isLocked) return
    setPicks(prev => {
      const next = { ...prev }

      // Clicking the already-selected team deselects it
      if (phase === 'final') { next.final = prev.final === teamId ? null : teamId; return next }
      if (phase === 'third_place') { next.third_place = prev.third_place === teamId ? null : teamId; return next }

      const p = phase as ArrayPhase
      const arr = [...prev[p]]
      // Clicking the already-selected team deselects it
      arr[index] = arr[index] === teamId ? null : teamId
      next[p] = arr

      // Clear downstream picks that depend on this index
      if (p === 'round_of_32') {
        const r16i = R32_TO_R16_IDX[index]
        const nr16 = [...prev.round_of_16]; nr16[r16i] = null; next.round_of_16 = nr16
        const qfi = R16_TO_QF_IDX[r16i]
        const nqf = [...prev.quarterfinals]; nqf[qfi] = null; next.quarterfinals = nqf
        const sfi = Math.floor(qfi / 2)
        const nsf = [...prev.semifinals]; nsf[sfi] = null; next.semifinals = nsf
        next.final = null; next.third_place = null
      } else if (p === 'round_of_16') {
        const qfi = R16_TO_QF_IDX[index]
        const nqf = [...prev.quarterfinals]; nqf[qfi] = null; next.quarterfinals = nqf
        const sfi = Math.floor(qfi / 2)
        const nsf = [...prev.semifinals]; nsf[sfi] = null; next.semifinals = nsf
        next.final = null; next.third_place = null
      } else if (p === 'quarterfinals') {
        const sfi = Math.floor(index / 2)
        const nsf = [...prev.semifinals]; nsf[sfi] = null; next.semifinals = nsf
        next.final = null; next.third_place = null
      } else if (p === 'semifinals') {
        next.final = null; next.third_place = null
      }

      return next
    })
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = () => {
    startTransition(async () => {
      setSaveError(null)
      const res = await savePalpiteFinalDirect({
        champion_team_id: champion,
        runner_up_team_id: runnerUp,
        third_team_id: third,
        fourth_team_id: fourth,
        top_scorer: topScorer.trim() || null,
        best_player: bestPlayer.trim() || null,
        bracket_picks: picks as unknown as Json,
      })
      if ('error' in res) {
        setSaveError(res.error)
      } else {
        setIsSaved(true)
        setSaveError(null)
      }
    })
  }

  const bestThirdsSet = new Set(bracket.bestThirds.slice(0, 8).map(t => t.teamId))

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Group stage */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-bold text-zinc-800">Fase de Grupos — Classificados Simulados</h3>
          {groupStageFinished && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">finalizado</span>
          )}
        </div>

        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(bracket.groups).sort(([a], [b]) => a.localeCompare(b)).map(([group, result]) => (
                <div key={group} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                  <div className="border-b border-zinc-100 bg-zinc-50 px-3 py-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-600">Grupo {group}</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 text-zinc-400">
                        <th className="py-2 pl-3 pr-1 text-left font-medium">Time</th>
                        <th className="w-6 px-1 text-center font-medium">J</th>
                        <th className="w-6 px-1 text-center font-medium">V</th>
                        <th className="w-6 px-1 text-center font-medium">E</th>
                        <th className="w-6 px-1 text-center font-medium">D</th>
                        <th className="w-7 px-1 text-center font-medium">SG</th>
                        <th className="w-8 py-2 pr-3 pl-1 text-center font-bold text-zinc-500">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.standings.map((s, i) => {
                        const isBestThird = i === 2 && bestThirdsSet.has(s.team.id)
                        const rowBg = i < 2 ? 'bg-green-50' : isBestThird ? 'bg-amber-50' : ''
                        const fl = teamCode[s.team.id] ? teamFlag(teamCode[s.team.id]) : null
                        return (
                          <tr key={s.team.id} className={`border-b border-zinc-100 last:border-0 ${rowBg}`}>
                            <td className="py-1.5 pl-3 pr-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-zinc-400">{s.position}</span>
                                {fl && <span className={`fi fi-${fl} shrink-0 rounded-sm`} style={{ fontSize: '0.8rem' }} aria-hidden />}
                                <span className="max-w-[90px] truncate font-medium text-zinc-900 sm:max-w-none">{s.team.name}</span>
                              </div>
                            </td>
                            <td className="px-1 text-center text-zinc-600">{s.played}</td>
                            <td className="px-1 text-center text-zinc-600">{s.won}</td>
                            <td className="px-1 text-center text-zinc-600">{s.drawn}</td>
                            <td className="px-1 text-center text-zinc-600">{s.lost}</td>
                            <td className={`px-1 text-center font-medium ${s.goal_diff > 0 ? 'text-green-700' : s.goal_diff < 0 ? 'text-red-600' : 'text-zinc-500'}`}>
                              {s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}
                            </td>
                            <td className="py-1.5 pr-3 pl-1 text-center font-bold text-zinc-900">{s.points}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500">Melhores 3ºs colocados (8 de 12)</p>
              <div className="flex flex-wrap gap-2">
                {bracket.bestThirds.slice(0, 8).map((t, i) => {
                  const fl = teamCode[t.teamId] ? teamFlag(teamCode[t.teamId]) : null
                  return (
                    <span key={t.teamId} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      {fl && <span className={`fi fi-${fl} shrink-0 rounded-sm`} style={{ fontSize: '0.75rem' }} aria-hidden />}
                      {i + 1}. {teamName[t.teamId] ?? '?'}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
      </section>

      {/* ── Interactive knockout bracket ── */}

      {isLocked && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
          Prazo encerrado — palpites bloqueados
        </div>
      )}

      <PhaseSection label="16-avos de Final" matchCount={r32.length}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {r32.map((m, i) => (
            <PickMatch
              key={i}
              home={m.home}
              away={m.away}
              winner={picks.round_of_32[i]}
              onPick={tid => makePick('round_of_32', i, tid)}
              teamName={teamName}
              teamCode={teamCode}
              isLocked={isLocked}
            />
          ))}
        </div>
      </PhaseSection>

      <PhaseSection label="Oitavas de Final" matchCount={r16.length}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {r16.map((m, i) => (
            <PickMatch
              key={i}
              home={m.home}
              away={m.away}
              winner={picks.round_of_16[i]}
              onPick={tid => makePick('round_of_16', i, tid)}
              teamName={teamName}
              teamCode={teamCode}
              isLocked={isLocked}
            />
          ))}
        </div>
      </PhaseSection>

      <PhaseSection label="Quartas de Final" matchCount={qf.length}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {qf.map((m, i) => (
            <PickMatch
              key={i}
              home={m.home}
              away={m.away}
              winner={picks.quarterfinals[i]}
              onPick={tid => makePick('quarterfinals', i, tid)}
              teamName={teamName}
              teamCode={teamCode}
              isLocked={isLocked}
            />
          ))}
        </div>
      </PhaseSection>

      <PhaseSection label="Semifinais" matchCount={sf.length}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {sf.map((m, i) => (
            <PickMatch
              key={i}
              home={m.home}
              away={m.away}
              winner={picks.semifinals[i]}
              onPick={tid => makePick('semifinals', i, tid)}
              teamName={teamName}
              teamCode={teamCode}
              isLocked={isLocked}
            />
          ))}
        </div>
      </PhaseSection>

      <PhaseSection label="Decisões">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold text-zinc-500">Disputa de 3º Lugar</p>
            <PickMatch
              home={thirdM.home}
              away={thirdM.away}
              winner={picks.third_place}
              onPick={tid => makePick('third_place', 0, tid)}
              teamName={teamName}
              teamCode={teamCode}
              isLocked={isLocked}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-zinc-500">Final</p>
            <PickMatch
              home={finalM.home}
              away={finalM.away}
              winner={picks.final}
              onPick={tid => makePick('final', 0, tid)}
              teamName={teamName}
              teamCode={teamCode}
              isLocked={isLocked}
              highlight
            />
          </div>
        </div>
      </PhaseSection>

      {/* ── Palpite Final — resultado derivado + premiações ── */}

      <section className="overflow-hidden rounded-xl border-2 border-green-200 bg-white">
        <div className="flex items-center justify-between border-b border-green-100 bg-green-50 px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Seu Palpite Final</h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Derivado automaticamente do bracket
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLocked ? (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                Prazo encerrado
              </span>
            ) : isSaved ? (
              <>
                <span className="text-xs font-medium text-green-600">✓ Palpite salvo</span>
                <button
                  onClick={() => setIsSaved(false)}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                >
                  Editar
                </button>
              </>
            ) : (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Aberto
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4 p-4">
          {/* Positions grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ResultSlot rank="Campeão" teamId={champion} teamName={teamName} teamCode={teamCode} highlight />
            <ResultSlot rank="Vice-campeão" teamId={runnerUp} teamName={teamName} teamCode={teamCode} />
            <ResultSlot rank="3º Colocado" teamId={third} teamName={teamName} teamCode={teamCode} />
            <ResultSlot rank="4º Colocado" teamId={fourth} teamName={teamName} teamCode={teamCode} />
          </div>

          {/* Awards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextAward label="Artilheiro" value={topScorer} onChange={setTopScorer} disabled={isLocked} />
            <TextAward label="Craque do Torneio" value={bestPlayer} onChange={setBestPlayer} disabled={isLocked} />
          </div>

          {/* Save */}
          {!isLocked && !isSaved && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={isPending || !champion}
                className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? 'Salvando…' : 'Salvar palpite final'}
              </button>
              {!champion && (
                <span className="text-xs text-zinc-400">Complete o bracket para salvar</span>
              )}
              {saveError && (
                <span className="text-sm font-medium text-red-600">{saveError}</span>
              )}
            </div>
          )}
        </div>
      </section>

    </div>
  )
}

// ── PhaseSection ──────────────────────────────────────────────────────────────

function PhaseSection({ label, matchCount, children }: {
  label: string
  matchCount?: number
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-bold text-zinc-800">{label}</h3>
        {matchCount !== undefined && (
          <span className="text-xs text-zinc-400">{matchCount} jogos</span>
        )}
      </div>
      {children}
    </section>
  )
}

// ── PickMatch ─────────────────────────────────────────────────────────────────

function PickMatch({
  home, away, winner, onPick, teamName, teamCode, isLocked, highlight = false,
}: {
  home: string | null
  away: string | null
  winner: string | null
  onPick: (teamId: string) => void
  teamName: Record<string, string>
  teamCode: Record<string, string>
  isLocked: boolean
  highlight?: boolean
}) {
  const canPick = !isLocked && !!home && !!away

  return (
    <div className={`overflow-hidden rounded-lg border bg-white ${highlight ? 'border-amber-300 shadow-sm' : 'border-zinc-200'}`}>
      <TeamButton
        teamId={home}
        teamName={teamName}
        teamCode={teamCode}
        isWinner={!!winner && winner === home}
        isLoser={!!winner && winner !== home}
        canPick={canPick}
        onPick={onPick}
      />
      <div className="flex items-center border-t border-zinc-100">
        <div className="flex-1" />
        <span className="px-3 py-0.5 text-xs font-bold text-zinc-300">vs</span>
        <div className="flex-1" />
      </div>
      <TeamButton
        teamId={away}
        teamName={teamName}
        teamCode={teamCode}
        isWinner={!!winner && winner === away}
        isLoser={!!winner && winner !== away}
        canPick={canPick}
        onPick={onPick}
      />
    </div>
  )
}

function TeamButton({
  teamId, teamName, teamCode, isWinner, isLoser, canPick, onPick,
}: {
  teamId: string | null
  teamName: Record<string, string>
  teamCode: Record<string, string>
  isWinner: boolean
  isLoser: boolean
  canPick: boolean
  onPick: (teamId: string) => void
}) {
  const name = teamId ? (teamName[teamId] ?? '?') : null
  const flagCode = teamId && teamCode[teamId] ? teamFlag(teamCode[teamId]) : null

  if (!teamId) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="text-xs italic text-zinc-300">a definir</span>
      </div>
    )
  }

  const base = 'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold transition-colors'
  const className = isWinner
    ? `${base} bg-green-50 text-green-800`
    : isLoser
    ? `${base} text-zinc-300`
    : canPick
    ? `${base} text-zinc-800 hover:bg-zinc-50 active:bg-green-50 cursor-pointer`
    : `${base} text-zinc-500`

  return (
    <button
      type="button"
      disabled={!canPick}
      onClick={() => onPick(teamId)}
      className={className}
    >
      {isWinner && <span className="shrink-0 text-green-500 text-xs">✓</span>}
      {flagCode && (
        <span className={`fi fi-${flagCode} shrink-0 rounded-sm`} style={{ fontSize: '0.875rem' }} aria-hidden />
      )}
      <span className={isLoser ? 'line-through' : ''}>{name}</span>
    </button>
  )
}

// ── ResultSlot ────────────────────────────────────────────────────────────────

function ResultSlot({ rank, teamId, teamName, teamCode, highlight = false }: {
  rank: string
  teamId: string | null
  teamName: Record<string, string>
  teamCode: Record<string, string>
  highlight?: boolean
}) {
  const name = teamId ? (teamName[teamId] ?? '?') : null
  const flagCode = teamId && teamCode[teamId] ? teamFlag(teamCode[teamId]) : null

  return (
    <div className={`rounded-lg p-3 ${highlight ? 'border border-amber-200 bg-amber-50' : 'border border-zinc-100 bg-zinc-50'}`}>
      <p className="mb-1 text-xs font-medium text-zinc-500">{rank}</p>
      {name ? (
        <div className="flex items-center gap-1.5">
          {flagCode && (
            <span className={`fi fi-${flagCode} shrink-0 rounded-sm`} style={{ fontSize: '1rem' }} aria-hidden />
          )}
          <span className={`text-sm font-bold ${highlight ? 'text-amber-900' : 'text-zinc-900'}`}>
            {name}
          </span>
        </div>
      ) : (
        <span className="text-xs italic text-zinc-300">a definir</span>
      )}
    </div>
  )
}

// ── TextAward ─────────────────────────────────────────────────────────────────

function TextAward({ label, value, onChange, disabled }: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-600">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Nome do jogador…"
        className="rounded border border-zinc-300 px-2 py-1.5 text-sm outline-none placeholder:text-zinc-400 focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:bg-zinc-50 disabled:text-zinc-400"
      />
    </div>
  )
}
