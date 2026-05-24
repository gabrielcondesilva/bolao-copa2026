import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { deleteBracketOverride, deleteClassifierOverride } from '@/app/actions/overrides'
import { BracketOverrideForm } from './bracket-override-form'
import { ClassifierOverrideForm } from './classifier-override-form'

const PHASE_LABEL: Record<string, string> = {
  group_stage:   'Fase de Grupos',
  round_of_32:   '16-avos',
  round_of_16:   'Oitavas',
  quarterfinals: 'Quartas',
  semifinals:    'Semis',
  third_place:   '3º Lugar',
  final:         'Final',
}

export default async function AdminClassificadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/')
  const admin = createAdminClient()
  const [
    { data: teams },
    { data: bracketOverrides },
    { data: classifierOverrides },
  ] = await Promise.all([
    admin.from('teams').select('id, name').order('name'),
    admin.from('bracket_overrides').select('*').order('phase').order('match_slot'),
    admin.from('classifier_overrides').select('*').order('phase'),
  ])

  const teamName = new Map((teams ?? []).map(t => [t.id, t.name]))

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-zinc-900">Painel Admin</h1>
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-700">Participantes</Link>
          <Link href="/admin/jogos" className="text-sm text-zinc-500 hover:text-zinc-700">Jogos</Link>
          <Link href="/admin/importar" className="text-sm text-zinc-500 hover:text-zinc-700">Importar</Link>
          <Link href="/admin/prazos" className="text-sm text-zinc-500 hover:text-zinc-700">Prazos</Link>
          <Link href="/admin/classificados" className="text-sm font-medium text-green-700">Classificados</Link>
          <form action={logout}>
            <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-700">Sair</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-6 py-8">

        {/* ── Bracket Overrides ─────────────────────────────────────────────── */}
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-zinc-900">Override de Bracket</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Define manualmente quais times jogam em cada slot de uma fase eliminatória.
              Sobrescreve o bracket derivado automaticamente pelo simulador.
            </p>
          </div>

          {/* Existing */}
          {(bracketOverrides ?? []).length > 0 && (
            <div className="mb-6 overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Fase</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Slot</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Casa</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Visitante</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {(bracketOverrides ?? []).map(o => (
                    <tr key={o.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-2.5 text-zinc-700">{PHASE_LABEL[o.phase] ?? o.phase}</td>
                      <td className="px-4 py-2.5 text-zinc-700">{o.match_slot}</td>
                      <td className="px-4 py-2.5 text-zinc-900 font-medium">
                        {o.home_team_id ? (teamName.get(o.home_team_id) ?? '?') : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-900 font-medium">
                        {o.away_team_id ? (teamName.get(o.away_team_id) ?? '?') : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <form action={deleteBracketOverride.bind(null, o.id)}>
                          <button type="submit" className="text-xs text-red-500 hover:text-red-700">
                            Remover
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add form */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Adicionar / Atualizar Override
            </p>
            <BracketOverrideForm teams={teams ?? []} />
          </div>
        </section>

        {/* ── Classifier Overrides ──────────────────────────────────────────── */}
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-zinc-900">Override de Classificados</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Define a ordem dos times classificados em uma fase quando o critério automático
              não consegue desempatar (ex: melhores 3ºs colocados da fase de grupos).
            </p>
          </div>

          {/* Existing */}
          {(classifierOverrides ?? []).length > 0 && (
            <div className="mb-6 overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Fase</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Times (em ordem)</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {(classifierOverrides ?? []).map(o => (
                    <tr key={o.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 text-zinc-700 align-top whitespace-nowrap">
                        {PHASE_LABEL[o.phase] ?? o.phase}
                      </td>
                      <td className="px-4 py-3">
                        <ol className="list-decimal list-inside space-y-0.5 text-xs text-zinc-700">
                          {o.ordered_team_ids.map((id, i) => (
                            <li key={i}>{teamName.get(id) ?? id}</li>
                          ))}
                        </ol>
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <form action={deleteClassifierOverride.bind(null, o.id)}>
                          <button type="submit" className="text-xs text-red-500 hover:text-red-700">
                            Remover
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add form */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Adicionar / Atualizar Override
            </p>
            <ClassifierOverrideForm teams={teams ?? []} />
          </div>
        </section>
      </main>
    </div>
  )
}
