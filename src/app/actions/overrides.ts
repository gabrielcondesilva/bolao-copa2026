'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/supabase/types'

type Phase = Database['public']['Enums']['phase']
type ActionResult = { error: string } | { success: true } | undefined

async function assertAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  return !!data?.is_admin
}

export async function saveBracketOverride(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await assertAdmin())) return { error: 'Não autorizado.' }

  const phase = formData.get('phase') as Phase
  const matchSlot = parseInt(formData.get('match_slot') as string, 10)
  const homeTeamId = (formData.get('home_team_id') as string) || null
  const awayTeamId = (formData.get('away_team_id') as string) || null

  if (!phase || isNaN(matchSlot) || matchSlot < 0) return { error: 'Dados inválidos.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('bracket_overrides')
    .upsert(
      { phase, match_slot: matchSlot, home_team_id: homeTeamId, away_team_id: awayTeamId },
      { onConflict: 'phase,match_slot' },
    )

  if (error) return { error: error.message }
  revalidatePath('/admin/classificados')
  return { success: true }
}

export async function deleteBracketOverride(id: string, _: FormData): Promise<void> {
  if (!(await assertAdmin())) return
  const admin = createAdminClient()
  await admin.from('bracket_overrides').delete().eq('id', id)
  revalidatePath('/admin/classificados')
}

export async function saveClassifierOverride(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await assertAdmin())) return { error: 'Não autorizado.' }

  const phase = formData.get('phase') as Phase
  const teamIds = (formData.getAll('team_id') as string[]).filter(Boolean)

  if (!phase) return { error: 'Fase obrigatória.' }
  if (teamIds.length === 0) return { error: 'Selecione pelo menos um time.' }

  const uniqueIds = [...new Set(teamIds)]
  if (uniqueIds.length !== teamIds.length) return { error: 'Times duplicados na lista.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('classifier_overrides')
    .upsert(
      { phase, ordered_team_ids: teamIds },
      { onConflict: 'phase' },
    )

  if (error) return { error: error.message }
  revalidatePath('/admin/classificados')
  return { success: true }
}

export async function deleteClassifierOverride(id: string, _: FormData): Promise<void> {
  if (!(await assertAdmin())) return
  const admin = createAdminClient()
  await admin.from('classifier_overrides').delete().eq('id', id)
  revalidatePath('/admin/classificados')
}
