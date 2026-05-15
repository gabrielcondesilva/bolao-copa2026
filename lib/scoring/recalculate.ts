"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateMatchPoints,
  calculateGroupPredictionPoints,
} from "./engine";
import type { MatchStage, ScoringConfig } from "./types";

type AdminClient = ReturnType<typeof createAdminClient>;

async function getScoringConfig(supabase: AdminClient): Promise<ScoringConfig> {
  const { data, error } = await supabase.from("scoring_config").select("rule_key, points");
  if (error) throw new Error(`Failed to fetch scoring_config: ${error.message}`);
  return Object.fromEntries((data ?? []).map((r) => [r.rule_key, r.points]));
}

/**
 * Idempotent — safe to call multiple times on the same match.
 * Always OVERWRITEs points_awarded, never accumulates.
 */
export async function recalculateMatchPoints(matchId: string): Promise<void> {
  const supabase = createAdminClient();

  // 1. Fetch match — must be finished with scores
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, home_score, away_score, stage, status")
    .eq("id", matchId)
    .single();

  if (matchError || !match) throw new Error(`Match ${matchId} not found`);
  if (match.status !== "finished") return;
  if (match.home_score === null || match.away_score === null) return;

  const config = await getScoringConfig(supabase);
  const result = { home_score: match.home_score, away_score: match.away_score };
  const stage = match.stage as MatchStage;

  // 2. Fetch all predictions for this match
  const { data: predictions, error: predError } = await supabase
    .from("match_predictions")
    .select("id, user_id, home_score, away_score")
    .eq("match_id", matchId);

  if (predError) throw new Error(`Failed to fetch predictions: ${predError.message}`);
  if (!predictions?.length) return;

  // 3. Calculate and batch-update points_awarded in parallel (overwrite)
  const updates = predictions.map((pred) => ({
    id: pred.id,
    points_awarded: calculateMatchPoints(
      { home_score: pred.home_score, away_score: pred.away_score },
      result,
      config,
      stage
    ),
  }));

  const results = await Promise.all(
    updates.map((u) =>
      supabase.from("match_predictions")
        .update({ points_awarded: u.points_awarded })
        .eq("id", u.id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(`Failed to update prediction: ${failed.error.message}`);

  // 4. Write audit log
  await supabase.from("audit_logs").insert({
    actor_id: null,
    action: "recalculate_match_points",
    entity_type: "matches",
    entity_id: matchId,
    old_value: null,
    new_value: { predictions_updated: updates.length },
  });
}

/**
 * Recalculate group classification predictions for a given group.
 * Call after all 6 group stage matches for that group are finished.
 */
export async function recalculateGroupPredictions(groupId: string): Promise<void> {
  const supabase = createAdminClient();

  // Determine actual 1st and 2nd place from matches
  const { data: matches } = await supabase
    .from("matches")
    .select("home_team_id, away_team_id, home_score, away_score, status")
    .eq("group_id", groupId)
    .eq("status", "finished");

  if (!matches?.length) return;

  // Build standings: points + GD
  const standings: Record<string, { points: number; gd: number }> = {};
  for (const m of matches) {
    if (m.home_score === null || m.away_score === null) continue;
    const home = m.home_team_id!;
    const away = m.away_team_id!;
    if (!standings[home]) standings[home] = { points: 0, gd: 0 };
    if (!standings[away]) standings[away] = { points: 0, gd: 0 };

    const gd = m.home_score - m.away_score;
    standings[home].gd += gd;
    standings[away].gd -= gd;

    if (m.home_score > m.away_score) {
      standings[home].points += 3;
    } else if (m.away_score > m.home_score) {
      standings[away].points += 3;
    } else {
      standings[home].points += 1;
      standings[away].points += 1;
    }
  }

  const sorted = Object.entries(standings).sort(
    ([, a], [, b]) => b.points - a.points || b.gd - a.gd
  );

  if (sorted.length < 2) return;
  const actual = {
    first_place_team_id: sorted[0][0],
    second_place_team_id: sorted[1][0],
  };

  const config = await getScoringConfig(supabase);

  const { data: predictions } = await supabase
    .from("group_predictions")
    .select("id, first_place_team_id, second_place_team_id")
    .eq("group_id", groupId);

  if (!predictions?.length) return;

  // Update all group predictions in parallel
  await Promise.all(
    predictions.map((pred) => {
      const points = calculateGroupPredictionPoints(
        {
          first_place_team_id: pred.first_place_team_id ?? "",
          second_place_team_id: pred.second_place_team_id ?? "",
        },
        actual,
        config
      );
      return supabase.from("group_predictions")
        .update({ points_awarded: points })
        .eq("id", pred.id);
    })
  );
}
