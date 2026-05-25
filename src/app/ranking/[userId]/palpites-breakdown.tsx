'use client'

import { useState } from 'react'

export interface MatchRow {
  matchId: string
  homeTeam: string
  awayTeam: string
  officialHome: number | null
  officialAway: number | null
  predictedHome: number | null
  predictedAway: number | null
  points: 0 | 5 | 10 | null
  isFinished: boolean
}

const PHASE_LABEL: Record<string, string> = {
  group_stage:   'Fase de Grupos',
  round_of_32:   '16-avos de Final',
  round_of_16:   'Oitavas de Final',
  quarterfinals: 'Quartas de Final',
  semifinals:    'Semifinais',
  third_place:   'Disputa de 3º Lugar',
  final:         'Final',
}

const PHASE_ORDER = [
  'group_stage', 'round_of_32', 'round_of_16',
  'quarterfinals', 'semifinals', 'third_place', 'final',
]

export function PalpitesBreakdown({ byPhase }: { byPhase: Record<string, MatchRow[]> }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const toggle = (phase: string) => setExpanded(p => ({ ...p, [phase]: !p[phase] }))

  if (Object.keys(byPhase).length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-400">
        Nenhum jogo encerrado ainda.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {PHASE_ORDER.map(phase => {
        const rows = byPhase[phase]
        if (!rows || rows.length === 0) return null

        const finishedRows = rows.filter(r => r.isFinished)
        const phaseTotal   = finishedRows.reduce((s, r) => s + (r.points ?? 0), 0)
        const exactCount   = finishedRows.filter(r => r.points === 10).length
        const correctCount = finishedRows.filter(r => r.points === 5).length
        const isExpanded   = !!expanded[phase]

        return (
          <section key={phase} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">

            {/* Phase header — click to toggle */}
            <button
              onClick={() => toggle(phase)}
              className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-zinc-50"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-zinc-800">{PHASE_LABEL[phase] ?? phase}</span>
                {exactCount > 0 && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    {exactCount} ★
                  </span>
                )}
                {correctCount > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {correctCount} ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-zinc-700">{phaseTotal} pts</span>
                <span className="text-xs text-zinc-400">{isExpanded ? '▲' : '▼'}</span>
              </div>
            </button>

            {/* Match rows */}
            {isExpanded && (
              <div className="divide-y divide-zinc-100 border-t border-zinc-100">
                {rows.map(r => {
                  const hasPalpite = r.predictedHome !== null && r.predictedAway !== null
                  const borderClass = !r.isFinished
                    ? 'border-l-4 border-l-zinc-200'
                    : r.points === 10 ? 'border-l-4 border-l-green-500'
                    : r.points === 5  ? 'border-l-4 border-l-blue-400'
                    : r.points === 0  ? 'border-l-4 border-l-red-400'
                    :                   'border-l-4 border-l-zinc-200'

                  return (
                    <div key={r.matchId} className={`flex items-center gap-2 py-2.5 pr-3 pl-2 ${borderClass}`}>
                      {/* Home */}
                      <span className="min-w-0 flex-1 truncate text-right text-xs font-medium text-zinc-800">
                        {r.homeTeam}
                      </span>

                      {/* Scores: palpite (top) / resultado oficial (bottom) */}
                      <div className="w-28 shrink-0 text-center">
                        <div className="text-[10px] text-zinc-400">
                          {hasPalpite ? `${r.predictedHome}×${r.predictedAway}` : 'sem palpite'}
                        </div>
                        {r.isFinished ? (
                          <div className="text-xs font-bold text-zinc-900">
                            {r.officialHome} × {r.officialAway}
                          </div>
                        ) : (
                          <div className="text-[10px] text-zinc-300">a jogar</div>
                        )}
                      </div>

                      {/* Away */}
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-800">
                        {r.awayTeam}
                      </span>

                      {/* Points badge */}
                      <div className="w-12 shrink-0 text-right">
                        {r.isFinished ? <PointsBadge pts={r.points} /> : <span className="text-xs text-zinc-300">—</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function PointsBadge({ pts }: { pts: 0 | 5 | 10 | null }) {
  if (pts === null) return <span className="text-xs text-zinc-300">—</span>
  if (pts === 10) return (
    <span className="inline-block animate-pulse rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-bold text-green-700">
      ★ 10
    </span>
  )
  if (pts === 5) return (
    <span className="inline-block rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-700">
      ✓ 5
    </span>
  )
  return <span className="text-xs text-zinc-400">0</span>
}
