import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { DeadlineRow } from './deadline-row'

const PHASES = [
  { value: 'group_stage',       label: 'Fase de Grupos' },
  { value: 'bracket_simulado',  label: 'Bracket Simulado' },
  { value: 'round_of_32',       label: '16-avos' },
  { value: 'round_of_16',       label: 'Oitavas' },
  { value: 'quarterfinals',     label: 'Quartas' },
  { value: 'semifinals',        label: 'Semifinais' },
  { value: 'third_place',       label: 'Disputa de 3º' },
  { value: 'final',             label: 'Final' },
] as const


export default async function AdminPrazosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/')

  const admin = createAdminClient()
  const [{ data: deadlines }, { data: firstMatches }] = await Promise.all([
    supabase.from('phase_deadlines').select('phase, deadline_at'),
    admin.from('matches').select('phase, scheduled_at').order('scheduled_at', { ascending: true }),
  ])

  const deadlineMap = new Map(deadlines?.map(d => [d.phase, d.deadline_at]) ?? [])

  // First match per phase
  const firstMatchMap = new Map<string, string>()
  for (const m of firstMatches ?? []) {
    if (!firstMatchMap.has(m.phase)) firstMatchMap.set(m.phase, m.scheduled_at)
  }

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-zinc-900">Painel Admin</h1>
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-700">
            Participantes
          </Link>
          <Link href="/admin/jogos" className="text-sm text-zinc-500 hover:text-zinc-700">
            Jogos
          </Link>
          <Link href="/admin/importar" className="text-sm text-zinc-500 hover:text-zinc-700">
            Importar
          </Link>
          <Link href="/admin/prazos" className="text-sm font-medium text-green-700">
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

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-10">

        {/* Phase deadlines */}
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-zinc-900">Prazos de Fase</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Horários em UTC. Participantes não conseguem editar palpites após o prazo da fase.
            </p>
          </div>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600 w-36">Fase</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600 w-36">1º Jogo (UTC)</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600" colSpan={2}>Prazo (UTC)</th>
                </tr>
              </thead>
              <tbody>
                {PHASES.map(p => (
                  <DeadlineRow
                    key={p.value}
                    phase={p.value}
                    label={p.label}
                    currentDeadline={deadlineMap.get(p.value) ?? null}
                    firstMatchAt={firstMatchMap.get(p.value) ?? null}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  )
}
