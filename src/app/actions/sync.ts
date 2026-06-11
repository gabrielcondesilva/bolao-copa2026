'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type Phase = 'group_stage' | 'round_of_32' | 'round_of_16' | 'quarterfinals' | 'semifinals' | 'third_place' | 'final'

const PHASE_TO_STAGE: Record<Phase, string> = {
  group_stage:   'GROUP_STAGE',
  round_of_32:   'ROUND_OF_32',
  round_of_16:   'ROUND_OF_16',
  quarterfinals: 'QUARTER_FINALS',
  semifinals:    'SEMI_FINALS',
  third_place:   'THIRD_PLACE',
  final:         'FINAL',
}

type ApiMatch = {
  id: number
  status: string
  homeTeam: { id: number; tla: string } | null
  awayTeam: { id: number; tla: string } | null
  score: {
    duration: string
    fullTime: { home: number | null; away: number | null }
  }
}

export type SyncResult = {
  updated: number
  notFinished: number
  errors: string[]
  timestamp: string
}

// Finds phases with past unfinished matches and fetches results from the API.
// Matches by external_id (linked) or by team TLA pair (unlinked — sets external_id as side-effect).
export async function syncResults(
  _prev: SyncResult | { error: string } | undefined,
): Promise<SyncResult | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/')

  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) return { error: 'FOOTBALL_DATA_API_KEY não configurada.' }

  const admin = createAdminClient()

  // All unfinished matches past their scheduled time
  const { data: pending } = await admin
    .from('matches')
    .select('id, phase, external_id, home_team_id, away_team_id')
    .eq('is_finished', false)
    .lt('scheduled_at', new Date().toISOString())

  if (!pending || pending.length === 0) {
    return { updated: 0, notFinished: 0, errors: [], timestamp: new Date().toISOString() }
  }

  // Two lookup maps: by API external_id, and by "phase:homeUuid:awayUuid" for unlinked matches
  const byExtId = new Map<number, typeof pending[0]>()
  const byTeams = new Map<string, typeof pending[0]>()

  for (const m of pending) {
    if (m.external_id) {
      byExtId.set(m.external_id, m)
    } else if (m.home_team_id && m.away_team_id) {
      byTeams.set(`${m.phase}:${m.home_team_id}:${m.away_team_id}`, m)
    }
  }

  // Build TLA → team UUID map for unlinked matches (so we can match by API tla)
  const unlinkedTeamIds = [...new Set(
    [...byTeams.values()].flatMap(m => [m.home_team_id, m.away_team_id]).filter(Boolean),
  )] as string[]

  const { data: teamRows } = unlinkedTeamIds.length > 0
    ? await admin.from('teams').select('id, country_code').in('id', unlinkedTeamIds)
    : { data: [] as { id: string; country_code: string | null }[] }

  const tlaToUuid = new Map(
    (teamRows ?? [])
      .filter(t => t.country_code)
      .map(t => [t.country_code!.toUpperCase(), t.id]),
  )

  const phases = [...new Set(pending.map(m => m.phase as Phase))]

  let updated = 0, notFinished = 0
  const errors: string[] = []

  for (const phase of phases) {
    const stage = PHASE_TO_STAGE[phase]
    if (!stage) continue

    let apiMatches: ApiMatch[]
    try {
      const res = await fetch(
        `https://api.football-data.org/v4/competitions/WC/matches?season=2026&stage=${stage}`,
        { headers: { 'X-Auth-Token': apiKey }, cache: 'no-store' },
      )
      if (!res.ok) { errors.push(`Fase ${phase}: API retornou ${res.status}`); continue }
      const data = await res.json()
      apiMatches = data.matches ?? []
    } catch {
      errors.push(`Fase ${phase}: falha ao contactar API`)
      continue
    }

    for (const m of apiMatches) {
      // Find matching DB row: first by external_id, then by team TLA pair
      let dbMatch = byExtId.get(m.id)

      if (!dbMatch && m.homeTeam?.tla && m.awayTeam?.tla) {
        const homeUuid = tlaToUuid.get(m.homeTeam.tla.toUpperCase())
        const awayUuid = tlaToUuid.get(m.awayTeam.tla.toUpperCase())
        if (homeUuid && awayUuid) {
          dbMatch = byTeams.get(`${phase}:${homeUuid}:${awayUuid}`)
        }
      }

      if (!dbMatch) continue  // this API match has no pending DB counterpart

      if (m.status !== 'FINISHED' && m.status !== 'AWARDED') {
        notFinished++
        continue
      }

      if (m.score.fullTime.home === null || m.score.fullTime.away === null) {
        errors.push(`Jogo ${m.id}: API retornou FINISHED mas sem placar`)
        continue
      }

      const wentToExtraTime =
        m.score.duration === 'EXTRA_TIME' || m.score.duration === 'PENALTY_SHOOTOUT'

      const { error } = await admin
        .from('matches')
        .update({
          home_score: m.score.fullTime.home,
          away_score: m.score.fullTime.away,
          is_finished: true,
          went_to_extra_time: wentToExtraTime,
          external_id: m.id,  // link the match for future syncs
        })
        .eq('id', dbMatch.id)

      if (error) errors.push(`Jogo ${m.id}: ${error.message}`)
      else updated++
    }
  }

  revalidatePath('/admin/jogos')
  revalidatePath('/jogos')
  revalidatePath('/classificacao')
  revalidatePath('/ranking')
  revalidatePath('/ranking/[userId]', 'page')

  return { updated, notFinished, errors, timestamp: new Date().toISOString() }
}
