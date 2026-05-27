import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
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
    <AppShell profile={profile}>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center gap-3">
          <p className="text-xs text-zinc-400">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-100 border border-green-200 mr-1 align-middle" />
            Classificado direto
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-100 border border-amber-200 mx-1 ml-3 align-middle" />
            3º melhor classificado
          </p>
        </div>
        <StandingsView initialMatches={matches ?? []} teams={teams ?? []} />
      </main>
    </AppShell>
  )
}
