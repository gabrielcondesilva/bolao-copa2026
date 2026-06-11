import { scoreMatch } from './engines/scoring'
import { simulateBracket } from './engines/bracket-simulator'
import { scoreClassifications, type ClassificationPhase } from './engines/classification-scorer'
import type { Database } from './supabase/types'

type DbMatch = Database['public']['Tables']['matches']['Row']
type DbPalpiteJogo = Database['public']['Tables']['palpites_jogos']['Row']
type DbPalpiteFinal = Database['public']['Tables']['palpites_finais']['Row']
type DbTeam = Database['public']['Tables']['teams']['Row']
type DbBracketOverride = Database['public']['Tables']['bracket_overrides']['Row']
type DbClassifierOverride = Database['public']['Tables']['classifier_overrides']['Row']

export type RankingEntry = {
  userId: string
  name: string
  totalPoints: number
  exactScores: number       // 10-pt hits (tiebreaker 1)
  correctResults: number    // 5-pt hits (tiebreaker 2)
  groupPoints: number       // match pts in group stage (tiebreaker 3)
  knockoutPoints: number    // match pts in knockout phases (tiebreaker 4)
  classificationPoints: number
  finalPoints: number
  position: number
}

// DB phase names → ClassificationPhase enum
const DB_TO_CLASS: Partial<Record<string, ClassificationPhase>> = {
  round_of_32: 'round_of_32',
  round_of_16: 'round_of_16',
  quarterfinals: 'quarter_finals',
  semifinals: 'semi_finals',
  third_place: 'third_place',
  final: 'final',
}

const KNOCKOUT_PHASES: ClassificationPhase[] = [
  'round_of_32', 'round_of_16', 'quarter_finals', 'semi_finals', 'third_place', 'final',
]

