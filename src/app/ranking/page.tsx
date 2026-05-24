import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { computeRanking } from '@/lib/ranking'
import { RankingTable } from './ranking-table'

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Profile uses session client (RLS) — only needs own row
  const { data: profile } = await supabase
    .from('users').select('name, is_admin').eq('id', user.id).single()

  // Ranking data uses admin client — bypasses RLS so scores are always complete
  // regardless of whether palpites are visible to the current user's session.
  const admin = createAdminClient()
  const [
    { data: participants },
    { data: allMatches },
    { data: allPalpitesJogos },
    { data: allPalpitesFinais },
    { data: teams },
    { data: bracketOverrides },
    { data: classifierOverrides },
  ] = await Promise.all([
    admin.from('users').select('id, name').order('name'),
    admin.from('matches').select('*'),
    admin.from('palpites_jogos').select('*'),
    admin.from('palpites_finais').select('*'),
    admin.from('teams').select('*'),
    admin.from('bracket_overrides').select('*'),
    admin.from('classifier_overrides').select('*'),
  ])

  const entries = computeRanking({
    participants: participants ?? [],
    allMatches: allMatches ?? [],
    allPalpitesJogos: allPalpitesJogos ?? [],
    allPalpitesFinais: allPalpitesFinais ?? [],
    teams: teams ?? [],
    bracketOverrides: bracketOverrides ?? [],
    classifierOverrides: classifierOverrides ?? [],
  })

  return (
    <AppShell profile={profile}>
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-base font-bold text-zinc-900">Ranking</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Atualizado em tempo real conforme jogos são encerrados.</p>
        </div>

        <RankingTable entries={entries} />

        {entries.length > 0 && (
          <div className="rounded-lg border border-zinc-100 bg-white px-4 py-3 text-xs text-zinc-500 space-y-0.5">
            <p className="font-semibold text-zinc-700 mb-1">Critérios de desempate</p>
            <p>1. Placares Cravados (10 pts)</p>
            <p>2. Resultados Corretos (5 pts)</p>
            <p>3. Pontos na Fase de Grupos</p>
            <p>4. Pontos nas Fases Eliminatórias</p>
          </div>
        )}
      </main>
    </AppShell>
  )
}
