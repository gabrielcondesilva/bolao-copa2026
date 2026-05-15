import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PredictionsTabs from "./tabs";

export default async function PalpitesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: matches },
    { data: groups },
    { data: matchPredictions },
    { data: groupPredictions },
    { data: tournamentPrediction },
    { data: phases },
    { data: teams },
    { data: players },
  ] = await Promise.all([
    supabase
      .from("matches")
      .select(`
        id, scheduled_at, stage, group_id, status,
        home_team:teams!matches_home_team_id_fkey(id, name, code, flag_url),
        away_team:teams!matches_away_team_id_fkey(id, name, code, flag_url)
      `)
      .eq("stage", "group")
      .order("scheduled_at"),
    supabase.from("groups").select("id, name").order("name"),
    supabase
      .from("match_predictions")
      .select("match_id, home_score, away_score")
      .eq("user_id", user.id),
    supabase
      .from("group_predictions")
      .select("group_id, first_place_team_id, second_place_team_id")
      .eq("user_id", user.id),
    supabase
      .from("tournament_predictions")
      .select("champion_team_id, runner_up_team_id, third_place_team_id, top_scorer_player_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("phase_schedule")
      .select("id, phase_key, label, status, close_at, order_index")
      .order("order_index"),
    supabase
      .from("teams")
      .select("id, name, code, flag_url, group_id")
      .order("name"),
    supabase.from("players").select("id, name, team_id").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Palpites</h1>
      <PredictionsTabs
        initialPhases={phases ?? []}
        matches={matches ?? []}
        existingMatchPredictions={matchPredictions ?? []}
        groups={groups ?? []}
        existingGroupPredictions={groupPredictions ?? []}
        teams={teams ?? []}
        players={players ?? []}
        existingTournamentPrediction={tournamentPrediction ?? null}
      />
    </div>
  );
}
