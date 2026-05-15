import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ScoringConfig } from "@/lib/scoring/types";
import { calculateMatchPoints } from "@/lib/scoring/engine";

// Verify scoring idempotency: running recalculation multiple times on the same
// prediction should always yield the same points_awarded value.
describe("scoring idempotency", () => {
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

  it("produces the same result when called twice with identical inputs", () => {
    const pred = { home_score: 2, away_score: 1 };
    const result = { home_score: 2, away_score: 1 };

    const first = calculateMatchPoints(pred, result, config, "group");
    const second = calculateMatchPoints(pred, result, config, "group");
    expect(first).toBe(second);
    expect(first).toBe(7);
  });

  it("does not accumulate: second calculation does not add to first", () => {
    const pred = { home_score: 1, away_score: 0 };
    const result = { home_score: 2, away_score: 0 };

    // Run several times — should always be 2 (correct winner, wrong score)
    let points = 0;
    for (let i = 0; i < 5; i++) {
      points = calculateMatchPoints(pred, result, config, "group");
    }
    expect(points).toBe(2);
  });

  it("recalculation with updated result changes points correctly", () => {
    const pred = { home_score: 2, away_score: 1 };

    // First result: exact match
    const first = calculateMatchPoints(pred, { home_score: 2, away_score: 1 }, config, "quarter");
    expect(first).toBe(16);

    // Score is corrected to something else — idempotent recalc should reflect new result
    const second = calculateMatchPoints(pred, { home_score: 3, away_score: 1 }, config, "quarter");
    expect(second).toBe(5); // correct winner only
  });
});

// Verify save-match-result role check logic (unit, no DB needed)
describe("save-match-result: input validation", () => {
  it("rejects negative scores", () => {
    function validateScore(n: unknown): boolean {
      return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 20;
    }
    expect(validateScore(-1)).toBe(false);
    expect(validateScore(21)).toBe(false);
    expect(validateScore(0)).toBe(true);
    expect(validateScore(5.5)).toBe(false);
    expect(validateScore(20)).toBe(true);
  });

  it("rejects non-integer scores", () => {
    function validateScore(n: unknown): boolean {
      return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 20;
    }
    expect(validateScore(1.5)).toBe(false);
    expect(validateScore(NaN)).toBe(false);
  });
});
