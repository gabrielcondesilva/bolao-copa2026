"use server";

import { createClient } from "@/lib/supabase/server";

function isValidScore(n: number): boolean {
  return Number.isInteger(n) && n >= 0 && n <= 20;
}

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return { user, supabase };
}

async function assertPhaseOpen(supabase: Awaited<ReturnType<typeof createClient>>, phaseKey: string) {
  const { data: phase } = await supabase
    .from("phase_schedule")
    .select("status")
    .eq("phase_key", phaseKey)
    .single();
  if (!phase || phase.status !== "open") {
    throw new Error("Fase fechada. Palpites não podem ser alterados.");
  }
}

// ─── Match predictions ────────────────────────────────────────────────────────

export async function saveMatchPredictions(
  phaseKey: string,
  predictions: Array<{ matchId: string; homeScore: number; awayScore: number }>
): Promise<{ saved: number; failed: Array<{ matchId: string; error: string }> }> {
  const { user, supabase } = await getAuthUser();
  await assertPhaseOpen(supabase, phaseKey);

  // Validate all matches in a single query
  const { data: matches } = await supabase
    .from("matches")
    .select("id, status, scheduled_at")
    .in("id", predictions.map((p) => p.matchId));

  const matchMap = new Map((matches ?? []).map((m) => [m.id, m]));
  const now = new Date();

  const failed: Array<{ matchId: string; error: string }> = [];
  const valid: Array<{ user_id: string; match_id: string; home_score: number; away_score: number }> = [];

  for (const p of predictions) {
    if (!isValidScore(p.homeScore) || !isValidScore(p.awayScore)) {
      failed.push({ matchId: p.matchId, error: "Placar inválido" });
      continue;
    }
    const match = matchMap.get(p.matchId);
    if (!match) {
      failed.push({ matchId: p.matchId, error: "Partida não encontrada" });
      continue;
    }
    if (match.status !== "scheduled") {
      failed.push({ matchId: p.matchId, error: "Partida já iniciou" });
      continue;
    }
    if (new Date(match.scheduled_at) <= now) {
      failed.push({ matchId: p.matchId, error: "Prazo encerrado" });
      continue;
    }
    valid.push({ user_id: user.id, match_id: p.matchId, home_score: p.homeScore, away_score: p.awayScore });
  }

  if (valid.length > 0) {
    // Use the user client so RLS enforces phase-open check atomically
    const { error } = await supabase
      .from("match_predictions")
      .upsert(valid, { onConflict: "user_id,match_id" });
    if (error) throw new Error(`Falha ao salvar: ${error.message}`);
  }

  return { saved: valid.length, failed };
}

// ─── Group predictions ────────────────────────────────────────────────────────

export async function saveGroupPrediction(
  groupId: string,
  firstPlaceTeamId: string | null,
  secondPlaceTeamId: string | null
): Promise<void> {
  const { user, supabase } = await getAuthUser();
  await assertPhaseOpen(supabase, "group");

  const { error } = await supabase
    .from("group_predictions")
    .upsert(
      { user_id: user.id, group_id: groupId, first_place_team_id: firstPlaceTeamId, second_place_team_id: secondPlaceTeamId },
      { onConflict: "user_id,group_id" }
    );

  if (error) throw new Error(`Falha ao salvar palpite de grupo: ${error.message}`);
}

// ─── Tournament predictions ───────────────────────────────────────────────────

export async function saveTournamentPrediction(data: {
  championTeamId: string | null;
  runnerUpTeamId: string | null;
  thirdPlaceTeamId: string | null;
  topScorerPlayerId: string | null;
}): Promise<void> {
  const { user, supabase } = await getAuthUser();
  await assertPhaseOpen(supabase, "group");

  const { error } = await supabase
    .from("tournament_predictions")
    .upsert(
      {
        user_id: user.id,
        champion_team_id: data.championTeamId,
        runner_up_team_id: data.runnerUpTeamId,
        third_place_team_id: data.thirdPlaceTeamId,
        top_scorer_player_id: data.topScorerPlayerId,
      },
      { onConflict: "user_id" }
    );

  if (error) throw new Error(`Falha ao salvar palpite de torneio: ${error.message}`);
}
