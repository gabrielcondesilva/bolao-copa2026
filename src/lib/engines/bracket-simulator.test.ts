import { describe, it, expect } from 'vitest'
import {
  simulateBracket,
  type BracketTeam,
  type GroupMatchInput,
  type KnockoutPalpite,
  type SimulatedBracket,
} from './bracket-simulator'

// ── Fixture helpers ───────────────────────────────────────────────────────────

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

/** Build 48 teams: 4 per group, FIFA ranking 1–48 in group order. */
function makeTeams(): BracketTeam[] {
  return GROUPS.flatMap((g, gi) =>
    [1, 2, 3, 4].map(pos => ({
      id: `${g}${pos}`,
      name: `Team ${g}${pos}`,
      group: g,
      fifa_ranking_reference: gi * 4 + pos,
    }))
  )
}

/** Build all 6 matches for a group with fixed scores: team 1 wins all, team 4 loses all. */
function makeGroupMatches(
  group: string,
  scores?: Partial<Record<string, { h: number; a: number }>>,
): GroupMatchInput[] {
  const teams = [1, 2, 3, 4].map(p => `${group}${p}`)
  const matches: GroupMatchInput[] = []
  let id = 0
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const key = `${teams[i]}-${teams[j]}`
      const score = scores?.[key] ?? { h: 1, a: 0 }  // default: home wins 1-0
      matches.push({
        matchId: `${group}-${++id}`,
        group,
        homeTeamId: teams[i],
        awayTeamId: teams[j],
        predictedHomeScore: score.h,
        predictedAwayScore: score.a,
      })
    }
  }
  return matches
}

