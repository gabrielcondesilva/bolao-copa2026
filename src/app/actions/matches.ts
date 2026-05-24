'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type ActionResult = { error: string } | { success: true } | undefined

export async function updateMatchResult(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/')

  const matchId = formData.get('matchId') as string
  const homeScore = parseInt(formData.get('homeScore') as string, 10)
  const awayScore = parseInt(formData.get('awayScore') as string, 10)
  const wentToExtraTime = formData.get('wentToExtraTime') === 'on'

  if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
    return { error: 'Placar inválido.' }
  }

  const { error } = await supabase
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore, went_to_extra_time: wentToExtraTime, is_finished: true })
    .eq('id', matchId)

  if (error) return { error: error.message }

  revalidatePath('/admin/jogos')
  return { success: true }
}
