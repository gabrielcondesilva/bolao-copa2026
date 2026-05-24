export type GroupMatch = {
  id: string
  home_team_id: string
  away_team_id: string
  home_score: number  // caller must pass only finished matches (scores defined)
  away_score: number
}

export type Team = {
  id: string
  name: string
  fifa_ranking_reference: number  // immutable draw-date snapshot; lower = better rank
}

export type GroupStanding = {
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_diff: number
  points: number
  position: number  // 1-based
}

type Stats = Omit<GroupStanding, 'team' | 'position'>

function computeStats(teamId: string, matches: GroupMatch[]): Stats {
  let played = 0, won = 0, drawn = 0, lost = 0, goals_for = 0, goals_against = 0

  for (const m of matches) {
    let gf: number, ga: number
    if (m.home_team_id === teamId) {
      gf = m.home_score; ga = m.away_score
    } else if (m.away_team_id === teamId) {
      gf = m.away_score; ga = m.home_score
    } else {
      continue
    }
    played++
    goals_for += gf
    goals_against += ga
    if (gf > ga) won++
    else if (gf === ga) drawn++
    else lost++
  }

  return {
    played, won, drawn, lost, goals_for, goals_against,
    goal_diff: goals_for - goals_against,
    points: won * 3 + drawn,
  }
}

type Entry = { team: Team } & Stats

function sortTiedGroup(group: Entry[], allMatches: GroupMatch[]): Entry[] {
  const ids = new Set(group.map(e => e.team.id))
  const h2hMatches = allMatches.filter(
    m => ids.has(m.home_team_id) && ids.has(m.away_team_id),
  )
  const h2h = new Map(group.map(e => [e.team.id, computeStats(e.team.id, h2hMatches)]))

  return [...group].sort((a, b) => {
    const ha = h2h.get(a.team.id)!
    const hb = h2h.get(b.team.id)!

    // Head-to-head criteria (among tied teams only)
    if (hb.points !== ha.points) return hb.points - ha.points
    if (hb.goal_diff !== ha.goal_diff) return hb.goal_diff - ha.goal_diff
    if (hb.goals_for !== ha.goals_for) return hb.goals_for - ha.goals_for

    // Overall criteria (all group matches)
    if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for

    // FIFA Ranking de Referência — lower number = better rank
    return a.team.fifa_ranking_reference - b.team.fifa_ranking_reference
  })
}

export function calculateStandings(teams: Team[], matches: GroupMatch[]): GroupStanding[] {
  const entries: Entry[] = teams.map(t => ({ team: t, ...computeStats(t.id, matches) }))

  // Primary sort: points descending
  entries.sort((a, b) => b.points - a.points)

  // Break equal-points groups with the full tiebreaker chain
  const result: Entry[] = []
  let i = 0
  while (i < entries.length) {
    let j = i + 1
    while (j < entries.length && entries[j].points === entries[i].points) j++
    const group = entries.slice(i, j)
    result.push(...(group.length > 1 ? sortTiedGroup(group, matches) : group))
    i = j
  }

  return result.map((e, idx) => ({ ...e, position: idx + 1 }))
}
