import type {
  MatchResult,
  MatchStage,
  GroupPrediction,
  TournamentPrediction,
  TournamentResult,
  ScoringConfig,
} from "./types";

type Winner = "home" | "away" | "draw";

function getWinner(result: MatchResult): Winner {
  if (result.home_score > result.away_score) return "home";
  if (result.away_score > result.home_score) return "away";
  return "draw";
}

function stageKey(stage: MatchStage): string {
  // Maps stage to scoring_config rule_key suffix
  if (stage === "third_place") return "third";
  return stage; // group, round_of_32, round_of_16, quarter, semi, final
}

/**
 * Calculate points for a single match prediction.
 * exact_score config values already include the winner bonus (accumulated).
 * e.g. exact_score_group = 7 (2 winner + 5 bonus)
 */
export function calculateMatchPoints(
  prediction: MatchResult,
  result: MatchResult,
  config: ScoringConfig,
  stage: MatchStage
): number {
  const key = stageKey(stage);
  const isExact =
    prediction.home_score === result.home_score &&
    prediction.away_score === result.away_score;

  if (isExact) {
    return config[`exact_score_${key}`] ?? 0;
  }

  const predWinner = getWinner(prediction);
  const actualWinner = getWinner(result);

  if (predWinner === actualWinner) {
    return config[`match_winner_${key}`] ?? 0;
  }

  return 0;
}

/**
 * Calculate points for a group classification prediction.
 * Rules (from scoring_config):
 *   group_both_correct_order  — both teams correct, right positions
 *   group_both_wrong_order    — both teams correct, swapped positions
 *   group_one_correct         — only one team correct (any position)
 */
export function calculateGroupPredictionPoints(
  prediction: GroupPrediction,
  actual: GroupPrediction,
  config: ScoringConfig
): number {
  const predFirst = prediction.first_place_team_id;
  const predSecond = prediction.second_place_team_id;
  const actualFirst = actual.first_place_team_id;
  const actualSecond = actual.second_place_team_id;

  const firstMatch = predFirst === actualFirst;
  const secondMatch = predSecond === actualSecond;
  const crossFirst = predFirst === actualSecond;
  const crossSecond = predSecond === actualFirst;

  if (firstMatch && secondMatch) {
    return config["group_both_correct_order"] ?? 0;
  }

  if (crossFirst && crossSecond) {
    return config["group_both_wrong_order"] ?? 0;
  }

  if (firstMatch || secondMatch || crossFirst || crossSecond) {
    return config["group_one_correct"] ?? 0;
  }

  return 0;
}

/**
 * Calculate points for tournament-level predictions (champion, runner-up, etc.)
 */
export function calculateTournamentPoints(
  prediction: TournamentPrediction,
  actual: TournamentResult,
  config: ScoringConfig
): number {
  let points = 0;

  if (
    prediction.champion_team_id &&
    prediction.champion_team_id === actual.champion_team_id
  ) {
    points += config["champion"] ?? 0;
  }

  if (
    prediction.runner_up_team_id &&
    prediction.runner_up_team_id === actual.runner_up_team_id
  ) {
    points += config["runner_up"] ?? 0;
  }

  if (
    prediction.third_place_team_id &&
    prediction.third_place_team_id === actual.third_place_team_id
  ) {
    points += config["third_place_tournament"] ?? 0;
  }

  if (
    prediction.top_scorer_player_id &&
    prediction.top_scorer_player_id === actual.top_scorer_player_id
  ) {
    points += config["top_scorer"] ?? 0;
  }

  return points;
}
