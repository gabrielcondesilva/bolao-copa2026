"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalculateMatchPoints } from "@/lib/scoring/recalculate";
import { revalidatePath } from "next/cache";

export async function saveMatchResult(matchId: string, homeScore: number, awayScore: number) {
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
    throw new Error("Placar inválido");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    throw new Error("Sem permissão");
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("matches")
    .select("home_score, away_score, status")
    .eq("id", matchId)
    .single();

  const { error } = await admin
    .from("matches")
    .update({ home_score: homeScore, away_score: awayScore, status: "finished" })
    .eq("id", matchId);

  if (error) throw new Error(`Falha ao salvar resultado: ${error.message}`);

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: "save_match_result",
    entity_type: "matches",
    entity_id: matchId,
    old_value: existing ? { home_score: existing.home_score, away_score: existing.away_score, status: existing.status } : null,
    new_value: { home_score: homeScore, away_score: awayScore, status: "finished" },
  });

  await recalculateMatchPoints(matchId);

  revalidatePath("/admin/partidas");
  revalidatePath("/dashboard");
}
