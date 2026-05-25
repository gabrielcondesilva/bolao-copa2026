import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { simulateBracket, type GroupMatchInput, type BracketTeam } from '@/lib/engines/bracket-simulator'
import { BracketView } from './bracket-view'

export default async function BracketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: teams },
    { data: groupMatches },
    { data: knockoutMatches },
    { data: palpites },
    { data: bracketOverrides },
    { data: classifierOverrides },
  ] = await Promise.all([
    supabase.from('users').select('name, is_admin').eq('id', user.id).single(),
    supabase.from('teams').select('id, name, group, fifa_ranking_reference'),
    supabase.from('matches').select('id, group, home_team_id, away_team_id, is_finished').eq('phase', 'group_stage'),
    supabase.from('matches').select('id, phase, home_team_id, away_team_id, is_finished').neq('phase', 'group_stage').order('scheduled_at'),
    supabase.from('palpites_jogos').select('match_id, home_score, away_score').eq('user_id', user.id),
    supabase.from('bracket_overrides').select('*'),
    supabase.from('classifier_overrides').select('*'),
  ])

  // Build bracket inputs
  const palpiteMap = new Map((palpites ?? []).map(p => [p.match_id, p]))

  const groupMatchInputs: GroupMatchInput[] = (groupMatches ?? [])
    .filter(m => m.home_team_id && m.away_team_id && m.group)
    .map(m => {
      const p = palpiteMap.get(m.id)
      return {
        matchId: m.id,
        group: m.group!,
        homeTeamId: m.home_team_id!,
        awayTeamId: m.away_team_id!,
        predictedHomeScore: p?.home_score ?? null,
        predictedAwayScore: p?.away_score ?? null,
      }
    })

  const bracketTeams: BracketTeam[] = (teams ?? []).map(t => ({
    id: t.id,
    name: t.name,
    group: t.group,
    fifa_ranking_reference: t.fifa_ranking_reference,
  }))

  // Lock states
  const groupStageFinished =
    (groupMatches ?? []).length > 0 && (groupMatches ?? []).every(m => m.is_finished)

  const finishedPhases = new Set<string>(
    (knockoutMatches ?? [])
      .reduce<string[]>((acc, m) => {
        if (!acc.includes(m.phase)) acc.push(m.phase)
        return acc
      }, [])
      .filter(phase => {
        const phaseMatches = (knockoutMatches ?? []).filter(m => m.phase === phase)
        return phaseMatches.length > 0 && phaseMatches.every(m => m.is_finished)
      }),
  )

  // Run simulator
  let bracket = null
  let simError: string | null = null

  if (bracketTeams.length > 0 && groupMatchInputs.length > 0) {
    try {
      bracket = simulateBracket({
        groupMatches: groupMatchInputs,
        teams: bracketTeams,
        overrides: {
          classifiers: (classifierOverrides ?? []).map(o => ({
            phase: o.phase,
            orderedTeamIds: o.ordered_team_ids,
          })),
          bracket: (bracketOverrides ?? []).map(o => ({
            phase: o.phase,
            matchSlot: o.match_slot,
            homeTeamId: o.home_team_id,
            awayTeamId: o.away_team_id,
          })),
        },
      })
    } catch (e) {
      simError = e instanceof Error ? e.message : 'Erro na simulação'
    }
  }

  const teamName: Record<string, string> = Object.fromEntries(
    (teams ?? []).map(t => [t.id, t.name]),
  )

  // Real knockout match predictions grouped by phase (always-visible section)
  const KNOCKOUT_PHASES = ['round_of_32', 'round_of_16', 'quarterfinals', 'semifinals', 'third_place', 'final'] as const
  const knockoutByPhase: Record<string, { homeName: string; awayName: string; homeScore: number | null; awayScore: number | null }[]> = {}
  for (const phase of KNOCKOUT_PHASES) {
    const phaseMatches = (knockoutMatches ?? []).filter(m => m.phase === phase && (m.home_team_id || m.away_team_id))
    if (phaseMatches.length > 0) {
      knockoutByPhase[phase] = phaseMatches.map(m => ({
        homeName: teamName[m.home_team_id ?? ''] ?? '—',
        awayName: teamName[m.away_team_id ?? ''] ?? '—',
        homeScore: palpiteMap.get(m.id)?.home_score ?? null,
        awayScore: palpiteMap.get(m.id)?.away_score ?? null,
      }))
    }
  }

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

        {/* App tabs */}
        <div className="mx-auto max-w-3xl border-t border-zinc-100 px-4 sm:px-6">
          <nav className="-mb-px flex gap-0">
            <TabLink href="/jogos">Jogos</TabLink>
            <TabLink href="/classificacao">Classificação</TabLink>
            <TabLink href="/palpites" active>Palpites</TabLink>
            <TabLink href="/ranking">Ranking</TabLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Palpites sub-nav */}
        <div className="mb-6 flex gap-1">
          <SubLink href="/palpites">Palpites de Jogo</SubLink>
          <SubLink href="/palpites/bracket" active>Bracket Simulado</SubLink>
        </div>

        {!bracket && !simError && (
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-400">
            Preencha pelo menos alguns palpites da Fase de Grupos para ver o Bracket Simulado.
          </div>
        )}

        {simError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            Erro na simulação: {simError}
          </div>
        )}

        {bracket && (
          <BracketView
            bracket={bracket}
            teamName={teamName}
            groupStageFinished={groupStageFinished}
            finishedPhases={finishedPhases}
            knockoutByPhase={knockoutByPhase}
          />
        )}
      </main>
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

function SubLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-green-700 text-white'
          : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
      }`}
    >
      {children}
    </Link>
  )
}
