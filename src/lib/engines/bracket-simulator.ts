import { calculateStandings, type Team, type GroupMatch, type GroupStanding } from './standings'
import { getMatchups } from '../data/combinations-495'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BracketTeam extends Team {
  group: string  // 'A' through 'L'
}

/** One group stage match merged with the participant's predicted score. */
export interface GroupMatchInput {
  matchId: string
  group: string
  homeTeamId: string
  awayTeamId: string
  predictedHomeScore: number | null  // null = palpite not submitted
  predictedAwayScore: number | null
}

/** A participant's predicted score for a specific knockout match (by FIFA match number). */
export interface KnockoutPalpite {
  matchNumber: number  // 73–104
  predictedHomeScore: number | null
  predictedAwayScore: number | null
}

export interface ClassifierOverride {
  phase: string         // 'group_stage' (4 IDs) or 'round_of_32' (8 IDs)
  orderedTeamIds: string[]
}

export interface BracketOverride {
  phase: string
  matchSlot: number     // FIFA match number (73–104)
  homeTeamId: string | null
  awayTeamId: string | null
}

export interface GroupResult {
  standings: GroupStanding[]
  first: string   // team id
  second: string
  third: string
  fourth: string
}

export interface ThirdPlaceResult {
  teamId: string
  group: string
  points: number
  goalDiff: number
  goalsFor: number
  fifaRanking: number
  qualifies: boolean  // true for top 8
}

export interface SimulatedKnockoutMatch {
  matchNumber: number
  homeTeamId: string | null
  awayTeamId: string | null
  predictedHomeScore: number | null
  predictedAwayScore: number | null
  winnerId: string | null  // null if no decisive palpite
  loserId: string | null
}

export interface SimulatedBracket {
  groups: Record<string, GroupResult>       // keys 'A'–'L'
  bestThirds: ThirdPlaceResult[]            // 12 thirds sorted; first 8 qualify
  round_of_32: SimulatedKnockoutMatch[]     // 16 matches (73–88)
  round_of_16: SimulatedKnockoutMatch[]     // 8 matches  (89–96)
  quarter_finals: SimulatedKnockoutMatch[]  // 4 matches  (97–100)
  semi_finals: SimulatedKnockoutMatch[]     // 2 matches  (101–102)
  third_place: SimulatedKnockoutMatch       // match 103
  final: SimulatedKnockoutMatch             // match 104
}

// ── Bracket constants ─────────────────────────────────────────────────────────
// Source: 2026 FIFA World Cup knockout stage (matches 73–104)

/** Fixed Round of 32 slot assignments (the 8 matches that do NOT involve a third-place team). */
const FIXED_R32: { matchNumber: number; homeSlot: string; awaySlot: string }[] = [
  { matchNumber: 73, homeSlot: '2A', awaySlot: '2B' },
  { matchNumber: 75, homeSlot: '1F', awaySlot: '2C' },
  { matchNumber: 76, homeSlot: '1C', awaySlot: '2F' },
  { matchNumber: 78, homeSlot: '2E', awaySlot: '2I' },
  { matchNumber: 83, homeSlot: '2K', awaySlot: '2L' },
  { matchNumber: 84, homeSlot: '1H', awaySlot: '2J' },
  { matchNumber: 86, homeSlot: '1J', awaySlot: '2H' },
  { matchNumber: 88, homeSlot: '2D', awaySlot: '2G' },
]

const R32_MATCH_NUMBERS = [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88]

type BracketSlotRef = { matchNumber: number; take: 'winner' | 'loser' }
type BracketMatchDef = { matchNumber: number; home: BracketSlotRef; away: BracketSlotRef }

const ROUND_OF_16_DEFS: BracketMatchDef[] = [
  { matchNumber: 89,  home: { matchNumber: 73, take: 'winner' }, away: { matchNumber: 75, take: 'winner' } },
  { matchNumber: 90,  home: { matchNumber: 74, take: 'winner' }, away: { matchNumber: 77, take: 'winner' } },
  { matchNumber: 91,  home: { matchNumber: 76, take: 'winner' }, away: { matchNumber: 78, take: 'winner' } },
  { matchNumber: 92,  home: { matchNumber: 79, take: 'winner' }, away: { matchNumber: 80, take: 'winner' } },
  { matchNumber: 93,  home: { matchNumber: 83, take: 'winner' }, away: { matchNumber: 84, take: 'winner' } },
  { matchNumber: 94,  home: { matchNumber: 81, take: 'winner' }, away: { matchNumber: 82, take: 'winner' } },
  { matchNumber: 95,  home: { matchNumber: 86, take: 'winner' }, away: { matchNumber: 88, take: 'winner' } },
  { matchNumber: 96,  home: { matchNumber: 85, take: 'winner' }, away: { matchNumber: 87, take: 'winner' } },
]

