import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { ImportForm } from './import-form'

export default async function AdminImportarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/')

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
          <Link href="/admin/importar" className="text-sm font-medium text-green-700">
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
        <div className="mb-6">
          <h2 className="text-base font-semibold text-zinc-900">Importar jogos via API</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Busca dados da football-data.org para a fase selecionada. Atualiza horários, equipes e
            resultados de jogos finalizados. Rode após cada rodada para manter ranking e grupos atualizados.
          </p>
        </div>

        <ImportForm />
      </main>
    </div>
  )
}
