import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/')

  const { data: participants } = await supabase
    .from('users')
    .select('id, name, is_admin, created_at')
    .order('name')

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-zinc-900">Painel Admin</h1>
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-sm font-medium text-green-700">
            Participantes
          </Link>
          <Link href="/admin/jogos" className="text-sm text-zinc-500 hover:text-zinc-700">
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

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">
            Participantes ({participants?.length ?? 0})
          </h2>
          <Link
            href="/admin/participantes/novo"
            className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
          >
            + Novo participante
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Perfil</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Cadastrado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {participants?.map(p => (
                <tr key={p.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">{p.name}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {p.is_admin ? 'Admin' : 'Participante'}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
              {!participants?.length && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-zinc-400">
                    Nenhum participante cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
