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
    { data: palpites },
    { data: bracketOverrides },
    { data: classifierOverrides },
    { data: palpiteFinal },
    { data: groupDeadline },
  ] = await Promise.all([
    supabase.from('users').select('name, is_admin').eq('id', user.id).single(),
    supabase.from('teams').select('id, name, group, fifa_ranking_reference, country_code'),
    supabase.from('matches').select('id, group, home_team_id, away_team_id, is_finished').eq('phase', 'group_stage'),
    supabase.from('palpites_jogos').select('match_id, home_score, away_score').eq('user_id', user.id),
    supabase.from('bracket_overrides').select('*'),
    supabase.from('classifier_overrides').select('*'),
    supabase.from('palpites_finais').select('champion_team_id, runner_up_team_id, third_team_id, fourth_team_id, top_scorer, best_player, bracket_picks').eq('user_id', user.id).maybeSingle(),
    supabase.from('phase_deadlines').select('deadline_at').eq('phase', 'bracket_simulado').maybeSingle(),
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

  const groupStageFinished =
    (groupMatches ?? []).length > 0 && (groupMatches ?? []).every(m => m.is_finished)

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

  const teamCode: Record<string, string> = Object.fromEntries(
    (teams ?? []).filter(t => t.country_code).map(t => [t.id, t.country_code!]),
  )

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/jogos" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="" width={32} height={32} className="shrink-0" />
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-base font-extrabold tracking-tight text-zinc-900">Bolão</span>
                <span className="text-base font-extrabold tracking-tight text-green-700">Copa 2026</span>
              </div>
            </Link>
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
            teamCode={teamCode}
            userId={user.id}
            existingFinal={palpiteFinal ?? null}
            initialPicks={palpiteFinal?.bracket_picks ?? null}
            deadlineAt={groupDeadline?.deadline_at ?? null}  // bracket_simulado deadline
            groupStageFinished={groupStageFinished}
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