const QUARTER_FINAL_DEFS: BracketMatchDef[] = [
  { matchNumber: 97,  home: { matchNumber: 89, take: 'winner' }, away: { matchNumber: 90, take: 'winner' } },
  { matchNumber: 98,  home: { matchNumber: 93, take: 'winner' }, away: { matchNumber: 94, take: 'winner' } },
  { matchNumber: 99,  home: { matchNumber: 91, take: 'winner' }, away: { matchNumber: 92, take: 'winner' } },
  { matchNumber: 100, home: { matchNumber: 95, take: 'winner' }, away: { matchNumber: 96, take: 'winner' } },
]

const SEMI_FINAL_DEFS: BracketMatchDef[] = [
  { matchNumber: 101, home: { matchNumber: 97,  take: 'winner' }, away: { matchNumber: 98,  take: 'winner' } },
  { matchNumber: 102, home: { matchNumber: 99,  take: 'winner' }, away: { matchNumber: 100, take: 'winner' } },
]

const THIRD_PLACE_DEF: BracketMatchDef = {
  matchNumber: 103,
  home: { matchNumber: 101, take: 'loser' },
  away: { matchNumber: 102, take: 'loser' },
}

const FINAL_DEF: BracketMatchDef = {
  matchNumber: 104,
  home: { matchNumber: 101, take: 'winner' },
  away: { matchNumber: 102, take: 'winner' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveOutcome(
  homeTeamId: string | null,
  awayTeamId: string | null,
  homeScore: number | null,
  awayScore: number | null,
): { winnerId: string | null; loserId: string | null } {
  if (!homeTeamId || !awayTeamId || homeScore === null || awayScore === null) {
    return { winnerId: null, loserId: null }
  }
  if (homeScore > awayScore) return { winnerId: homeTeamId, loserId: awayTeamId }
  if (awayScore > homeScore) return { winnerId: awayTeamId, loserId: homeTeamId }
  return { winnerId: null, loserId: null }  // draw → advancement unknown from palpite alone
}

function slotTeam(slot: string, groups: Record<string, GroupResult>): string | null {
  const position = slot[0]  // '1' or '2'
  const group = slot[1]     // 'A'–'L'
  const g = groups[group]
  if (!g) return null
  if (position === '1') return g.first
  if (position === '2') return g.second
  return null
}

// ── Group stage simulation ────────────────────────────────────────────────────

function simulateGroups(
  groupMatches: GroupMatchInput[],
  teams: BracketTeam[],
  classifierOverrides: ClassifierOverride[],
): Record<string, GroupResult> {
  const teamsByGroup = new Map<string, BracketTeam[]>()
  for (const t of teams) {
    const arr = teamsByGroup.get(t.group) ?? []
    arr.push(t)
    teamsByGroup.set(t.group, arr)
  }

  const matchesByGroup = new Map<string, GroupMatchInput[]>()
  for (const m of groupMatches) {
    const arr = matchesByGroup.get(m.group) ?? []
    arr.push(m)
    matchesByGroup.set(m.group, arr)
  }

  // Build a map from group → admin-override order (4 team IDs)
  const groupOverride = new Map<string, string[]>()
  for (const ov of classifierOverrides) {
    if (ov.phase === 'group_stage' && ov.orderedTeamIds.length === 4) {
      const group = teams.find(t => t.id === ov.orderedTeamIds[0])?.group
      if (group) groupOverride.set(group, ov.orderedTeamIds)
    }
  }

  const result: Record<string, GroupResult> = {}

  for (const [group, groupTeams] of teamsByGroup) {
    const submitted: GroupMatch[] = (matchesByGroup.get(group) ?? [])
      .filter(m => m.predictedHomeScore !== null && m.predictedAwayScore !== null)
      .map(m => ({
        id: m.matchId,
        home_team_id: m.homeTeamId,
        away_team_id: m.awayTeamId,
        home_score: m.predictedHomeScore as number,
        away_score: m.predictedAwayScore as number,
      }))

    const standings = calculateStandings(groupTeams, submitted)
    const override = groupOverride.get(group)

    const ordered: Team[] = override
      ? override.map(id => standings.find(s => s.team.id === id)?.team).filter((t): t is Team => t !== undefined)
      : standings.map(s => s.team)

    result[group] = {
      standings,
      first:  ordered[0]?.id ?? groupTeams[0].id,
      second: ordered[1]?.id ?? groupTeams[1].id,
      third:  ordered[2]?.id ?? groupTeams[2].id,
      fourth: ordered[3]?.id ?? groupTeams[3].id,
    }
  }

  return result
}

// ── Best thirds selection ─────────────────────────────────────────────────────

function selectBestThirds(
  groups: Record<string, GroupResult>,
  teams: BracketTeam[],
  classifierOverrides: ClassifierOverride[],
): ThirdPlaceResult[] {
  const teamById = new Map(teams.map(t => [t.id, t]))

  const thirds: ThirdPlaceResult[] = Object.entries(groups).map(([group, result]) => {
    const standing = result.standings.find(s => s.team.id === result.third)
    return {
      teamId: result.third,
      group,
      points:      standing?.points ?? 0,
      goalDiff:    standing?.goal_diff ?? 0,
      goalsFor:    standing?.goals_for ?? 0,
      fifaRanking: teamById.get(result.third)?.fifa_ranking_reference ?? 999,
      qualifies:   false,
    }
  })

  // Points → goal diff → goals scored → FIFA ranking reference (lower = better)
  thirds.sort((a, b) =>
    b.points - a.points ||
    b.goalDiff - a.goalDiff ||
    b.goalsFor - a.goalsFor ||
    a.fifaRanking - b.fifaRanking
  )

  const r32Override = classifierOverrides.find(ov => ov.phase === 'round_of_32')
  if (r32Override) {
    const qualifyingSet = new Set(r32Override.orderedTeamIds.slice(0, 8))
    const orderMap = new Map(r32Override.orderedTeamIds.map((id, i) => [id, i]))
    for (const t of thirds) t.qualifies = qualifyingSet.has(t.teamId)
    thirds.sort((a, b) =>
      (a.qualifies === b.qualifies ? 0 : a.qualifies ? -1 : 1) ||
      (orderMap.get(a.teamId) ?? 999) - (orderMap.get(b.teamId) ?? 999)
    )
  } else {
    for (let i = 0; i < thirds.length; i++) thirds[i].qualifies = i < 8
  }

  return thirds
}

// ── Round of 32 ───────────────────────────────────────────────────────────────

function buildRound32(
  groups: Record<string, GroupResult>,
  bestThirds: ThirdPlaceResult[],
  palpites: Map<number, { home: number | null; away: number | null }>,
  bracketOverrides: BracketOverride[],
): SimulatedKnockoutMatch[] {
  const qualifyingGroups = bestThirds.filter(t => t.qualifies).map(t => t.group)
  const thirdTeamByGroup = new Map(bestThirds.filter(t => t.qualifies).map(t => [t.group, t.teamId]))

  const thirdPlaceMatchups = getMatchups(qualifyingGroups)
  const thirdByMatchNum = new Map(thirdPlaceMatchups.map(m => [m.match, m]))

  const fixedByMatchNum = new Map(FIXED_R32.map(m => [m.matchNumber, m]))
  const overrideMap = new Map(
    bracketOverrides.filter(ov => ov.phase === 'round_of_32').map(ov => [ov.matchSlot, ov])
  )

  return R32_MATCH_NUMBERS.map(matchNumber => {
    let homeTeamId: string | null = null
    let awayTeamId: string | null = null

    const fixed = fixedByMatchNum.get(matchNumber)
    if (fixed) {
      homeTeamId = slotTeam(fixed.homeSlot, groups)
      awayTeamId = slotTeam(fixed.awaySlot, groups)
    } else {
      const m = thirdByMatchNum.get(matchNumber)
      if (m) {
        homeTeamId = slotTeam(m.groupWinner, groups)
        awayTeamId = thirdTeamByGroup.get(m.thirdPlace[1]) ?? null  // '3E' → 'E'
      }
    }

    const ov = overrideMap.get(matchNumber)
    if (ov) { homeTeamId = ov.homeTeamId; awayTeamId = ov.awayTeamId }

    const p = palpites.get(matchNumber)
    const predictedHomeScore = p?.home ?? null
    const predictedAwayScore = p?.away ?? null
    return {
      matchNumber, homeTeamId, awayTeamId, predictedHomeScore, predictedAwayScore,
      ...resolveOutcome(homeTeamId, awayTeamId, predictedHomeScore, predictedAwayScore),
    }
  })
}

// ── Generic knockout round builder ────────────────────────────────────────────

function buildRound(
  defs: BracketMatchDef[],
  resolved: Map<number, SimulatedKnockoutMatch>,
  palpites: Map<number, { home: number | null; away: number | null }>,
  bracketOverrides: BracketOverride[],
  phase: string,
): SimulatedKnockoutMatch[] {
  const overrideMap = new Map(
    bracketOverrides.filter(ov => ov.phase === phase).map(ov => [ov.matchSlot, ov])
  )

  return defs.map(def => {
    const homeSrc = resolved.get(def.home.matchNumber)
    const awaySrc = resolved.get(def.away.matchNumber)

    let homeTeamId = def.home.take === 'winner' ? (homeSrc?.winnerId ?? null) : (homeSrc?.loserId ?? null)
    let awayTeamId = def.away.take === 'winner' ? (awaySrc?.winnerId ?? null) : (awaySrc?.loserId ?? null)

    const ov = overrideMap.get(def.matchNumber)
    if (ov) { homeTeamId = ov.homeTeamId; awayTeamId = ov.awayTeamId }

    const p = palpites.get(def.matchNumber)
    const predictedHomeScore = p?.home ?? null
    const predictedAwayScore = p?.away ?? null
    return {
      matchNumber: def.matchNumber, homeTeamId, awayTeamId, predictedHomeScore, predictedAwayScore,
      ...resolveOutcome(homeTeamId, awayTeamId, predictedHomeScore, predictedAwayScore),
    }
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

export function simulateBracket(params: {
  groupMatches: GroupMatchInput[]
  teams: BracketTeam[]
  knockoutPalpites?: KnockoutPalpite[]
  overrides?: {
    classifiers?: ClassifierOverride[]
    bracket?: BracketOverride[]
  }
}): SimulatedBracket {
  const { groupMatches, teams, knockoutPalpites = [], overrides = {} } = params
  const classifiers = overrides.classifiers ?? []
  const bracket = overrides.bracket ?? []

  const koPalpites = new Map<number, { home: number | null; away: number | null }>(
    knockoutPalpites.map(p => [p.matchNumber, { home: p.predictedHomeScore, away: p.predictedAwayScore }])
  )

  const groups = simulateGroups(groupMatches, teams, classifiers)
  const bestThirds = selectBestThirds(groups, teams, classifiers)

  const round_of_32 = buildRound32(groups, bestThirds, koPalpites, bracket)
  const resolved = new Map(round_of_32.map(m => [m.matchNumber, m]))

  const round_of_16 = buildRound(ROUND_OF_16_DEFS, resolved, koPalpites, bracket, 'round_of_16')
  for (const m of round_of_16) resolved.set(m.matchNumber, m)

  const quarter_finals = buildRound(QUARTER_FINAL_DEFS, resolved, koPalpites, bracket, 'quarterfinals')
  for (const m of quarter_finals) resolved.set(m.matchNumber, m)

  const semi_finals = buildRound(SEMI_FINAL_DEFS, resolved, koPalpites, bracket, 'semifinals')
  for (const m of semi_finals) resolved.set(m.matchNumber, m)

  const [third_place] = buildRound([THIRD_PLACE_DEF], resolved, koPalpites, bracket, 'third_place')
  const [final] = buildRound([FINAL_DEF], resolved, koPalpites, bracket, 'final')

  return { groups, bestThirds, round_of_32, round_of_16, quarter_finals, semi_finals, third_place, final }
}
