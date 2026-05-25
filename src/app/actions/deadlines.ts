'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/supabase/types'

type Phase = Database['public']['Enums']['phase']
type ActionResult = { error: string } | { success: true } | undefined

export async function upsertPhaseDeadline(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/')

  const phase = formData.get('phase') as Phase
  const deadlineAt = formData.get('deadline_at') as string
  if (!deadlineAt) return { error: 'Data obrigatória.' }

  // Treat datetime-local value as UTC
  const isoString = new Date(deadlineAt + 'Z').toISOString()

  const admin = createAdminClient()
  const { error } = await admin
    .from('phase_deadlines')
    .upsert({ phase, deadline_at: isoString }, { onConflict: 'phase' })

  if (error) return { error: error.message }
  revalidatePath('/admin/prazos')
  return { success: true }
}

export async function upsertGlobalException(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/')

  const phase = formData.get('phase') as Phase
  const unlockedUntil = formData.get('unlocked_until') as string
  if (!phase || !unlockedUntil) return { error: 'Todos os campos são obrigatórios.' }

  const isoString = new Date(unlockedUntil + 'Z').toISOString()

  const admin = createAdminClient()
  const { data: participants } = await admin.from('users').select('id').eq('is_admin', false)
  if (!participants?.length) return { error: 'Nenhum participante encontrado.' }

  // Remove exceções anteriores para esta fase e recria para todos
  await admin.from('participant_exceptions').delete().eq('phase', phase)
  const rows = participants.map(p => ({ user_id: p.id, phase, unlocked_until: isoString }))
  const { error } = await admin.from('participant_exceptions').insert(rows)

  if (error) return { error: error.message }
  revalidatePath('/admin/prazos')
  return { success: true }
}

export async function deleteGlobalExceptions(phase: string, _formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/')

  const admin = createAdminClient()
  await admin.from('participant_exceptions').delete().eq('phase', phase)
  revalidatePath('/admin/prazos')
}
