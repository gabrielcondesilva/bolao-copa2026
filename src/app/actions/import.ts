'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type Phase = 'group_stage' | 'round_of_32' | 'round_of_16' | 'quarterfinals' | 'semifinals' | 'third_place' | 'final'

const PHASE_TO_STAGE: Record<Phase, string> = {
  group_stage: 'GROUP_STAGE',
  round_of_32: 'ROUND_OF_32',
  round_of_16: 'ROUND_OF_16',
  quarterfinals: 'QUARTER_FINALS',
  semifinals: 'SEMI_FINALS',
  third_place: 'THIRD_PLACE',
  final: 'FINAL',
}

const VALID_PHASES: Phase[] = [
  'group_stage', 'round_of_32', 'round_of_16',
  'quarterfinals', 'semifinals', 'third_place', 'final',
]

const VALID_GROUPS = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'])

export type ImportResult = {
  imported: number
  updated: number
  skipped: number
  teamsUpserted: number
  errors: string[]
  phase: string
  timestamp: string
}

type ApiTeam = { id: number; name: string; tla: string }
type ApiMatch = {
  id: number
  stage: string
  group: string | null
  utcDate: string
  status: string
  venue: string | null
  homeTeam: ApiTeam | null
  awayTeam: ApiTeam | null
  score: { fullTime: { home: number | null; away: number | null } }
}

export async function importMatches(
  _prev: ImportResult | { error: string } | undefined,
  formData: FormData,
): Promise<ImportResult | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/')

  const phase = formData.get('phase') as Phase
  if (!VALID_PHASES.includes(phase)) return { error: 'Fase inválida.' }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) return { error: 'FOOTBALL_DATA_API_KEY não configurada no servidor.' }

  const stage = PHASE_TO_STAGE[phase]

  let apiMatches: ApiMatch[]
  try {
    const res = await fetch(
      `https://api.football-data.org/v4/competitions/WC/matches?season=2026&stage=${stage}`,
      { headers: { 'X-Auth-Token': apiKey }, cache: 'no-store' },
    )
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { error: `API retornou ${res.status}: ${body.slice(0, 200)}` }
    }
    const data = await res.json()
    apiMatches = data.matches ?? []
  } catch (err) {
    return { error: `Falha ao contactar API: ${err instanceof Error ? err.message : String(err)}` }
  }

  if (apiMatches.length === 0) {
    return { imported: 0, updated: 0, skipped: 0, teamsUpserted: 0, errors: [], phase, timestamp: new Date().toISOString() }
  }

  const admin = createAdminClient()
  const errors: string[] = []
  let imported = 0, updated = 0, skipped = 0, teamsUpserted = 0

  // Build unique team set, capturing group from group-stage matches when available
  const uniqueTeams = new Map<number, ApiTeam & { matchGroup?: string }>()
  for (const m of apiMatches) {
    const grp = m.group?.replace('GROUP_', '')
    for (const apiTeam of [m.homeTeam, m.awayTeam]) {
      if (!apiTeam?.id) continue
      const prev = uniqueTeams.get(apiTeam.id)
      if (!prev || (!prev.matchGroup && grp && VALID_GROUPS.has(grp))) {
        uniqueTeams.set(apiTeam.id, { ...apiTeam, matchGroup: grp && VALID_GROUPS.has(grp) ? grp : prev?.matchGroup })
      }
    }
  }

  // Upsert teams and build external_id → internal UUID map
  const teamIdMap = new Map<number, string>()

  for (const [extId, apiTeam] of uniqueTeams) {
    const { data: byExtId } = await admin
      .from('teams')
      .select('id')
      .eq('external_id', extId)
      .maybeSingle()

    if (byExtId) {
      await admin.from('teams').update({ name: apiTeam.name }).eq('id', byExtId.id)
      teamIdMap.set(extId, byExtId.id)
      teamsUpserted++
      continue
    }

    const { data: byCode } = await admin
      .from('teams')
      .select('id')
      .eq('country_code', apiTeam.tla)
      .maybeSingle()

    if (byCode) {
      await admin.from('teams').update({ external_id: extId, name: apiTeam.name }).eq('id', byCode.id)
      teamIdMap.set(extId, byCode.id)
      teamsUpserted++
      continue
    }

    // New team — create with placeholder ranking; group defaults to 'A' for knockout-only teams
    const groupChar = apiTeam.matchGroup ?? 'A'
    const { data: created, error: createErr } = await admin
      .from('teams')
      .insert({ name: apiTeam.name, country_code: apiTeam.tla, group: groupChar, fifa_ranking_reference: 999, external_id: extId })
      .select('id')
      .single()

    if (createErr) {
      errors.push(`Equipe ${apiTeam.name}: ${createErr.message}`)
    } else if (created) {
      teamIdMap.set(extId, created.id)
      teamsUpserted++
    }
  }

  // Upsert matches (skip finished ones — admin manual result wins)
  for (const m of apiMatches) {
    const { data: existing } = await admin
      .from('matches')
      .select('id, is_finished')
      .eq('external_id', m.id)
      .maybeSingle()

    if (existing?.is_finished) { skipped++; continue }

    const homeId = m.homeTeam?.id ? (teamIdMap.get(m.homeTeam.id) ?? null) : null
    const awayId = m.awayTeam?.id ? (teamIdMap.get(m.awayTeam.id) ?? null) : null
    const grp = m.group?.replace('GROUP_', '')
    const groupChar = grp && VALID_GROUPS.has(grp) ? grp : null

    const payload = {
      phase,
      group: groupChar,
      home_team_id: homeId,
      away_team_id: awayId,
      scheduled_at: m.utcDate,
      stadium: m.venue ?? null,
      external_id: m.id,
    }

    if (existing) {
      const { error: e } = await admin.from('matches').update(payload).eq('id', existing.id)
      if (e) errors.push(`Jogo ${m.id}: ${e.message}`)
      else updated++
    } else {
      const { error: e } = await admin.from('matches').insert(payload)
      if (e) errors.push(`Jogo ${m.id}: ${e.message}`)
      else imported++
    }
  }

  revalidatePath('/admin/jogos')

  return { imported, updated, skipped, teamsUpserted, errors, phase, timestamp: new Date().toISOString() }
}
