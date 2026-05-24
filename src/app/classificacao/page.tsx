import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { StandingsView } from './standings-view'

export default async function ClassificacaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: matches }, { data: teams }] = await Promise.all([
    supabase.from('users').select('name, is_admin').eq('id', user.id).single(),
    supabase.from('matches').select('*').eq('phase', 'group_stage').order('scheduled_at'),
    supabase.from('teams').select('*').order('group').order('name'),
  ])

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-base font-bold text-zinc-900">Bolão Copa 2026</span>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden text-sm text-zinc-600 sm:block">{profile?.name}</span>
            {profile?.is_admin && (
              <Link href="/admin" className="text-sm font-medium text-green-700 hover:text-green-800">
                Admin
              </Link>
            )}
            <form action={logout}>
              <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-700">
                Sair
              </button>
            </form>
          </div>
        </div>

        <div className="mx-auto max-w-3xl border-t border-zinc-100 px-4 sm:px-6">
          <nav className="-mb-px flex gap-0">
            <TabLink href="/jogos">Jogos</TabLink>
            <TabLink href="/classificacao" active>Classificação</TabLink>
            <TabLink href="/palpites">Palpites</TabLink>
            <TabLink href="/ranking">Ranking</TabLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center gap-3">
          <p className="text-xs text-zinc-400">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-100 border border-green-200 mr-1 align-middle" />
            Classificado direto
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-100 border border-amber-200 mx-1 ml-3 align-middle" />
            Possível 3º melhor
          </p>
        </div>
        <StandingsView initialMatches={matches ?? []} teams={teams ?? []} />
      </main>
    </div>
  )
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-green-700 text-green-700'
          : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
      }`}
    >
      {children}
    </Link>
  )
}
