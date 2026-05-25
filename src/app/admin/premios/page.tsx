import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { toggleAward } from '@/app/actions/awards'

export default async function AdminPremiosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/')

  const admin = createAdminClient()
  const { data: palpites } = await admin
    .from('palpites_finais')
    .select('user_id, top_scorer, best_player, artilheiro_correct, best_player_correct, users(name)')
    .order('user_id')

  const rows = (palpites ?? [])
    .filter(p => p.top_scorer || p.best_player)
    .map(p => ({
      userId: p.user_id,
      name: Array.isArray(p.users) ? p.users[0]?.name : (p.users as { name: string } | null)?.name ?? '—',
      topScorer: p.top_scorer ?? '—',
      bestPlayer: p.best_player ?? '—',
      artilheiroCorrect: p.artilheiro_correct,
      bestPlayerCorrect: p.best_player_correct,
    }))

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-zinc-900">Painel Admin</h1>
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-700">Participantes</Link>
          <Link href="/admin/jogos" className="text-sm text-zinc-500 hover:text-zinc-700">Jogos</Link>
          <Link href="/admin/importar" className="text-sm text-zinc-500 hover:text-zinc-700">Importar</Link>
          <Link href="/admin/prazos" className="text-sm text-zinc-500 hover:text-zinc-700">Prazos</Link>
          <Link href="/admin/classificados" className="text-sm text-zinc-500 hover:text-zinc-700">Classificados</Link>
          <Link href="/admin/premios" className="text-sm font-medium text-green-700">Prêmios</Link>
          <Link href="/jogos" className="text-sm font-medium text-blue-600 hover:text-blue-700">Ver bolão →</Link>
          <form action={logout}>
            <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-700">Sair</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-zinc-900">Artilheiro e Craque do Torneio</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Marque quem acertou. Cada acerto vale 10 pontos.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-400">
            Nenhum participante preencheu artilheiro ou craque ainda.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Participante</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Artilheiro</th>
                  <th className="px-4 py-3 text-center font-medium text-zinc-600">Acertou?</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Craque</th>
                  <th className="px-4 py-3 text-center font-medium text-zinc-600">Acertou?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map(row => {
                  const toggleArtilheiro = toggleAward.bind(null, row.userId, 'artilheiro_correct', !row.artilheiroCorrect)
                  const toggleBestPlayer = toggleAward.bind(null, row.userId, 'best_player_correct', !row.bestPlayerCorrect)
                  return (
                    <tr key={row.userId} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{row.name}</td>
                      <td className="px-4 py-3 text-zinc-700">{row.topScorer}</td>
                      <td className="px-4 py-3 text-center">
                        {row.artilheiroCorrect ? (
                          <form action={toggleArtilheiro}>
                            <button type="submit" className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-200">
                              ✓ Acertou
                            </button>
                          </form>
                        ) : (
                          <form action={toggleArtilheiro}>
                            <button type="submit" className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-400 hover:border-green-400 hover:text-green-600">
                              Acertou?
                            </button>
                          </form>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{row.bestPlayer}</td>
                      <td className="px-4 py-3 text-center">
                        {row.bestPlayerCorrect ? (
                          <form action={toggleBestPlayer}>
                            <button type="submit" className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-200">
                              ✓ Acertou
                            </button>
                          </form>
                        ) : (
                          <form action={toggleBestPlayer}>
                            <button type="submit" className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-400 hover:border-green-400 hover:text-green-600">
                              Acertou?
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
