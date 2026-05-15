export type MatchStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter"
  | "semi"
  | "third_place"
  | "final";

export type MatchResult = { home_score: number; away_score: number };

export type GroupPrediction = {
  first_place_team_id: string;
  second_place_team_id: string;
};

export type TournamentPrediction = {
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  third_place_team_id: string | null;
  top_scorer_player_id: string | null;
};

export type TournamentResult = {
  champion_team_id: string;
  runner_up_team_id: string;
  third_place_team_id: string;
  top_scorer_player_id: string;
};

export type ScoringConfig = Record<string, number>;
