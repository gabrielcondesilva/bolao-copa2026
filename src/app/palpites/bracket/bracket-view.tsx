'use client'

import { useState } from 'react'
import type { SimulatedBracket, SimulatedKnockoutMatch } from '@/lib/engines/bracket-simulator'
import { teamFlag } from '@/lib/flags'

interface RealMatch {
  homeName: string
  awayName: string
  homeScore: number | null
  awayScore: number | null
}

interface Props {
  bracket: SimulatedBracket
  teamName: Record<string, string>
  teamCode: Record<string, string>
  groupStageFinished: boolean
  finishedPhases: Set<string>
  knockoutByPhase: Record<string, RealMatch[]>
  classificationPointsByPhase: Record<string, { points: number; hits: number }>
}

const PHASE_LABELS: Record<string, string> = {
  round_of_32:   '16-avos de Final',
  round_of_16:   'Oitavas de Final',
  quarterfinals: 'Quartas de Final',
  semifinals:    'Semifinais',
  final:         'Decisões',
}

const REVEAL_LABELS: Record<string, string> = {
  round_of_32:   'Veja como ficaria seu 16-avos',
  round_of_16:   'Veja como ficariam suas Oitavas',
  quarterfinals: 'Veja como ficariam suas Quartas',
  semifinals:    'Veja como ficariam as Semifinais',
  final:         'Veja como ficariam as Decisões',
}

// Labels for the always-visible "real palpites" section
const REAL_LABELS: Record<string, string> = {
  round_of_32:   'Seus palpites — 16-avos',
  round_of_16:   'Seus palpites — Oitavas',
  quarterfinals: 'Seus palpites — Quartas',
  semifinals:    'Seus palpites — Semifinais',
  third_place:   'Seus palpites — 3º Lugar',
  final:         'Seus palpites — Final',
}