export function computeRanking(data: {
  participants: { id: string; name: string }[]
  allMatches: DbMatch[]
  allPalpitesJogos: DbPalpiteJogo[]
  allPalpitesFinais: DbPalpiteFinal[]
  teams: DbTeam[]
  bracketOverrides: DbBracketOverride[]
  classifierOverrides: DbClassifierOverride[]
}): RankingEntry[] {
  const {
    participants, allMatches, allPalpitesJogos, allPalpitesFinais,
    teams, bracketOverrides, classifierOverrides,
  } = data

  const finishedMatches = allMatches.filter(
    m => m.is_finished && m.home_score !== null && m.away_score !== null,
  )

  // Actual qualifiers per phase = teams that appear in each phase's matches
  const actualQualifiers: Record<ClassificationPhase, string[]> = {
    round_of_32: [], round_of_16: [], quarter_finals: [],
    semi_finals: [], third_place: [], final: [],
  }
  for (const m of allMatches) {
    const cp = DB_TO_CLASS[m.phase]
    if (cp && m.home_team_id && m.away_team_id) {
      actualQualifiers[cp].push(m.home_team_id, m.away_team_id)
    }
  }

  // Actual final positions (from finished final/third_place matches)
  const finalMatch = finishedMatches.find(m => m.phase === 'final')
  const thirdMatch = finishedMatches.find(m => m.phase === 'third_place')

  const winner = (m: DbMatch) =>
    m.home_score! > m.away_score! ? m.home_team_id : m.away_team_id
  const loser = (m: DbMatch) =>
    m.home_score! > m.away_score! ? m.away_team_id : m.home_team_id

  const actualChampion = finalMatch ? winner(finalMatch) : null
  const actualRunnerUp  = finalMatch ? loser(finalMatch)  : null
  const actualThird     = thirdMatch ? winner(thirdMatch) : null
  const actualFourth    = thirdMatch ? loser(thirdMatch)  : null

  // Index palpites
  const pjMap = new Map<string, DbPalpiteJogo>()
  for (const p of allPalpitesJogos) pjMap.set(`${p.user_id}:${p.match_id}`, p)

  const pfMap = new Map<string, DbPalpiteFinal>()
  for (const p of allPalpitesFinais) pfMap.set(p.user_id, p)

  // Bracket common inputs (shared — teams + overrides are the same for all)
  const bracketTeams = teams.map(t => ({
    id: t.id, name: t.name, group: t.group, fifa_ranking_reference: t.fifa_ranking_reference,
  }))
  const commonOverrides = {
    classifiers: classifierOverrides.map(o => ({ phase: o.phase, orderedTeamIds: o.ordered_team_ids })),
    bracket: bracketOverrides.map(o => ({
      phase: o.phase, matchSlot: o.match_slot,
      homeTeamId: o.home_team_id, awayTeamId: o.away_team_id,
    })),
  }

  const groupStageMatches = allMatches.filter(
    m => m.phase === 'group_stage' && m.home_team_id && m.away_team_id && m.group,
  )

  const canSimulate = bracketTeams.length > 0 && groupStageMatches.length > 0

  const rawEntries = participants.map(participant => {
    let exactScores = 0
    let correctResults = 0
    let groupPoints = 0
    let knockoutPoints = 0
    let classificationPoints = 0
    let finalPoints = 0

    // ── 1. Match prediction points ───────────────────────────────────────────
    for (const match of finishedMatches) {
      const p = pjMap.get(`${participant.id}:${match.id}`)
      if (!p || p.home_score === null || p.away_score === null) continue

      const pts = scoreMatch(
        { home: p.home_score, away: p.away_score },
        { home: match.home_score!, away: match.away_score! },
        match.went_to_extra_time,
      )

      if (pts === 10) exactScores++
      else if (pts === 5) correctResults++

      if (match.phase === 'group_stage') groupPoints += pts
      else knockoutPoints += pts
    }

    // ── 2. Classification points ─────────────────────────────────────────────
    if (canSimulate) {
      try {
        const groupMatchInputs = groupStageMatches.map(m => {
          const p = pjMap.get(`${participant.id}:${m.id}`)
          return {
            matchId: m.id,
            group: m.group!,
            homeTeamId: m.home_team_id!,
            awayTeamId: m.away_team_id!,
            predictedHomeScore: p?.home_score ?? null,
            predictedAwayScore: p?.away_score ?? null,
          }
        })

        const bracket = simulateBracket({
          groupMatches: groupMatchInputs,
          teams: bracketTeams,
          overrides: commonOverrides,
        })

        // R32: derived from group stage simulation
        const simR32 = bracket.round_of_32
          .flatMap(m => [m.homeTeamId, m.awayTeamId])
          .filter((id): id is string => id !== null)
        if (actualQualifiers.round_of_32.length > 0 && simR32.length > 0)
          classificationPoints += scoreClassifications(simR32, actualQualifiers.round_of_32, 'round_of_32')

        // R16+: derived from bracket_picks saved by the participant
        const bp = pfMap.get(participant.id)?.bracket_picks
        if (bp && typeof bp === 'object' && !Array.isArray(bp)) {
          const picks = bp as Record<string, unknown>
          const r32p = Array.isArray(picks.round_of_32) ? picks.round_of_32 as (string | null)[] : []
          const r16p = Array.isArray(picks.round_of_16) ? picks.round_of_16 as (string | null)[] : []
          const qfp  = Array.isArray(picks.quarterfinals) ? picks.quarterfinals as (string | null)[] : []
          const sfp  = Array.isArray(picks.semifinals) ? picks.semifinals as (string | null)[] : []

          const simR16   = r32p.filter((id): id is string => typeof id === 'string')
          const simQF    = r16p.filter((id): id is string => typeof id === 'string')
          const simSF    = qfp.filter((id): id is string => typeof id === 'string')
          const simFinal = sfp.filter((id): id is string => typeof id === 'string')

          // 3º lugar = perdedores das semis
          const sf1Loser = sfp[0] ? (qfp[0] === sfp[0] ? qfp[1] : qfp[0]) : null
          const sf2Loser = sfp[1] ? (qfp[2] === sfp[1] ? qfp[3] : qfp[2]) : null
          const simThird = [sf1Loser, sf2Loser].filter((id): id is string => typeof id === 'string')

          if (actualQualifiers.round_of_16.length > 0 && simR16.length > 0)
            classificationPoints += scoreClassifications(simR16, actualQualifiers.round_of_16, 'round_of_16')
          if (actualQualifiers.quarter_finals.length > 0 && simQF.length > 0)
            classificationPoints += scoreClassifications(simQF, actualQualifiers.quarter_finals, 'quarter_finals')
          if (actualQualifiers.semi_finals.length > 0 && simSF.length > 0)
            classificationPoints += scoreClassifications(simSF, actualQualifiers.semi_finals, 'semi_finals')
          if (actualQualifiers.final.length > 0 && simFinal.length > 0)
            classificationPoints += scoreClassifications(simFinal, actualQualifiers.final, 'final')
          if (actualQualifiers.third_place.length > 0 && simThird.length > 0)
            classificationPoints += scoreClassifications(simThird, actualQualifiers.third_place, 'third_place')
        }
      } catch {
        // Bracket simulation failed — 0 classification points for this participant
      }
    }

    // ── 3. Palpite Final points ──────────────────────────────────────────────
    const pf = pfMap.get(participant.id)
    if (pf) {
      if (actualChampion && pf.champion_team_id  === actualChampion)  finalPoints += 40
      if (actualRunnerUp  && pf.runner_up_team_id === actualRunnerUp)  finalPoints += 20
      if (actualThird     && pf.third_team_id     === actualThird)     finalPoints += 10
      if (actualFourth    && pf.fourth_team_id    === actualFourth)    finalPoints +=  5
      if (pf.artilheiro_correct)  finalPoints += 10
      if (pf.best_player_correct) finalPoints += 10
    }

    return {
      userId: participant.id,
      name: participant.name,
      totalPoints: groupPoints + knockoutPoints + classificationPoints + finalPoints,
      exactScores,
      correctResults,
      groupPoints,
      knockoutPoints,
      classificationPoints,
      finalPoints,
      position: 0,  // assigned after sort
    }
  })

  // Sort: total → exact → correct → groupPts → knockoutPts
  rawEntries.sort((a, b) => {
    if (b.totalPoints    !== a.totalPoints)    return b.totalPoints    - a.totalPoints
    if (b.exactScores    !== a.exactScores)    return b.exactScores    - a.exactScores
    if (b.correctResults !== a.correctResults) return b.correctResults - a.correctResults
    if (b.groupPoints    !== a.groupPoints)    return b.groupPoints    - a.groupPoints
    return b.knockoutPoints - a.knockoutPoints
  })

  // Assign positions (ties share the same position)
  let pos = 1
  for (let i = 0; i < rawEntries.length; i++) {
    if (i > 0 && rawEntries[i].totalPoints < rawEntries[i - 1].totalPoints) pos = i + 1
    rawEntries[i].position = pos
  }

  return rawEntries
}
