'use client'

import type { SimulatedBracket, SimulatedKnockoutMatch } from '@/lib/engines/bracket-simulator'

interface Props {
  bracket: SimulatedBracket
  teamName: Record<string, string>
  groupStageFinished: boolean
  finishedPhases: Set<string>
}

const PHASE_LABELS: Record<string, string> = {
  round_of_32: '16-avos de Final',
  round_of_16: 'Oitavas de Final',
  quarterfinals: 'Quartas de Final',
  semifinals: 'Semifinais',
}

export function BracketView({ bracket, teamName, groupStageFinished, finishedPhases }: Props) {
  const name = (id: string | null) => (id ? (teamName[id] ?? '?') : '—')

  return (
    <div className="space-y-8">

      {/* Group stage qualifiers */}
      <section>
        <SectionHeader
          title="Fase de Grupos — Classificados"
          locked={groupStageFinished}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(bracket.groups).map(([group, result]) => (
            <div key={group} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 bg-zinc-50 px-3 py-1.5">
                <span className="text-xs font-bold text-zinc-500">Grupo {group}</span>
              </div>
              <div className="px-3 py-2 space-y-1">
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

        {/* Best thirds */}
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium text-zinc-500">Melhores 3ºs colocados (8 de 12)</p>
          <div className="flex flex-wrap gap-2">
            {bracket.bestThirds.slice(0, 8).map((t, i) => (
              <span
                key={t.teamId}
                className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
              >
                {i + 1}. {name(t.teamId)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Round of 32 */}
      <KnockoutSection
        title="16-avos de Final"
        phase="round_of_32"
        matches={bracket.round_of_32}
        teamName={teamName}
        locked={finishedPhases.has('round_of_32')}
        cols={2}
      />

      {/* Round of 16 */}
      <KnockoutSection
        title="Oitavas de Final"
        phase="round_of_16"
        matches={bracket.round_of_16}
        teamName={teamName}
        locked={finishedPhases.has('round_of_16')}
        cols={2}
      />

      {/* Quarterfinals */}
      <KnockoutSection
        title="Quartas de Final"
        phase="quarterfinals"
        matches={bracket.quarter_finals}
        teamName={teamName}
        locked={finishedPhases.has('quarterfinals')}
        cols={2}
      />

      {/* Semifinals */}
      <KnockoutSection
        title="Semifinais"
        phase="semifinals"
        matches={bracket.semi_finals}
        teamName={teamName}
        locked={finishedPhases.has('semifinals')}
        cols={2}
      />

      {/* Third place + Final */}
      <section>
        <SectionHeader title="Decisões" locked={finishedPhases.has('final')} />
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
      </section>
    </div>
  )
}

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

function KnockoutSection({
  title,
  matches,
  teamName,
  locked,
  cols,
}: {
  title: string
  phase: string
  matches: SimulatedKnockoutMatch[]
  teamName: Record<string, string>
  locked: boolean
  cols: number
}) {
  return (
    <section>
      <SectionHeader title={title} locked={locked} />
      <div className={`grid gap-3 ${cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {matches.map(m => (
          <MatchCard key={m.matchNumber} match={m} teamName={teamName} />
        ))}
      </div>
    </section>
  )
}

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
        <div className="mt-1.5 text-center text-xs text-green-600 font-medium">
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
