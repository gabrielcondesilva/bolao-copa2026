import { describe, it, expect } from 'vitest'
import { calculateStandings, type GroupMatch, type Team } from './standings'

// ── Fixture helpers ───────────────────────────────────────────────────────────

let matchId = 0
function match(home: Team, hs: number, away: Team, as_: number): GroupMatch {
  return { id: String(++matchId), home_team_id: home.id, away_team_id: away.id, home_score: hs, away_score: as_ }
}

function team(id: string, rank: number): Team {
  return { id, name: id, fifa_ranking_reference: rank }
}

function positions(standings: ReturnType<typeof calculateStandings>) {
  return standings.map(s => s.team.id)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('calculateStandings', () => {
  it('orders teams by points (no ties)', () => {
    // A: 3W = 9pts; B: 2W 1L = 6pts; C: 1W 2L = 3pts; D: 3L = 0pts
    const [A, B, C, D] = ['A', 'B', 'C', 'D'].map((id, i) => team(id, i + 1))
    const matches = [
      match(A, 3, B, 0),
      match(A, 2, C, 1),
      match(A, 1, D, 0),
      match(B, 2, C, 1),
      match(B, 1, D, 0),
      match(C, 2, D, 0),
    ]
    expect(positions(calculateStandings([A, B, C, D], matches))).toEqual(['A', 'B', 'C', 'D'])
  })

  it('breaks 2-team points tie via H2H points', () => {
    // A and B tied at 4pts; A beat B directly
    const [A, B, C, D] = ['A', 'B', 'C', 'D'].map((id, i) => team(id, i + 1))
    const matches = [
      match(A, 1, B, 0), // A wins H2H
      match(A, 0, C, 1),
      match(A, 2, D, 2),
      match(B, 3, C, 0),
      match(B, 0, D, 1),
      match(C, 1, D, 1),
    ]
    // A: W D L = 4pts; B: W L L... let me recalculate
    // A: beat B(1-0) + lost to C(0-1) + drew D(2-2) = 3+0+1 = 4pts
    // B: lost to A(0-1) + beat C(3-0) + lost to D(0-1) = 0+3+0 = 3pts... not a tie
    // Let me redo: need A and B at same points
    const [P, Q, R, S] = [team('P', 1), team('Q', 2), team('R', 3), team('S', 4)]
    const ms = [
      match(P, 1, Q, 0), // P wins H2H — P gets 3pts here, Q gets 0
      match(P, 0, R, 2), // P loses
      match(P, 1, S, 1), // P draws
      match(Q, 2, R, 0), // Q wins
      match(Q, 1, S, 1), // Q draws
      match(R, 1, S, 2), // S wins
    ]
    // P: W(1-0 Q) + L(0-2 R) + D(1-1 S) = 4pts
    // Q: L(0-1 P) + W(2-0 R) + D(1-1 S) = 4pts
    // P and Q tied at 4pts; H2H P beat Q → P > Q
    const result = positions(calculateStandings([P, Q, R, S], ms))
    expect(result.indexOf('P')).toBeLessThan(result.indexOf('Q'))
  })

  it('breaks 2-team points tie via overall goal difference when H2H is a draw', () => {
    // A and B both at 4pts; H2H draw 0-0; A has better overall GD
    const [A, B, C, D] = [team('A', 1), team('B', 2), team('C', 3), team('D', 4)]
    const matches = [
      match(A, 0, B, 0), // H2H draw — equal H2H in every criterion
      match(A, 3, C, 0), // A big win
      match(A, 1, D, 2), // A loses
      match(B, 2, C, 1), // B wins
      match(B, 0, D, 3), // B big loss
      match(C, 1, D, 1),
    ]
    // A: D(0-0) + W(3-0) + L(1-2) = 4pts, GF=4, GA=2, GD=+2
    // B: D(0-0) + W(2-1) + L(0-3) = 4pts, GF=2, GA=4, GD=-2
    // H2H between A and B: drew 0-0 → equal
    // Overall: A GD=+2 > B GD=-2 → A > B
    const result = positions(calculateStandings([A, B, C, D], matches))
    expect(result.indexOf('A')).toBeLessThan(result.indexOf('B'))
  })

  it('breaks 3-team points tie via H2H goal difference', () => {
    // Circular results: A beats B, B beats C, C beats A (each 1W 1L = 3pts H2H)
    // A's H2H GD is best → A > C > B
    const [A, B, C] = [team('A', 1), team('B', 2), team('C', 3)]
    const matches = [
      match(A, 2, B, 0), // A beats B 2-0: A H2H GD +2, B -2
      match(B, 2, C, 1), // B beats C 2-1: B H2H GD +1 total (-2+1=-1), C -1
      match(C, 1, A, 0), // C beats A 1-0: C H2H GD 0 total (-1+1=0), A +1 total (+2-1=+1)
    ]
    // H2H pts all = 3 (circular)
    // H2H GD: A=+1, C=0, B=-1 → ranking: A > C > B
    const result = positions(calculateStandings([A, B, C], matches))
    expect(result).toEqual(['A', 'C', 'B'])
  })

  it('uses FIFA Ranking de Referência as last resort', () => {
    // All teams perfectly equal — only FIFA rank separates them
    const [A, B, C] = [team('A', 5), team('B', 10), team('C', 15)]
    const matches = [
      match(A, 1, B, 1),
      match(A, 1, C, 1),
      match(B, 1, C, 1),
    ]
    // All 3pts, all GD=0, all GF=2, all GA=2 — H2H same as overall
    // Lower FIFA rank number = better ranking → A(5) > B(10) > C(15)
    expect(positions(calculateStandings([A, B, C], matches))).toEqual(['A', 'B', 'C'])
  })

  it('assigns correct position numbers', () => {
    const [A, B, C] = [team('A', 1), team('B', 2), team('C', 3)]
    const matches = [match(A, 3, B, 0), match(A, 2, C, 0), match(B, 1, C, 0)]
    const standings = calculateStandings([A, B, C], matches)
    expect(standings.find(s => s.team.id === 'A')?.position).toBe(1)
    expect(standings.find(s => s.team.id === 'B')?.position).toBe(2)
    expect(standings.find(s => s.team.id === 'C')?.position).toBe(3)
  })

  it('returns all teams with zero points when no matches played', () => {
    const teams = ['A', 'B', 'C', 'D'].map((id, i) => team(id, i + 1))
    const standings = calculateStandings(teams, [])
    expect(standings).toHaveLength(4)
    expect(standings.every(s => s.points === 0 && s.played === 0)).toBe(true)
    // Resolved by FIFA rank: A(1) > B(2) > C(3) > D(4)
    expect(positions(standings)).toEqual(['A', 'B', 'C', 'D'])
  })
})
