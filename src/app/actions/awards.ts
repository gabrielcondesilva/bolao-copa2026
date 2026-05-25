'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type AwardField = 'artilheiro_correct' | 'best_player_correct'

export async function toggleAward(
  userId: string,
  field: AwardField,
  value: boolean,
  _formData: FormData,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/')

  const admin = createAdminClient()
  await admin
    .from('palpites_finais')
    .update({ [field]: value } as { artilheiro_correct?: boolean; best_player_correct?: boolean })
    .eq('user_id', userId)

  revalidatePath('/admin/premios')
}
