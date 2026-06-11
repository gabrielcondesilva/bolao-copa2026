import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { computeRanking } from '@/lib/ranking'
import { RankingTable } from './ranking-table'

export const dynamic = 'force-dynamic'

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

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Como funciona a pontuação</p>
          </div>
          <div className="divide-y divide-zinc-100 text-xs text-zinc-600">

            {/* Palpites de Jogo */}
            <div className="px-4 py-3 space-y-1.5">
              <p className="font-semibold text-zinc-800 mb-0.5">1. Palpites de Jogo</p>
              <p className="text-zinc-400 mb-2">Você prevê o placar de cada partida — fase de grupos e eliminatórias. Pontos por jogo:</p>
              <ScoreRow pts="10 pts" label="Placar Cravado" desc="acertou o placar exato (ex: 2×1 = 2×1)" highlight />
              <ScoreRow pts="5 pts"  label="Resultado Correto" desc="acertou vitória, derrota ou empate — mas o placar foi diferente" />
              <ScoreRow pts="0 pts"  label="Resultado Errado" desc="errou o resultado" muted />
            </div>

            {/* Classificados Derivados */}
            <div className="px-4 py-3 space-y-1.5">
              <p className="font-semibold text-zinc-800 mb-0.5">2. Classificados</p>
              <p className="text-zinc-400 mb-2">
                Baseado <span className="font-medium text-zinc-500">apenas nos seus 72 palpites da fase de grupos</span>, o sistema simula quem avança em cada fase eliminatória.
                A cada seleção que você acertou classificar, você ganha pontos — e o valor aumenta conforme a fase avança.
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <ScoreRow pts="2 pts"  label="16-avos de final" />
                <ScoreRow pts="8 pts"  label="Semifinais" />
                <ScoreRow pts="4 pts"  label="Oitavas de final" />
                <ScoreRow pts="10 pts" label="Disputa de 3º lugar" />
                <ScoreRow pts="6 pts"  label="Quartas de final" />
                <ScoreRow pts="12 pts" label="Finalistas" />
              </div>
              <p className="text-zinc-400 pt-1">
                Ex: se nos seus palpites o Brasil avança até as Oitavas e ele realmente avançar, você ganha 2 pts (16-avos) + 4 pts (Oitavas) = 6 pts só com o Brasil. Os palpites dos jogos eliminatórios em si só valem cravado/resultado.
              </p>
            </div>

            {/* Palpite Final */}
            <div className="px-4 py-3 space-y-1.5">
              <p className="font-semibold text-zinc-800 mb-0.5">3. Palpite Final</p>
              <p className="text-zinc-400 mb-2">Preenchido uma única vez antes do torneio. Pontos fixos por acerto:</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <ScoreRow pts="40 pts" label="Campeão" highlight />
                <ScoreRow pts="10 pts" label="Artilheiro" />
                <ScoreRow pts="20 pts" label="Vice-campeão" />
                <ScoreRow pts="10 pts" label="Melhor jogador" />
                <ScoreRow pts="10 pts" label="Terceiro lugar" />
                <ScoreRow pts="5 pts"  label="Quarto lugar" />
              </div>
            </div>

            {/* Desempate + dica */}
            <div className="px-4 py-3 space-y-2 text-zinc-500">
              <div>
                <p className="font-semibold text-zinc-700 mb-1">Critérios de desempate</p>
                <p>1. Placares Cravados · 2. Resultados Corretos · 3. Pts na Fase de Grupos · 4. Pts nas Eliminatórias</p>
              </div>
              <div className="pt-1 space-y-0.5 border-t border-zinc-100">
                <p>Clique no nome de um participante na tabela para ver seus palpites.</p>
                <p>Os palpites ficam visíveis somente após o fechamento do prazo da fase atual.</p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </AppShell>
  )
}

function ScoreRow({
  pts, label, desc, highlight, muted,
}: {
  pts: string
  label: string
  desc?: string
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`w-14 shrink-0 font-bold tabular-nums ${highlight ? 'text-green-700' : muted ? 'text-zinc-400' : 'text-zinc-700'}`}>
        {pts}
      </span>
      <span className={muted ? 'text-zinc-400' : 'text-zinc-600'}>
        {label}
        {desc && <span className="text-zinc-400"> — {desc}</span>}
      </span>
    </div>
  )
}
