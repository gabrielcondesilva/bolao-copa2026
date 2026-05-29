'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

type ActionResult = { error: string } | undefined

export async function login(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: 'E-mail ou senha inválidos.' }
  if (data.user?.app_metadata?.must_change_password) redirect('/alterar-senha')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordReset(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/alterar-senha`
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updatePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string
  if (password !== confirm) return { error: 'As senhas não coincidem.' }
  if (password.length < 8) return { error: 'A senha deve ter ao menos 8 caracteres.' }

  // Clear flag before issuing new token so the new JWT won't carry it
  const admin = createAdminClient()
  await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, must_change_password: false },
  })

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  redirect('/')
}

export async function createParticipant(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/')

  const name = (formData.get('name') as string).trim()
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string

  if (!name || !email || !password) return { error: 'Todos os campos são obrigatórios.' }

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { must_change_password: true, is_admin: false },
  })

  if (error || !data.user) return { error: error?.message ?? 'Erro ao criar participante.' }

  const { error: insertError } = await admin.from('users').insert({
    id: data.user.id,
    name,
    is_admin: false,
  })

  if (insertError) {
    await admin.auth.admin.deleteUser(data.user.id)
    return { error: insertError.message }
  }

  redirect('/admin')
}
