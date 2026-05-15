export type StandingRow = {
  team: { id: string; name: string; code: string; flag_url: string | null };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

type TeamInput = { id: string; name: string; code: string; flag_url: string | null };
type MatchInput = {
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
};

export function computeStandings(teams: TeamInput[], matches: MatchInput[]): StandingRow[] {
  const map = new Map<string, StandingRow>();
  for (const t of teams) {
    map.set(t.id, { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 });
  }

  for (const m of matches) {
    if (
      m.status !== "finished" ||
      m.home_team_id == null ||
      m.away_team_id == null ||
      m.home_score == null ||
      m.away_score == null
    ) continue;

    const home = map.get(m.home_team_id);
    const away = map.get(m.away_team_id);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.gf += m.home_score;
    home.ga += m.away_score;
    away.gf += m.away_score;
    away.ga += m.home_score;

    if (m.home_score > m.away_score) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (m.home_score < m.away_score) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  }

  for (const row of map.values()) {
    row.gd = row.gf - row.ga;
  }

  return [...map.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      a.team.name.localeCompare(b.team.name)
  );
}
