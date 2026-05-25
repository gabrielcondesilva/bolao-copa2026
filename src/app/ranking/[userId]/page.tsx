import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { computeRanking } from '@/lib/ranking'
import { scoreMatch } from '@/lib/engines/scoring'
import { PalpitesBreakdown } from './palpites-breakdown'
import type { MatchRow } from './palpites-breakdown'

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [
    { data: profile },
    { data: targetUser },
    { data: participants },
    { data: allMatches },
    { data: allPalpitesJogos },
    { data: allPalpitesFinais },
    { data: teams },
    { data: bracketOverrides },
    { data: classifierOverrides },
  ] = await Promise.all([
    supabase.from('users').select('name, is_admin').eq('id', user.id).single(),
    admin.from('users').select('id, name').eq('id', userId).single(),
    admin.from('users').select('id, name').order('name'),
    admin.from('matches').select('*'),
    admin.from('palpites_jogos').select('*').eq('user_id', userId),
    admin.from('palpites_finais').select('*'),
    admin.from('teams').select('*'),
    admin.from('bracket_overrides').select('*'),
    admin.from('classifier_overrides').select('*'),
  ])

  if (!targetUser) notFound()

  const ranking = computeRanking({
    participants: participants ?? [],
    allMatches: allMatches ?? [],
    allPalpitesJogos: await admin.from('palpites_jogos').select('*').then(r => r.data ?? []),
    allPalpitesFinais: allPalpitesFinais ?? [],
    teams: teams ?? [],
    bracketOverrides: bracketOverrides ?? [],
    classifierOverrides: classifierOverrides ?? [],
  })

  const entry = ranking.find(e => e.userId === userId)
  if (!entry) notFound()

  const teamName = new Map((teams ?? []).map(t => [t.id, t.name]))
  const palpiteMap = new Map((allPalpitesJogos ?? []).map(p => [p.match_id, p]))
  const palpiteFinal = (allPalpitesFinais ?? []).find(p => p.user_id === userId) ?? null

  const finishedMatches = (allMatches ?? []).filter(
    m => m.is_finished && m.home_score !== null && m.away_score !== null,
  )

  // Build per-match detail, grouped by phase (sorted by scheduled_at)
  const byPhaseMap = new Map<string, MatchRow[]>()

  for (const m of [...finishedMatches].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))) {
    if (!m.home_team_id || !m.away_team_id) continue
    const p = palpiteMap.get(m.id)
    const filled = p && p.home_score !== null && p.away_score !== null
    const pts = filled
      ? scoreMatch(
          { home: p.home_score!, away: p.away_score! },
          { home: m.home_score!, away: m.away_score! },
          m.went_to_extra_time,
        )
      : null

    const row: MatchRow = {
      matchId: m.id,
      homeTeam: teamName.get(m.home_team_id) ?? '?',
      awayTeam: teamName.get(m.away_team_id) ?? '?',
      officialHome: m.home_score!,
      officialAway: m.away_score!,
      predictedHome: p?.home_score ?? null,
      predictedAway: p?.away_score ?? null,
      points: pts,
    }

    if (!byPhaseMap.has(m.phase)) byPhaseMap.set(m.phase, [])
    byPhaseMap.get(m.phase)!.push(row)
  }

  const byPhase: Record<string, MatchRow[]> = Object.fromEntries(byPhaseMap)

  // Actual final positions (same logic as ranking.ts)
  const finalMatch = finishedMatches.find(m => m.phase === 'final')
  const thirdMatch = finishedMatches.find(m => m.phase === 'third_place')
  const winner = (m: typeof finishedMatches[0]) =>
    m.home_score! > m.away_score! ? m.home_team_id : m.away_team_id
  const loser = (m: typeof finishedMatches[0]) =>
    m.home_score! > m.away_score! ? m.away_team_id : m.home_team_id
  const actualChampion = finalMatch ? winner(finalMatch) : null
  const actualRunnerUp  = finalMatch ? loser(finalMatch)  : null
  const actualThird     = thirdMatch ? winner(thirdMatch) : null
  const actualFourth    = thirdMatch ? loser(thirdMatch)  : null

  const posLabel = (pos: number) =>
    pos === 1 ? '1º' : pos === 2 ? '2º' : pos === 3 ? '3º' : `${pos}º`

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-base font-bold text-zinc-900">Bolão Copa 2026</span>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden text-sm text-zinc-600 sm:block">{profile?.name}</span>
            {profile?.is_admin && (
              <Link href="/admin" className="text-sm font-medium text-green-700 hover:text-green-800">
                Admin
              </Link>
            )}
            <form action={logout}>
              <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-700">Sair</button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-3xl border-t border-zinc-100 px-4 sm:px-6">
          <nav className="-mb-px flex gap-0">
            <TabLink href="/jogos">Jogos</TabLink>
            <TabLink href="/classificacao">Classificação</TabLink>
            <TabLink href="/palpites">Palpites</TabLink>
            <TabLink href="/ranking" active>Ranking</TabLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
        {/* Back + title */}
        <div>
          <Link href="/ranking" className="text-xs text-zinc-400 hover:text-zinc-600">
            ← Ranking
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                entry.position === 1 ? 'bg-amber-400 text-white'
                : entry.position === 2 ? 'bg-zinc-300 text-zinc-700'
                : entry.position === 3 ? 'bg-amber-700 text-white'
                : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              {entry.position}
            </span>
            <div>
              <h1 className="text-lg font-bold text-zinc-900">{targetUser.name}</h1>
              <p className="text-xs text-zinc-500">{posLabel(entry.position)} lugar</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-zinc-900">{entry.totalPoints}</p>
              <p className="text-xs text-zinc-500">pontos</p>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Fase de Grupos" value={entry.groupPoints} />
          <StatCard label="Eliminatórias" value={entry.knockoutPoints} />
          <StatCard label="Classificados" value={entry.classificationPoints} />
          <StatCard label="Palpite Final" value={entry.finalPoints} />
        </div>

        {/* Tiebreakers */}
        <div className="flex gap-6 rounded-lg border border-zinc-100 bg-white px-4 py-3 text-sm">
          <div>
            <span className="font-semibold text-zinc-900">{entry.exactScores}</span>
            <span className="ml-1 text-zinc-500">cravados</span>
          </div>
          <div>
            <span className="font-semibold text-zinc-900">{entry.correctResults}</span>
            <span className="ml-1 text-zinc-500">resultados</span>
          </div>
        </div>

        {/* Palpite Final */}
        {palpiteFinal && (
          <section>
            <h2 className="mb-3 text-sm font-bold text-zinc-800">Palpite Final</h2>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <div className="divide-y divide-zinc-100">
                <FinalRow
                  label="Campeão (40 pts)"
                  team={palpiteFinal.champion_team_id ? (teamName.get(palpiteFinal.champion_team_id) ?? '?') : '—'}
                  hit={!!actualChampion && palpiteFinal.champion_team_id === actualChampion}
                  known={!!actualChampion}
                />
                <FinalRow
                  label="Vice (20 pts)"
                  team={palpiteFinal.runner_up_team_id ? (teamName.get(palpiteFinal.runner_up_team_id) ?? '?') : '—'}
                  hit={!!actualRunnerUp && palpiteFinal.runner_up_team_id === actualRunnerUp}
                  known={!!actualRunnerUp}
                />
                <FinalRow
                  label="3º Lugar (10 pts)"
                  team={palpiteFinal.third_team_id ? (teamName.get(palpiteFinal.third_team_id) ?? '?') : '—'}
                  hit={!!actualThird && palpiteFinal.third_team_id === actualThird}
                  known={!!actualThird}
                />
                <FinalRow
                  label="4º Lugar (5 pts)"
                  team={palpiteFinal.fourth_team_id ? (teamName.get(palpiteFinal.fourth_team_id) ?? '?') : '—'}
                  hit={!!actualFourth && palpiteFinal.fourth_team_id === actualFourth}
                  known={!!actualFourth}
                />
                {palpiteFinal.top_scorer && (
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-zinc-500">Artilheiro (10 pts)</span>
                    <span className="font-medium text-zinc-900">{palpiteFinal.top_scorer}</span>
                  </div>
                )}
                {palpiteFinal.best_player && (
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-zinc-500">Craque (10 pts)</span>
                    <span className="font-medium text-zinc-900">{palpiteFinal.best_player}</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Per-phase match breakdown */}
        <PalpitesBreakdown byPhase={byPhase} />
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-center">
      <p className="text-xl font-bold text-zinc-900">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
    </div>
  )
}

function FinalRow({
  label, team, hit, known,
}: {
  label: string; team: string; hit: boolean; known: boolean
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-zinc-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-medium ${hit ? 'text-green-700' : 'text-zinc-900'}`}>{team}</span>
        {known && (
          hit
            ? <span className="text-xs font-bold text-green-600">✓</span>
            : <span className="text-xs text-zinc-300">✗</span>
        )}
      </div>
    </div>
  )
}


function TabLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-green-700 text-green-700'
          : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
      }`}
    >
      {children}
    </Link>
  )
}
