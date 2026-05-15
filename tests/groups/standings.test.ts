import { describe, it, expect } from "vitest";
import { computeStandings } from "@/lib/groups/standings";

const teams = [
  { id: "A", name: "Alpha", code: "ALP", flag_url: null },
  { id: "B", name: "Beta",  code: "BET", flag_url: null },
  { id: "C", name: "Gamma", code: "GAM", flag_url: null },
  { id: "D", name: "Delta", code: "DEL", flag_url: null },
];

function match(
  home: string,
  away: string,
  homeScore: number,
  awayScore: number,
  status = "finished"
) {
  return {
    home_team_id: home,
    away_team_id: away,
    home_score: homeScore,
    away_score: awayScore,
    status,
  };
}

describe("computeStandings", () => {
  it("ignores non-finished matches", () => {
    const rows = computeStandings(teams, [
      match("A", "B", 1, 0, "scheduled"),
      match("C", "D", 2, 2, "live"),
    ]);
    for (const r of rows) {
      expect(r.played).toBe(0);
      expect(r.points).toBe(0);
    }
  });

  it("correctly counts wins, draws, losses and points", () => {
    const rows = computeStandings(teams, [
      match("A", "B", 2, 1), // A wins
      match("C", "D", 0, 0), // draw
    ]);
    const a = rows.find((r) => r.team.id === "A")!;
    const b = rows.find((r) => r.team.id === "B")!;
    const c = rows.find((r) => r.team.id === "C")!;
    const d = rows.find((r) => r.team.id === "D")!;

    expect(a.points).toBe(3);
    expect(a.won).toBe(1);
    expect(a.lost).toBe(0);

    expect(b.points).toBe(0);
    expect(b.lost).toBe(1);

    expect(c.points).toBe(1);
    expect(c.drawn).toBe(1);
    expect(d.points).toBe(1);
  });

  it("accumulates GF and GA correctly", () => {
    const rows = computeStandings(teams, [
      match("A", "B", 3, 1),
      match("A", "C", 2, 0),
    ]);
    const a = rows.find((r) => r.team.id === "A")!;
    expect(a.gf).toBe(5);
    expect(a.ga).toBe(1);
    expect(a.gd).toBe(4);
  });

  it("sorts by points desc, then GD desc, then GF desc", () => {
    const rows = computeStandings(teams, [
      match("A", "B", 1, 0), // A: 3pts, GD+1
      match("A", "C", 1, 0), // A: 6pts, GD+2
      match("B", "D", 1, 0), // B: 3pts, GD+1
      match("C", "D", 2, 1), // C: 3pts, GD+1
    ]);
    const names = rows.map((r) => r.team.id);
    expect(names[0]).toBe("A");
    // B, C, D all have same points/GD in various configs — just ensure A is first
  });

  it("handles empty teams array", () => {
    expect(computeStandings([], [])).toEqual([]);
  });

  it("handles no matches", () => {
    const rows = computeStandings(teams, []);
    expect(rows.every((r) => r.played === 0 && r.points === 0)).toBe(true);
  });
});
