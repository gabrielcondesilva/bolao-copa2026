import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BracketRound from "@/components/bracket-round";
import type { BracketMatchData } from "@/components/bracket-match";

const KNOCKOUT_ROUNDS = [
  { stage: "round_of_32", phaseKey: "round_of_32", label: "Oitavas de Final" },
  { stage: "round_of_16", phaseKey: "round_of_16", label: "Dezesseis avos" },
  { stage: "quarter",     phaseKey: "quarter",      label: "Quartas de Final" },
  { stage: "semi",        phaseKey: "semi",          label: "Semifinal" },
  { stage: "third_place", phaseKey: "third_final",   label: "3º Lugar" },
  { stage: "final",       phaseKey: "third_final",   label: "Final" },
];

export default async function ChaveamentoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stages = KNOCKOUT_ROUNDS.map((r) => r.stage);

  const [{ data: matches }, { data: predictions }, { data: phases }] = await Promise.all([
    supabase
      .from("matches")
      .select(`
        id, home_score, away_score, status, stage, scheduled_at,
        home_team:teams!matches_home_team_id_fkey(name, code, flag_url),
        away_team:teams!matches_away_team_id_fkey(name, code, flag_url)
      `)
      .in("stage", stages)
      .order("scheduled_at"),
    supabase
      .from("match_predictions")
      .select("match_id, home_score, away_score")
      .eq("user_id", user.id),
    supabase
      .from("phase_schedule")
      .select("phase_key, status"),
  ]);

  const matchList = (matches ?? []).map((m) => ({
    ...m,
    home_team: Array.isArray(m.home_team) ? m.home_team[0] ?? null : m.home_team,
    away_team: Array.isArray(m.away_team) ? m.away_team[0] ?? null : m.away_team,
  })) as BracketMatchData[];

  const phaseMap = new Map((phases ?? []).map((p) => [p.phase_key, p.status]));
  const predictionList = (predictions ?? []) as {
    match_id: string;
    home_score: number;
    away_score: number;
  }[];

  // Group matches by stage
  const matchesByStage = new Map<string, BracketMatchData[]>();
  for (const m of matchList) {
    const arr = matchesByStage.get(m.stage) ?? [];
    arr.push(m);
    matchesByStage.set(m.stage, arr);
  }

  // Filter rounds that have at least one match in DB
  const activeRounds = KNOCKOUT_ROUNDS.filter((r) => matchesByStage.has(r.stage));

  if (activeRounds.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Chaveamento</h1>
        <p className="text-sm text-muted">
          O chaveamento estará disponível após a fase de grupos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Chaveamento</h1>

      {/* Horizontal scroll on desktop, vertical sections on mobile */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-6 md:min-w-max">
          {activeRounds.map((round) => (
            <BracketRound
              key={round.stage}
              label={round.label}
              phaseKey={round.phaseKey}
              phaseOpen={phaseMap.get(round.phaseKey) === "open"}
              matches={matchesByStage.get(round.stage) ?? []}
              predictions={predictionList}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
