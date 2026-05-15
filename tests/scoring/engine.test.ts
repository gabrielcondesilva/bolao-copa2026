import { describe, it, expect } from "vitest";
import {
  calculateMatchPoints,
  calculateGroupPredictionPoints,
  calculateTournamentPoints,
} from "@/lib/scoring/engine";
import type { ScoringConfig } from "@/lib/scoring/types";

// Default config matching seed values
const config: ScoringConfig = {
  match_winner_group: 2,
  exact_score_group: 7,
  match_winner_round_of_32: 3,
  exact_score_round_of_32: 10,
  match_winner_round_of_16: 4,
  exact_score_round_of_16: 13,
  match_winner_quarter: 5,
  exact_score_quarter: 16,
  match_winner_semi: 6,
  exact_score_semi: 19,
  match_winner_third: 5,
  exact_score_third: 16,
  match_winner_final: 8,
  exact_score_final: 23,
  group_both_correct_order: 4,
  group_both_wrong_order: 2,
  group_one_correct: 1,
  champion: 8,
  runner_up: 5,
  third_place_tournament: 3,
  top_scorer: 6,
};

// ─── Match predictions ────────────────────────────────────────────────────────

describe("calculateMatchPoints — group stage", () => {
  it("returns exact_score_group (7) when prediction matches exactly", () => {
    expect(
      calculateMatchPoints({ home_score: 2, away_score: 1 }, { home_score: 2, away_score: 1 }, config, "group")
    ).toBe(7);
  });

  it("returns match_winner_group (2) when winner is correct but score is wrong", () => {
    expect(
      calculateMatchPoints({ home_score: 3, away_score: 0 }, { home_score: 1, away_score: 0 }, config, "group")
    ).toBe(2);
  });

  it("returns 2 for correct draw prediction with wrong score (0-0 vs 1-1)", () => {
    expect(
      calculateMatchPoints({ home_score: 0, away_score: 0 }, { home_score: 1, away_score: 1 }, config, "group")
    ).toBe(2);
  });

  it("returns 0 when predicted home win but actual is away win", () => {
    expect(
      calculateMatchPoints({ home_score: 2, away_score: 0 }, { home_score: 0, away_score: 1 }, config, "group")
    ).toBe(0);
  });

  it("returns 0 when predicted draw but actual has a winner", () => {
    expect(
      calculateMatchPoints({ home_score: 1, away_score: 1 }, { home_score: 2, away_score: 0 }, config, "group")
    ).toBe(0);
  });
});

describe("calculateMatchPoints — knockout stages", () => {
  it("round_of_32: exact score returns 10", () => {
    expect(
      calculateMatchPoints({ home_score: 1, away_score: 0 }, { home_score: 1, away_score: 0 }, config, "round_of_32")
    ).toBe(10);
  });

  it("round_of_32: correct winner returns 3", () => {
    expect(
      calculateMatchPoints({ home_score: 2, away_score: 0 }, { home_score: 1, away_score: 0 }, config, "round_of_32")
    ).toBe(3);
  });

  it("round_of_16: exact score returns 13", () => {
    expect(
      calculateMatchPoints({ home_score: 2, away_score: 1 }, { home_score: 2, away_score: 1 }, config, "round_of_16")
    ).toBe(13);
  });

  it("quarter: exact score returns 16", () => {
    expect(
      calculateMatchPoints({ home_score: 1, away_score: 0 }, { home_score: 1, away_score: 0 }, config, "quarter")
    ).toBe(16);
  });

  it("semi: exact score returns 19", () => {
    expect(
      calculateMatchPoints({ home_score: 3, away_score: 2 }, { home_score: 3, away_score: 2 }, config, "semi")
    ).toBe(19);
  });

  it("third_place: exact score returns 16", () => {
    expect(
      calculateMatchPoints({ home_score: 2, away_score: 1 }, { home_score: 2, away_score: 1 }, config, "third_place")
    ).toBe(16);
  });

  it("final: exact score returns 23", () => {
    expect(
      calculateMatchPoints({ home_score: 1, away_score: 0 }, { home_score: 1, away_score: 0 }, config, "final")
    ).toBe(23);
  });

  it("final: correct winner returns 8", () => {
    expect(
      calculateMatchPoints({ home_score: 2, away_score: 0 }, { home_score: 1, away_score: 0 }, config, "final")
    ).toBe(8);
  });
});

