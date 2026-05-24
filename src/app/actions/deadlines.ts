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
  if (!user?.app_metadata?.is_admin) redirect('/')

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

export async function upsertParticipantException(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.app_metadata?.is_admin) redirect('/')

  const userId = formData.get('user_id') as string
  const phase = formData.get('phase') as Phase
  const unlockedUntil = formData.get('unlocked_until') as string

  if (!userId || !phase || !unlockedUntil) return { error: 'Todos os campos são obrigatórios.' }

  const isoString = new Date(unlockedUntil + 'Z').toISOString()

  const admin = createAdminClient()
  const { error } = await admin
    .from('participant_exceptions')
    .upsert(
      { user_id: userId, phase, unlocked_until: isoString },
      { onConflict: 'user_id,phase' },
    )

  if (error) return { error: error.message }
  revalidatePath('/admin/prazos')
  return { success: true }
}

export async function deleteParticipantException(id: string, _formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.app_metadata?.is_admin) redirect('/')

  const admin = createAdminClient()
  await admin.from('participant_exceptions').delete().eq('id', id)
  revalidatePath('/admin/prazos')
}
