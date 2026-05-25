'use client'

import { useState } from 'react'
import type { SimulatedBracket, SimulatedKnockoutMatch } from '@/lib/engines/bracket-simulator'

interface RealMatch {
  homeName: string
  awayName: string
  homeScore: number | null
  awayScore: number | null
}

interface Props {
  bracket: SimulatedBracket
  teamName: Record<string, string>
  groupStageFinished: boolean
  finishedPhases: Set<string>
  knockoutByPhase: Record<string, RealMatch[]>
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

export function BracketView({ bracket, teamName, groupStageFinished, finishedPhases, knockoutByPhase }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const toggle = (phase: string) => setExpanded(p => ({ ...p, [phase]: !p[phase] }))

  const name = (id: string | null) => (id ? (teamName[id] ?? '?') : '—')

  return (
    <div className="space-y-4">

      {/* Group stage qualifiers — always visible */}
      <section>
        <SectionHeader title="Fase de Grupos — Classificados" locked={groupStageFinished} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(bracket.groups).map(([group, result]) => (
            <div key={group} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 bg-zinc-50 px-3 py-1.5">
                <span className="text-xs font-bold text-zinc-500">Grupo {group}</span>
              </div>
              <div className="space-y-1 px-3 py-2">
                {[result.first, result.second, result.third, result.fourth].map((teamId, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="w-4 shrink-0 text-zinc-400">{i + 1}.</span>
                    <span className={`truncate font-medium ${i < 2 ? 'text-zinc-900' : 'text-zinc-400'}`}>
                      {name(teamId)}
                    </span>
                    {i < 2 && <span className="ml-auto shrink-0 text-green-600">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <p className="mb-2 text-xs font-medium text-zinc-500">Melhores 3ºs colocados (8 de 12)</p>
          <div className="flex flex-wrap gap-2">
            {bracket.bestThirds.slice(0, 8).map((t, i) => (
              <span key={t.teamId} className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                {i + 1}. {name(t.teamId)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 16-avos */}
      <CollapsibleSection
        phase="round_of_32"
        isExpanded={!!expanded['round_of_32']}
        onToggle={() => toggle('round_of_32')}
        locked={finishedPhases.has('round_of_32')}
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
  phase,
  isExpanded,
  onToggle,
  locked,
  children,
}: {
  phase: string
  isExpanded: boolean
  onToggle: () => void
  locked: boolean
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

function SectionHeader({ title, locked }: { title: string; locked: boolean }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h3 className="text-sm font-bold text-zinc-800">{title}</h3>
      {locked && (
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
          finalizado
        </span>
      )}
    </div>
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
