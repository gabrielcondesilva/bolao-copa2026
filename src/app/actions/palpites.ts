'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/types'

type Phase = Database['public']['Enums']['phase']

async function deadlinePassed(
  supabase: SupabaseClient<Database>,
  userId: string,
  phase: Phase,
): Promise<boolean> {
  const now = new Date().toISOString()
  const [{ data: deadline }, { data: exception }] = await Promise.all([
    supabase.from('phase_deadlines').select('deadline_at').eq('phase', phase).maybeSingle(),
    supabase.from('participant_exceptions').select('unlocked_until').eq('user_id', userId).eq('phase', phase).maybeSingle(),
  ])
  if (!deadline || deadline.deadline_at > now) return false
  return !exception || exception.unlocked_until <= now
}

export async function savePalpiteJogo(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<{ error: string } | { success: true }> {
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
    return { error: 'Placar inválido.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: match } = await supabase.from('matches').select('phase').eq('id', matchId).single()
  if (!match) return { error: 'Jogo não encontrado.' }
  if (await deadlinePassed(supabase, user.id, match.phase)) return { error: 'Prazo encerrado.' }

  const { error } = await supabase
    .from('palpites_jogos')
    .upsert(
      {
        user_id: user.id,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,match_id' },
    )

  if (error) return { error: error.message }
  revalidatePath('/palpites/bracket')
  return { success: true }
}

type FinalResult = { error: string } | { success: true } | undefined

export async function savePalpiteFinal(
  _prev: FinalResult,
  formData: FormData,
): Promise<FinalResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }
  if (await deadlinePassed(supabase, user.id, 'group_stage')) return { error: 'Prazo encerrado.' }

  const get = (key: string) => (formData.get(key) as string) || null

  const { error } = await supabase
    .from('palpites_finais')
    .upsert(
      {
        user_id: user.id,
        champion_team_id: get('champion_team_id'),
        runner_up_team_id: get('runner_up_team_id'),
        third_team_id: get('third_team_id'),
        fourth_team_id: get('fourth_team_id'),
        top_scorer: get('top_scorer'),
        best_player: get('best_player'),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (error) return { error: error.message }
  return { success: true }
}

export async function savePalpitesJogoBatch(
  items: { matchId: string; homeScore: number; awayScore: number }[],
): Promise<{ error: string } | { success: true }> {
  if (items.length === 0) return { success: true }

  for (const { homeScore, awayScore } of items) {
    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
      return { error: 'Placar inválido.' }
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: matchRows } = await supabase
    .from('matches').select('id, phase').in('id', items.map(i => i.matchId))
  const phases = [...new Set((matchRows ?? []).map(m => m.phase))] as Phase[]
  for (const phase of phases) {
    if (await deadlinePassed(supabase, user.id, phase)) return { error: 'Prazo encerrado.' }
  }

  const { error } = await supabase
    .from('palpites_jogos')
    .upsert(
      items.map(({ matchId, homeScore, awayScore }) => ({
        user_id: user.id,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'user_id,match_id' },
    )

  if (error) return { error: error.message }
  revalidatePath('/palpites/bracket')
  return { success: true }
}

export async function savePalpiteFinalDirect(data: {
  champion_team_id: string | null
  runner_up_team_id: string | null
  third_team_id: string | null
  fourth_team_id: string | null
  top_scorer: string | null
  best_player: string | null
  bracket_picks?: Json | null
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }
  if (await deadlinePassed(supabase, user.id, 'group_stage')) return { error: 'Prazo encerrado.' }

  const { error } = await supabase
    .from('palpites_finais')
    .upsert(
      { user_id: user.id, ...data, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )

  if (error) return { error: error.message }
  revalidatePath('/palpites/bracket')
  return { success: true }
}
