import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { MatchList } from './match-list'

const PHASES = [
  { value: 'group_stage',   label: 'Fase de Grupos' },
  { value: 'round_of_32',  label: '16-avos' },
  { value: 'round_of_16',  label: 'Oitavas' },
  { value: 'quarterfinals', label: 'Quartas' },
  { value: 'semifinals',   label: 'Semifinais' },
  { value: 'third_place',  label: 'Disputa de 3º' },
  { value: 'final',        label: 'Final' },
] as const

type Phase = typeof PHASES[number]['value']

export default async function JogosPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { phase: phaseParam }] = await Promise.all([
    supabase.from('users').select('name, is_admin').eq('id', user.id).single(),
    searchParams,
  ])

  const phase: Phase = (PHASES.find(p => p.value === phaseParam)?.value ?? 'group_stage') as Phase

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('phase', phase)
    .order('scheduled_at')

  const teamIds = [
    ...new Set(
      matches?.flatMap(m => [m.home_team_id, m.away_team_id]).filter((id): id is string => id !== null) ?? [],
    ),
  ]
  const { data: teamsData } = teamIds.length > 0
    ? await supabase.from('teams').select('id, name').in('id', teamIds)
    : { data: [] as { id: string; name: string }[] }

  return (
    <div className="min-h-full bg-zinc-50">
      {/* App header */}
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

        {/* App-level tab nav */}
        <div className="mx-auto max-w-3xl border-t border-zinc-100 px-4 sm:px-6">
          <nav className="-mb-px flex gap-0">
            <TabLink href="/jogos" active>Jogos</TabLink>
            <TabLink href="/classificacao">Classificação</TabLink>
            <TabLink href="/palpites">Palpites</TabLink>
            <TabLink href="/ranking">Ranking</TabLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Phase filter */}
        <div className="mb-4 flex flex-wrap gap-1">
          {PHASES.map(p => (
            <Link
              key={p.value}
              href={`/jogos?phase=${p.value}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors sm:text-sm ${
                phase === p.value
                  ? 'bg-green-700 text-white'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        <MatchList initialMatches={matches ?? []} teams={teamsData ?? []} phase={phase} />
      </main>
    </div>
  )
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string
  active?: boolean
  children: React.ReactNode
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
