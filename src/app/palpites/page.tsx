import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { GroupPalpites } from './group-palpites'
import { KnockoutPalpites } from './knockout-palpites'
import { FinalPalpiteForm } from './final-palpite'
import type { Database } from '@/lib/supabase/types'

type Phase = Database['public']['Enums']['phase']

const PHASE_ORDER = [
  'group_stage', 'round_of_32', 'round_of_16',
  'quarterfinals', 'semifinals', 'third_place', 'final',
] as const

const PHASE_LABEL: Record<string, string> = {
  group_stage:   'Grupos',
  round_of_32:   '16-avos',
  round_of_16:   'Oitavas',
  quarterfinals: 'Quartas',
  semifinals:    'Semis',
  third_place:   '3º Lugar',
  final:         'Final',
}

const PHASE_HEADER: Record<string, string> = {
  group_stage:   'Fase de Grupos — 72 jogos',
  round_of_32:   '16-avos de Final',
  round_of_16:   'Oitavas de Final',
  quarterfinals: 'Quartas de Final',
  semifinals:    'Semifinais',
  third_place:   'Disputa de 3º Lugar',
  final:         'Final',
}

export default async function PalpitesPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string }>
}) {
  const { phase: phaseParam = 'group_stage' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Round 1: static data + phase availability ─────────────────────────────
  const [
    { data: profile },
    { data: palpiteFinal },
    { data: allTeams },
    { data: groupDeadline },
    { data: allPhasesData },
  ] = await Promise.all([
    supabase.from('users').select('name, is_admin').eq('id', user.id).single(),
    supabase.from('palpites_finais').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('teams').select('id, name, group').order('group').order('name'),
    supabase.from('phase_deadlines').select('deadline_at').eq('phase', 'group_stage').maybeSingle(),
    supabase.from('matches').select('phase, home_team_id, away_team_id'),
  ])

  // Phases with at least one match that has both teams set
  const phasesWithTeams = new Set<string>(
    (allPhasesData ?? [])
      .filter(m => m.home_team_id && m.away_team_id)
      .map(m => m.phase),
  )
  // group_stage is always present in the tab list
  phasesWithTeams.add('group_stage')

  const activePhase = (phasesWithTeams.has(phaseParam) ? phaseParam : 'group_stage') as Phase

  // ── Round 2: phase-specific data ──────────────────────────────────────────
  const [
    { data: phaseMatches },
    { data: phaseDeadline },
    { data: phaseException },
  ] = await Promise.all([
    supabase.from('matches').select('*').eq('phase', activePhase).order('scheduled_at'),
    supabase.from('phase_deadlines').select('deadline_at').eq('phase', activePhase).maybeSingle(),
    supabase.from('participant_exceptions').select('unlocked_until').eq('user_id', user.id).eq('phase', activePhase).maybeSingle(),
  ])

  const matchIds = phaseMatches?.map(m => m.id) ?? []

  // Team names for the current phase's matches (separate query — FK ambiguity workaround)
  const teamIds = [
    ...new Set(
      (phaseMatches ?? [])
        .flatMap(m => [m.home_team_id, m.away_team_id])
        .filter((id): id is string => id !== null),
    ),
  ]

  const [{ data: palpites }, { data: matchTeams }] = await Promise.all([
    matchIds.length > 0
      ? supabase.from('palpites_jogos').select('*').eq('user_id', user.id).in('match_id', matchIds)
      : { data: [] },
    teamIds.length > 0
      ? supabase.from('teams').select('id, name').in('id', teamIds)
      : { data: [] as { id: string; name: string }[] },
  ])

  const deadlineAt = activePhase === 'group_stage'
    ? groupDeadline?.deadline_at ?? null
    : phaseDeadline?.deadline_at ?? null

  const visiblePhases = PHASE_ORDER.filter(p => phasesWithTeams.has(p))

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
              <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-700">
                Sair
              </button>
            </form>
          </div>
        </div>

        <div className="mx-auto max-w-3xl border-t border-zinc-100 px-4 sm:px-6">
          <nav className="-mb-px flex gap-0">
            <TabLink href="/jogos">Jogos</TabLink>
            <TabLink href="/classificacao">Classificação</TabLink>
            <TabLink href="/palpites" active>Palpites</TabLink>
            <TabLink href="/ranking">Ranking</TabLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
        {/* Sub-nav */}
        <div className="flex gap-1">
          <SubLink href="/palpites" active>Palpites de Jogo</SubLink>
          <SubLink href="/palpites/bracket">Bracket Simulado</SubLink>
        </div>

        {/* Palpite Final */}
        <FinalPalpiteForm
          allTeams={allTeams ?? []}
          existing={palpiteFinal ?? null}
          deadlineAt={groupDeadline?.deadline_at ?? null}
        />

        {/* Phase tabs — only show when there are knockout phases available */}
        {visiblePhases.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {visiblePhases.map(p => (
              <PhaseTab
                key={p}
                href={`/palpites?phase=${p}`}
                active={activePhase === p}
              >
                {PHASE_LABEL[p]}
              </PhaseTab>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-zinc-200" />
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {PHASE_HEADER[activePhase]}
          </span>
          <div className="flex-1 border-t border-zinc-200" />
        </div>

        {/* Phase content */}
        {activePhase === 'group_stage' ? (
          <GroupPalpites
            matches={phaseMatches ?? []}
            palpites={palpites ?? []}
            teams={matchTeams ?? []}
            deadlineAt={deadlineAt}
            exceptionUntil={phaseException?.unlocked_until ?? null}
          />
        ) : (
          <KnockoutPalpites
            matches={phaseMatches ?? []}
            palpites={palpites ?? []}
            teams={matchTeams ?? []}
            deadlineAt={deadlineAt}
            exceptionUntil={phaseException?.unlocked_until ?? null}
          />
        )}
      </main>
    </div>
  )
}

function TabLink({
  href, active, children,
}: {
  href: string; active?: boolean; children: React.ReactNode
}) {
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

function PhaseTab({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-zinc-800 text-white'
          : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
      }`}
    >
      {children}
    </Link>
  )
}
