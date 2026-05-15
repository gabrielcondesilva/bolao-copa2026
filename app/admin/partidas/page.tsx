import { createClient } from "@/lib/supabase/server";
import MatchResultForm from "./match-result-form";

export default async function AdminPartidasPage() {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id, stage, scheduled_at, home_score, away_score, status,
      home_team:teams!matches_home_team_id_fkey(name, code),
      away_team:teams!matches_away_team_id_fkey(name, code)
    `)
    .order("scheduled_at");

  const grouped = (matches ?? []).reduce<Record<string, typeof matches>>((acc, m) => {
    const stage = m.stage;
    if (!acc[stage]) acc[stage] = [];
    acc[stage]!.push(m);
    return acc;
  }, {});

  const stageOrder = ["group", "round_of_32", "round_of_16", "quarter", "semi", "third_place", "final"];
  const stageLabels: Record<string, string> = {
    group: "Fase de Grupos",
    round_of_32: "Oitavas de Final",
    round_of_16: "Dezesseis Avos",
    quarter: "Quartas de Final",
    semi: "Semifinal",
    third_place: "Terceiro Lugar",
    final: "Final",
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Resultados das Partidas</h1>

      {stageOrder.map((stage) => {
        const stageMatches = grouped[stage];
        if (!stageMatches?.length) return null;

        return (
          <section key={stage}>
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
              {stageLabels[stage]}
            </h2>
            <div className="space-y-2">
              {stageMatches.map((match) => (
                <MatchResultForm key={match.id} match={match} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