function allGroupMatches(
  overrides: Partial<Record<string, Partial<Record<string, { h: number; a: number }>>>> = {}
): GroupMatchInput[] {
  return GROUPS.flatMap(g => makeGroupMatches(g, overrides[g]))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('simulateBracket — structure', () => {
  it('returns all 12 groups', () => {
    const result = simulateBracket({ groupMatches: allGroupMatches(), teams: makeTeams() })
    expect(Object.keys(result.groups).sort()).toEqual(GROUPS)
  })

  it('returns 4 standings per group', () => {
    const result = simulateBracket({ groupMatches: allGroupMatches(), teams: makeTeams() })
    for (const g of GROUPS) expect(result.groups[g].standings).toHaveLength(4)
  })

  it('returns 12 third-place results', () => {
    const result = simulateBracket({ groupMatches: allGroupMatches(), teams: makeTeams() })
    expect(result.bestThirds).toHaveLength(12)
  })

  it('marks exactly 8 thirds as qualifying', () => {
    const result = simulateBracket({ groupMatches: allGroupMatches(), teams: makeTeams() })
    expect(result.bestThirds.filter(t => t.qualifies)).toHaveLength(8)
  })

  it('returns correct match counts for each round', () => {
    const result = simulateBracket({ groupMatches: allGroupMatches(), teams: makeTeams() })
    expect(result.round_of_32).toHaveLength(16)
    expect(result.round_of_16).toHaveLength(8)
    expect(result.quarter_finals).toHaveLength(4)
    expect(result.semi_finals).toHaveLength(2)
    expect(result.third_place.matchNumber).toBe(103)
    expect(result.final.matchNumber).toBe(104)
  })

  it('all 32 knockout matches have correct match numbers', () => {
    const result = simulateBracket({ groupMatches: allGroupMatches(), teams: makeTeams() })
    const r32 = result.round_of_32.map(m => m.matchNumber).sort((a, b) => a - b)
    expect(r32).toEqual([73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88])
    const r16 = result.round_of_16.map(m => m.matchNumber).sort((a, b) => a - b)
    expect(r16).toEqual([89, 90, 91, 92, 93, 94, 95, 96])
    const qf = result.quarter_finals.map(m => m.matchNumber).sort((a, b) => a - b)
    expect(qf).toEqual([97, 98, 99, 100])
    const sf = result.semi_finals.map(m => m.matchNumber).sort((a, b) => a - b)
    expect(sf).toEqual([101, 102])
  })
})

describe('simulateBracket — group simulation', () => {
  it('1st place in a group is the team with most wins (no ties)', () => {
    const result = simulateBracket({ groupMatches: allGroupMatches(), teams: makeTeams() })
    // With default scores (home always wins 1-0): A1 beats A2, A3, A4 → 9pts; A2 beats A3, A4 → 6pts
    expect(result.groups['A'].first).toBe('A1')
    expect(result.groups['A'].second).toBe('A2')
    expect(result.groups['A'].third).toBe('A3')
    expect(result.groups['A'].fourth).toBe('A4')
  })

  it('null palpites are treated as unplayed (team keeps 0 points from those matches)', () => {
    // Only provide one match for group A — the rest are unsubmitted
    const oneMatch: GroupMatchInput = {
      matchId: 'A-1', group: 'A', homeTeamId: 'A1', awayTeamId: 'A2',
      predictedHomeScore: 2, predictedAwayScore: 0,
    }
    const otherMatches = allGroupMatches()
    const result = simulateBracket({
      groupMatches: [oneMatch, ...otherMatches.filter(m => m.group !== 'A')],
      teams: makeTeams(),
    })
    // A1 has 3pts (won vs A2), A2 has 0pts — the rest also 0pts
    const standings = result.groups['A'].standings
    const a1 = standings.find(s => s.team.id === 'A1')!
    expect(a1.points).toBe(3)
  })
})

describe('simulateBracket — best thirds tiebreaker', () => {
  it('selects by points, then goal diff, then goals scored', () => {
    // Give group A's 3rd team superior stats compared to all other groups' 3rds
    // In default fixture: all 3rds have 3pts (won one match: beat the 4th team)
    // Override group A: make A3 win with a big goal difference
    const overrides: Partial<Record<string, Partial<Record<string, { h: number; a: number }>>>> = {
      A: {
        'A3-A4': { h: 5, a: 0 },  // A3 crushes A4 (+5 goal diff)
      },
    }
    const result = simulateBracket({ groupMatches: allGroupMatches(overrides), teams: makeTeams() })
    // A3 should rank highest among all thirds (5 goals for, +5 goal diff, 3pts)
    expect(result.bestThirds[0].teamId).toBe('A3')
    expect(result.bestThirds[0].qualifies).toBe(true)
  })

  it('falls back to FIFA ranking when all stats are equal', () => {
    // All matches 0-0: every team has 0 pts, 0 gd, 0 gf — falls to FIFA ranking
    const zeroScores: Partial<Record<string, { h: number; a: number }>> = {}
    const teams = makeTeams()
    const allTeamPairs = teams.flatMap((t1, i) =>
      teams.slice(i + 1).filter(t2 => t2.group === t1.group).map(t2 => `${t1.id}-${t2.id}`)
    )
    for (const key of allTeamPairs) zeroScores[key] = { h: 0, a: 0 }
    const zeroMatches = GROUPS.flatMap(g => makeGroupMatches(g, zeroScores))
    const result = simulateBracket({ groupMatches: zeroMatches, teams })
    // With 0-0 everywhere, all standings come from FIFA ranking (lower = better)
    // Group A's 3rd place: A3 (FIFA rank 3), Group B's 3rd: B3 (FIFA rank 7), etc.
    // A3 (rank 3) should beat B3 (rank 7) in tiebreaker
    const a3 = result.bestThirds.find(t => t.teamId === 'A3')!
    const b3 = result.bestThirds.find(t => t.teamId === 'B3')!
    expect(result.bestThirds.indexOf(a3)).toBeLessThan(result.bestThirds.indexOf(b3))
  })
})

describe('simulateBracket — combinations table lookup', () => {
  it('groups E–L qualify → option 1 matchups (1A faces 3E, etc.)', () => {
    // Make teams from groups A-D rank lower so E-L 3rds qualify
    // Give groups E-L superior 3rd-place teams (more points)
    const overrides: Partial<Record<string, Partial<Record<string, { h: number; a: number }>>>> = {}
    for (const g of ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']) {
      overrides[g] = {
        [`${g}3-${g}4`]: { h: 3, a: 0 },  // 3rds in E-L win with 3 goals (higher gf)
      }
    }
    for (const g of ['A', 'B', 'C', 'D']) {
      overrides[g] = {
        [`${g}3-${g}4`]: { h: 1, a: 0 },  // 3rds in A-D win with 1 goal (lower gf)
      }
    }

    const result = simulateBracket({ groupMatches: allGroupMatches(overrides), teams: makeTeams() })
    const qualifying = result.bestThirds.filter(t => t.qualifies).map(t => t.group).sort()
    expect(qualifying).toEqual(['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'])

    // Annex C option 1: 1A → 3E, 1B → 3J, 1D → 3I, 1E → 3F, 1G → 3H, 1I → 3G, 1K → 3L, 1L → 3K
    const r32ByMatch = new Map(result.round_of_32.map(m => [m.matchNumber, m]))
    expect(r32ByMatch.get(79)?.awayTeamId).toBe('E3')  // Match 79: 1A vs 3E
    expect(r32ByMatch.get(85)?.awayTeamId).toBe('J3')  // Match 85: 1B vs 3J
    expect(r32ByMatch.get(81)?.awayTeamId).toBe('I3')  // Match 81: 1D vs 3I
    expect(r32ByMatch.get(74)?.awayTeamId).toBe('F3')  // Match 74: 1E vs 3F
    expect(r32ByMatch.get(82)?.awayTeamId).toBe('H3')  // Match 82: 1G vs 3H
    expect(r32ByMatch.get(77)?.awayTeamId).toBe('G3')  // Match 77: 1I vs 3G
    expect(r32ByMatch.get(87)?.awayTeamId).toBe('L3')  // Match 87: 1K vs 3L
    expect(r32ByMatch.get(80)?.awayTeamId).toBe('K3')  // Match 80: 1L vs 3K
  })

  it('fixed R32 matches have correct slot assignments', () => {
    const result = simulateBracket({ groupMatches: allGroupMatches(), teams: makeTeams() })
    const r32ByMatch = new Map(result.round_of_32.map(m => [m.matchNumber, m]))
    // Match 73: 2A vs 2B
    expect(r32ByMatch.get(73)?.homeTeamId).toBe('A2')
    expect(r32ByMatch.get(73)?.awayTeamId).toBe('B2')
    // Match 84: 1H vs 2J
    expect(r32ByMatch.get(84)?.homeTeamId).toBe('H1')
    expect(r32ByMatch.get(84)?.awayTeamId).toBe('J2')
  })
})

describe('simulateBracket — knockout cascade', () => {
  it('winners advance correctly through all rounds when palpites are decisive', () => {
    const teams = makeTeams()
    const groupMatchList = allGroupMatches()
    // Group winners (X1) always win; build knockout palpites where home team always wins 1-0
    // In Round of 32: 73 (2A vs 2B) → home wins; 74 (1E vs 3?) → home wins; etc.
    const koPalpites: KnockoutPalpite[] = Array.from({ length: 32 }, (_, i) => ({
      matchNumber: 73 + i,
      predictedHomeScore: 1,
      predictedAwayScore: 0,
    }))

    const result = simulateBracket({ groupMatches: groupMatchList, teams, knockoutPalpites: koPalpites })

    // Match 73: 2A vs 2B → home wins → 2A advances to R16 match 89
    const m73 = result.round_of_32.find(m => m.matchNumber === 73)!
    expect(m73.winnerId).toBe('A2')

    // Match 89: winner(73) vs winner(75) → home = A2 wins
    const m89 = result.round_of_16.find(m => m.matchNumber === 89)!
    expect(m89.homeTeamId).toBe('A2')
    expect(m89.winnerId).toBe('A2')

    // QF match 97: winner(89) vs winner(90) → A2 vs something
    const m97 = result.quarter_finals.find(m => m.matchNumber === 97)!
    expect(m97.homeTeamId).toBe('A2')
    expect(m97.winnerId).toBe('A2')
  })

  it('null winner when palpite is a draw', () => {
    const koPalpites: KnockoutPalpite[] = [
      { matchNumber: 73, predictedHomeScore: 1, predictedAwayScore: 1 },
    ]
    const result = simulateBracket({
      groupMatches: allGroupMatches(), teams: makeTeams(), knockoutPalpites: koPalpites,
    })
    const m73 = result.round_of_32.find(m => m.matchNumber === 73)!
    expect(m73.winnerId).toBeNull()
    // R16 match 89 cannot be determined
    const m89 = result.round_of_16.find(m => m.matchNumber === 89)!
    expect(m89.homeTeamId).toBeNull()
  })

  it('semi-final losers appear in the 3rd-place match', () => {
    const koPalpites: KnockoutPalpite[] = Array.from({ length: 32 }, (_, i) => ({
      matchNumber: 73 + i,
      predictedHomeScore: 2,
      predictedAwayScore: 0,
    }))
    const result = simulateBracket({ groupMatches: allGroupMatches(), teams: makeTeams(), knockoutPalpites: koPalpites })

    const sf101 = result.semi_finals.find(m => m.matchNumber === 101)!
    const sf102 = result.semi_finals.find(m => m.matchNumber === 102)!
    expect(result.third_place.homeTeamId).toBe(sf101.loserId)
    expect(result.third_place.awayTeamId).toBe(sf102.loserId)
  })

  it('final has the two semi-final winners', () => {
    const koPalpites: KnockoutPalpite[] = Array.from({ length: 32 }, (_, i) => ({
      matchNumber: 73 + i,
      predictedHomeScore: 1,
      predictedAwayScore: 0,
    }))
    const result = simulateBracket({ groupMatches: allGroupMatches(), teams: makeTeams(), knockoutPalpites: koPalpites })
    const sf101 = result.semi_finals.find(m => m.matchNumber === 101)!
    const sf102 = result.semi_finals.find(m => m.matchNumber === 102)!
    expect(result.final.homeTeamId).toBe(sf101.winnerId)
    expect(result.final.awayTeamId).toBe(sf102.winnerId)
  })
})

describe('simulateBracket — overrides', () => {
  it('classifier_override for group_stage reorders standings', () => {
    // Default: group A order is A1, A2, A3, A4 — override to A4, A3, A2, A1
    const result = simulateBracket({
      groupMatches: allGroupMatches(),
      teams: makeTeams(),
      overrides: {
        classifiers: [{ phase: 'group_stage', orderedTeamIds: ['A4', 'A3', 'A2', 'A1'] }],
      },
    })
    expect(result.groups['A'].first).toBe('A4')
    expect(result.groups['A'].second).toBe('A3')
    expect(result.groups['A'].fourth).toBe('A1')
  })

  it('bracket_override for round_of_32 forces specific teams into a match', () => {
    const result = simulateBracket({
      groupMatches: allGroupMatches(),
      teams: makeTeams(),
      overrides: {
        bracket: [{ phase: 'round_of_32', matchSlot: 73, homeTeamId: 'D1', awayTeamId: 'L3' }],
      },
    })
    const m73 = result.round_of_32.find(m => m.matchNumber === 73)!
    expect(m73.homeTeamId).toBe('D1')
    expect(m73.awayTeamId).toBe('L3')
  })
})
