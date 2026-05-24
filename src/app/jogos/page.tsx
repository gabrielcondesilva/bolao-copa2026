import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { MatchList } from './match-list'

const PHASES = [
  { value: 'group_stage',   label: 'Grupos' },
  { value: 'round_of_32',  label: '16-avos' },
  { value: 'round_of_16',  label: 'Oitavas' },
  { value: 'quarterfinals', label: 'Quartas' },
  { value: 'semifinals',   label: 'Semis' },
  { value: 'third_place',  label: '3º Lugar' },
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
    ? await supabase.from('teams').select('id, name, country_code').in('id', teamIds)
    : { data: [] as { id: string; name: string; country_code: string }[] }

  return (
    <AppShell profile={profile}>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-wrap gap-1.5">
          {PHASES.map(p => (
            <Link
              key={p.value}
              href={`/jogos?phase=${p.value}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                phase === p.value
                  ? 'bg-green-700 text-white'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        <MatchList initialMatches={matches ?? []} teams={teamsData ?? []} phase={phase} />
      </main>
    </AppShell>
  )
}