// ─── Group predictions ────────────────────────────────────────────────────────

describe("calculateGroupPredictionPoints", () => {
  const actual = { first_place_team_id: "BRA", second_place_team_id: "ARG" };

  it("returns 4 when both teams are correct in right order", () => {
    expect(
      calculateGroupPredictionPoints({ first_place_team_id: "BRA", second_place_team_id: "ARG" }, actual, config)
    ).toBe(4);
  });

  it("returns 2 when both teams are correct but in wrong order", () => {
    expect(
      calculateGroupPredictionPoints({ first_place_team_id: "ARG", second_place_team_id: "BRA" }, actual, config)
    ).toBe(2);
  });

  it("returns 1 when only first place is correct", () => {
    expect(
      calculateGroupPredictionPoints({ first_place_team_id: "BRA", second_place_team_id: "ESP" }, actual, config)
    ).toBe(1);
  });

  it("returns 1 when only second place is correct", () => {
    expect(
      calculateGroupPredictionPoints({ first_place_team_id: "ESP", second_place_team_id: "ARG" }, actual, config)
    ).toBe(1);
  });

  it("returns 0 when neither team is correct", () => {
    expect(
      calculateGroupPredictionPoints({ first_place_team_id: "ESP", second_place_team_id: "FRA" }, actual, config)
    ).toBe(0);
  });

  it("returns 1 when predicted first is actual second (one cross match)", () => {
    expect(
      calculateGroupPredictionPoints({ first_place_team_id: "ARG", second_place_team_id: "ESP" }, actual, config)
    ).toBe(1);
  });
});

// ─── Tournament predictions ───────────────────────────────────────────────────

describe("calculateTournamentPoints", () => {
  const actual: import("@/lib/scoring/types").TournamentResult = {
    champion_team_id: "BRA",
    runner_up_team_id: "ARG",
    third_place_team_id: "FRA",
    top_scorer_player_id: "mbappe-id",
  };

  it("returns full points when all four are correct", () => {
    expect(
      calculateTournamentPoints(
        { champion_team_id: "BRA", runner_up_team_id: "ARG", third_place_team_id: "FRA", top_scorer_player_id: "mbappe-id" },
        actual,
        config
      )
    ).toBe(8 + 5 + 3 + 6); // 22
  });

  it("returns 8 for champion only", () => {
    expect(
      calculateTournamentPoints(
        { champion_team_id: "BRA", runner_up_team_id: "ESP", third_place_team_id: null, top_scorer_player_id: null },
        actual,
        config
      )
    ).toBe(8);
  });

  it("returns 0 when all wrong", () => {
    expect(
      calculateTournamentPoints(
        { champion_team_id: "ESP", runner_up_team_id: "GER", third_place_team_id: "ENG", top_scorer_player_id: "other-id" },
        actual,
        config
      )
    ).toBe(0);
  });

  it("returns 0 when all predictions are null", () => {
    expect(
      calculateTournamentPoints(
        { champion_team_id: null, runner_up_team_id: null, third_place_team_id: null, top_scorer_player_id: null },
        actual,
        config
      )
    ).toBe(0);
  });

  it("returns 6 for correct top scorer only", () => {
    expect(
      calculateTournamentPoints(
        { champion_team_id: null, runner_up_team_id: null, third_place_team_id: null, top_scorer_player_id: "mbappe-id" },
        actual,
        config
      )
    ).toBe(6);
  });
});
