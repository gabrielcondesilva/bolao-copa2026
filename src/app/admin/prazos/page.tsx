import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { deleteParticipantException } from '@/app/actions/deadlines'
import { DeadlineRow } from './deadline-row'
import { ExceptionForm } from './exception-form'

const PHASES = [
  { value: 'group_stage',   label: 'Fase de Grupos' },
  { value: 'round_of_32',  label: '16-avos' },
  { value: 'round_of_16',  label: 'Oitavas' },
  { value: 'quarterfinals', label: 'Quartas' },
  { value: 'semifinals',   label: 'Semifinais' },
  { value: 'third_place',  label: 'Disputa de 3º' },
  { value: 'final',        label: 'Final' },
] as const

const PHASE_LABELS: Record<string, string> = Object.fromEntries(PHASES.map(p => [p.value, p.label]))

export default async function AdminPrazosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.app_metadata?.is_admin) redirect('/')

  const [{ data: deadlines }, { data: exceptions }, { data: participants }] = await Promise.all([
    supabase.from('phase_deadlines').select('phase, deadline_at'),
    supabase.from('participant_exceptions').select('id, phase, unlocked_until, users(name)').order('phase'),
    supabase.from('users').select('id, name').eq('is_admin', false).order('name'),
  ])

  const deadlineMap = new Map(deadlines?.map(d => [d.phase, d.deadline_at]) ?? [])

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
                  <th className="px-4 py-3 text-left font-medium text-zinc-600 w-40">Fase</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Prazo (UTC)</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600"></th>
                </tr>
              </thead>
              <tbody>
                {PHASES.map(p => (
                  <DeadlineRow
                    key={p.value}
                    phase={p.value}
                    label={p.label}
                    currentDeadline={deadlineMap.get(p.value) ?? null}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Participant exceptions */}
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-zinc-900">Exceções de Prazo</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Permite que um participante específico edite palpites além do prazo global até o horário definido.
            </p>
          </div>

          <div className="mb-6 rounded-lg border border-zinc-200 bg-white px-4 py-4">
            <ExceptionForm participants={participants ?? []} />
          </div>

          {exceptions && exceptions.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Participante</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Fase</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Liberar até (UTC)</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {exceptions.map(ex => {
                    const isActive = new Date(ex.unlocked_until) > new Date()
                    const deleteAction = deleteParticipantException.bind(null, ex.id)
                    const name = Array.isArray(ex.users) ? ex.users[0]?.name : (ex.users as { name: string } | null)?.name
                    return (
                      <tr key={ex.id} className={isActive ? '' : 'opacity-50'}>
                        <td className="px-4 py-3 font-medium text-zinc-900">{name ?? '—'}</td>
                        <td className="px-4 py-3 text-zinc-600">{PHASE_LABELS[ex.phase] ?? ex.phase}</td>
                        <td className="px-4 py-3 text-zinc-500 text-xs">
                          {new Date(ex.unlocked_until).toISOString().slice(0, 16).replace('T', ' ')}
                          {isActive && (
                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-green-700 font-medium">
                              ativa
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <form action={deleteAction}>
                            <button
                              type="submit"
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Remover
                            </button>
                          </form>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-400">
              Nenhuma exceção cadastrada.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
