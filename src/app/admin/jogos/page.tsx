import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { MatchForm } from './match-form'
import { SyncButton } from './sync-button'
import { teamFlag } from '@/lib/flags'

const PHASES = [
  { value: 'group_stage',  label: 'Fase de Grupos' },
  { value: 'round_of_32',  label: '16-avos' },
  { value: 'round_of_16',  label: 'Oitavas' },
  { value: 'quarterfinals', label: 'Quartas' },
  { value: 'semifinals',   label: 'Semifinais' },
  { value: 'third_place',  label: 'Disputa de 3º' },
  { value: 'final',        label: 'Final' },
] as const

type Phase = typeof PHASES[number]['value']

const KNOCKOUT_PHASES: string[] = [
  'round_of_32', 'round_of_16', 'quarterfinals', 'semifinals', 'third_place', 'final',
]

export default async function AdminJogosPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/')

  const { phase: phaseParam } = await searchParams
  const phase: Phase = (PHASES.find(p => p.value === phaseParam)?.value ?? 'group_stage') as Phase
  const isKnockout = KNOCKOUT_PHASES.includes(phase)

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('phase', phase)
    .order('scheduled_at')

  const teamIds = [...new Set(
    matches?.flatMap(m => [m.home_team_id, m.away_team_id]).filter((id): id is string => id !== null) ?? []
  )]
  const { data: teamsData } = teamIds.length > 0
    ? await supabase.from('teams').select('id, name, country_code').in('id', teamIds)
    : { data: [] as { id: string; name: string; country_code: string | null }[] }
  const teamName = new Map(teamsData?.map(t => [t.id, t.name]) ?? [])
  const teamCode = new Map(teamsData?.map(t => [t.id, t.country_code]) ?? [])

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-zinc-900">Painel Admin</h1>
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-700">
            Participantes
          </Link>
          <Link href="/admin/jogos" className="text-sm font-medium text-green-700">
            Jogos
          </Link>
          <Link href="/admin/importar" className="text-sm text-zinc-500 hover:text-zinc-700">
            Importar
          </Link>
          <Link href="/admin/prazos" className="text-sm text-zinc-500 hover:text-zinc-700">
            Prazos
          </Link>
          <Link href="/admin/classificados" className="text-sm text-zinc-500 hover:text-zinc-700">
            Classificados
          </Link>
          <Link href="/admin/premios" className="text-sm text-zinc-500 hover:text-zinc-700">
            Prêmios
          </Link>
          <Link href="/jogos" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Ver bolão →
          </Link>
          <form action={logout}>
            <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-700">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Phase tabs */}
        <div className="mb-6 flex flex-wrap gap-1">
          {PHASES.map(p => (
            <Link
              key={p.value}
              href={`/admin/jogos?phase=${p.value}`}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                phase === p.value
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        {/* Sync */}
        <div className="mb-4">
          <SyncButton />
        </div>

        {/* Match table */}
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {matches && matches.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  {phase === 'group_stage' && (
                    <th className="w-8 px-4 py-3 text-left font-medium text-zinc-600">Gr.</th>
                  )}
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Data</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-600">Casa</th>
                  <th className="px-4 py-3 text-center font-medium text-zinc-600">Placar</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Fora</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {matches.map(match => {
                  const home = teamName.get(match.home_team_id ?? '') ?? '—'
                  const away = teamName.get(match.away_team_id ?? '') ?? '—'
                  const homeFlag = teamFlag(teamCode.get(match.home_team_id ?? ''))
                  const awayFlag = teamFlag(teamCode.get(match.away_team_id ?? ''))
                  const date = new Date(match.scheduled_at).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })

                  return (
                    <tr key={match.id} className={match.is_finished ? 'bg-zinc-50' : ''}>
                      {phase === 'group_stage' && (
                        <td className="px-4 py-3 font-medium text-zinc-400">{match.group}</td>
                      )}
                      <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{date}</td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-900">
                          <span className="inline-flex items-center justify-end gap-1.5">
                            {home}
                            {homeFlag && <span className={`fi fi-${homeFlag} shrink-0 rounded-sm`} style={{ fontSize: '0.875rem' }} aria-hidden="true" />}
                          </span>
                        </td>
                      <td className="px-4 py-3 text-center text-zinc-400">
                        {match.is_finished
                          ? <span className="font-semibold text-zinc-900">{match.home_score} × {match.away_score}</span>
                          : <span className="text-zinc-300">— × —</span>
                        }
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                          <span className="inline-flex items-center gap-1.5">
                            {awayFlag && <span className={`fi fi-${awayFlag} shrink-0 rounded-sm`} style={{ fontSize: '0.875rem' }} aria-hidden="true" />}
                            {away}
                          </span>
                        </td>
                      <td className="px-4 py-3">
                        <MatchForm
                          matchId={match.id}
                          homeScore={match.home_score}
                          awayScore={match.away_score}
                          wentToExtraTime={match.went_to_extra_time}
                          isKnockout={isKnockout}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-12 text-center text-zinc-400">
              Nenhum jogo cadastrado para esta fase.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