export function BracketView({ bracket, teamName, teamCode, groupStageFinished, finishedPhases, knockoutByPhase, classificationPointsByPhase }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const toggle = (phase: string) => setExpanded(p => ({ ...p, [phase]: !p[phase] }))

  const name = (id: string | null) => (id ? (teamName[id] ?? '?') : '—')
  const flag = (id: string | null) => id ? teamFlag(teamCode[id]) : ''

  const bestThirdsSet = new Set(bracket.bestThirds.slice(0, 8).map(t => t.teamId))

  return (
    <div className="space-y-4">

      {/* Group stage qualifiers — always visible */}
      <section>
        <SectionHeader title="Fase de Grupos — Classificados" locked={groupStageFinished} pts={classificationPointsByPhase['round_of_32']} />
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
                    <th className="w-7 px-1 text-center font-medium">GP</th>
                    <th className="w-7 px-1 text-center font-medium">GC</th>
                    <th className="w-7 px-1 text-center font-medium">SG</th>
                    <th className="w-8 py-2 pr-3 pl-1 text-center font-bold text-zinc-500">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {result.standings.map((s, i) => {
                    const isBestThird = i === 2 && bestThirdsSet.has(s.team.id)
                    const rowBg = i < 2 ? 'bg-green-50' : isBestThird ? 'bg-amber-50' : ''
                    const f = flag(s.team.id)
                    return (
                      <tr key={s.team.id} className={`border-b border-zinc-100 last:border-0 ${rowBg}`}>
                        <td className="py-2 pl-3 pr-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-400">{s.position}</span>
                            {f && <span className={`fi fi-${f} shrink-0 rounded-sm`} style={{ fontSize: '0.875rem' }} aria-hidden="true" />}
                            <span className="truncate font-medium text-zinc-900 max-w-[80px] sm:max-w-none">{s.team.name}</span>
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-zinc-500">Melhores 3ºs colocados (8 de 12)</p>
          <div className="flex flex-wrap gap-2">
            {bracket.bestThirds.slice(0, 8).map((t, i) => {
              const f = flag(t.teamId)
              return (
                <span key={t.teamId} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  {f && <span className={`fi fi-${f} shrink-0 rounded-sm`} style={{ fontSize: '0.75rem' }} aria-hidden="true" />}
                  {i + 1}. {name(t.teamId)}
                </span>
              )
            })}
          </div>
        </div>
      </section>

      {/* 16-avos */}
      <CollapsibleSection
        phase="round_of_32"
        isExpanded={!!expanded['round_of_32']}
        onToggle={() => toggle('round_of_32')}
        locked={finishedPhases.has('round_of_32')}
        pts={classificationPointsByPhase['round_of_16']}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {bracket.round_of_32.map(m => (
            <MatchCard key={m.matchNumber} match={m} teamName={teamName} />
          ))}
        </div>
      </CollapsibleSection>

      <RealPalpitesSection phase="round_of_32" matches={knockoutByPhase['round_of_32']} />

      {/* Oitavas */}
      <CollapsibleSection
        phase="round_of_16"
        isExpanded={!!expanded['round_of_16']}
        onToggle={() => toggle('round_of_16')}
        locked={finishedPhases.has('round_of_16')}
        pts={classificationPointsByPhase['quarterfinals']}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {bracket.round_of_16.map(m => (
            <MatchCard key={m.matchNumber} match={m} teamName={teamName} />
          ))}
        </div>
      </CollapsibleSection>

      <RealPalpitesSection phase="round_of_16" matches={knockoutByPhase['round_of_16']} />

      {/* Quartas */}
      <CollapsibleSection
        phase="quarterfinals"
        isExpanded={!!expanded['quarterfinals']}
        onToggle={() => toggle('quarterfinals')}
        locked={finishedPhases.has('quarterfinals')}
        pts={classificationPointsByPhase['semifinals']}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {bracket.quarter_finals.map(m => (
            <MatchCard key={m.matchNumber} match={m} teamName={teamName} />
          ))}
        </div>
      </CollapsibleSection>

      <RealPalpitesSection phase="quarterfinals" matches={knockoutByPhase['quarterfinals']} />

      {/* Semifinais */}
      <CollapsibleSection
        phase="semifinals"
        isExpanded={!!expanded['semifinals']}
        onToggle={() => toggle('semifinals')}
        locked={finishedPhases.has('semifinals')}
        pts={classificationPointsByPhase['final']}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {bracket.semi_finals.map(m => (
            <MatchCard key={m.matchNumber} match={m} teamName={teamName} />
          ))}
        </div>
      </CollapsibleSection>

      <RealPalpitesSection phase="semifinals" matches={knockoutByPhase['semifinals']} />

      {/* Decisões — third_place + final */}
      <CollapsibleSection
        phase="final"
        isExpanded={!!expanded['final']}
        onToggle={() => toggle('final')}
        locked={finishedPhases.has('final')}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-zinc-500">Disputa de 3º Lugar</p>
            <MatchCard match={bracket.third_place} teamName={teamName} />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-zinc-500">Final</p>
            <MatchCard match={bracket.final} teamName={teamName} highlight />
          </div>
        </div>
      </CollapsibleSection>

      {/* Real third place + final palpites */}
      {(knockoutByPhase['third_place']?.length || knockoutByPhase['final']?.length) ? (
        <section className="space-y-2">
          <RealPalpitesSection phase="third_place" matches={knockoutByPhase['third_place']} />
          <RealPalpitesSection phase="final" matches={knockoutByPhase['final']} />
        </section>
      ) : null}

    </div>
  )
}

// ─── Real palpites section (always visible) ───────────────────────────────────

function RealPalpitesSection({ phase, matches }: { phase: string; matches?: RealMatch[] }) {
  if (!matches || matches.length === 0) return null

  return (
    <section>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {REAL_LABELS[phase]}
      </p>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {matches.map((m, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 px-4 py-3 ${i > 0 ? 'border-t border-zinc-100' : ''}`}
          >
            <span className="min-w-0 flex-1 truncate text-right text-sm font-semibold text-zinc-900">
              {m.homeName}
            </span>
            <span className="w-16 shrink-0 text-center">
              {m.homeScore !== null && m.awayScore !== null ? (
                <span className="text-sm font-bold text-zinc-900">
                  {m.homeScore} × {m.awayScore}
                </span>
              ) : (
                <span className="text-xs text-zinc-300">? × ?</span>
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900">
              {m.awayName}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Collapsible simulation section ──────────────────────────────────────────

function CollapsibleSection({
  phase, isExpanded, onToggle, locked, pts, children,
}: {
  phase: string
  isExpanded: boolean
  onToggle: () => void
  locked: boolean
  pts?: { points: number; hits: number }
  children: React.ReactNode
}) {
  if (!isExpanded) {
    return (
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-4 text-sm font-medium text-zinc-500 transition-colors hover:border-green-500 hover:text-green-700"
      >
        {REVEAL_LABELS[phase]}
        <span aria-hidden="true">→</span>
      </button>
    )
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-zinc-800">{PHASE_LABELS[phase]}</h3>
          {locked && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
              finalizado
            </span>
          )}
          <PointsBadge pts={pts} />
        </div>
        <button
          onClick={onToggle}
          className="text-xs text-zinc-400 transition-colors hover:text-zinc-600"
        >
          recolher ▲
        </button>
      </div>
      {children}
    </section>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, locked, pts }: { title: string; locked: boolean; pts?: { points: number; hits: number } }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h3 className="text-sm font-bold text-zinc-800">{title}</h3>
      {locked && (
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
          finalizado
        </span>
      )}
      <PointsBadge pts={pts} />
    </div>
  )
}

function PointsBadge({ pts }: { pts?: { points: number; hits: number } }) {
  if (!pts) return null
  if (pts.points === 0) return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-400">
      0 pts
    </span>
  )
  return (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
      +{pts.points} pts
    </span>
  )
}

// ─── Match card (simulated) ───────────────────────────────────────────────────

function MatchCard({
  match,
  teamName,
  highlight = false,
}: {
  match: SimulatedKnockoutMatch
  teamName: Record<string, string>
  highlight?: boolean
}) {
  const name = (id: string | null) => (id ? (teamName[id] ?? '?') : '—')
  const homeWins = match.winnerId !== null && match.winnerId === match.homeTeamId
  const awayWins = match.winnerId !== null && match.winnerId === match.awayTeamId
  const hasScore = match.predictedHomeScore !== null && match.predictedAwayScore !== null
  const noTeams = !match.homeTeamId && !match.awayTeamId

  return (
    <div
      className={`rounded-lg border bg-white p-3 ${
        highlight ? 'border-amber-300 shadow-sm' : 'border-zinc-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`min-w-0 flex-1 truncate text-right text-sm font-semibold ${
            homeWins ? 'text-green-700' : awayWins ? 'text-zinc-400' : noTeams ? 'text-zinc-300' : 'text-zinc-900'
          }`}
        >
          {name(match.homeTeamId)}
        </span>

        <span className="w-14 shrink-0 text-center">
          {hasScore ? (
            <span className="text-sm font-bold text-zinc-900">
              {match.predictedHomeScore} × {match.predictedAwayScore}
            </span>
          ) : (
            <span className="text-xs text-zinc-300">? × ?</span>
          )}
        </span>

        <span
          className={`min-w-0 flex-1 truncate text-sm font-semibold ${
            awayWins ? 'text-green-700' : homeWins ? 'text-zinc-400' : noTeams ? 'text-zinc-300' : 'text-zinc-900'
          }`}
        >
          {name(match.awayTeamId)}
        </span>
      </div>

      {match.winnerId && (
        <div className="mt-1.5 text-center text-xs font-medium text-green-600">
          avança: {name(match.winnerId)}
        </div>
      )}

      {!match.winnerId && hasScore && match.homeTeamId && match.awayTeamId && (
        <div className="mt-1.5 text-center text-xs text-zinc-400">
          empate — vencedor indefinido
        </div>
      )}
    </div>
  )
}
