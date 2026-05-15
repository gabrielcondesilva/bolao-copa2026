import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MatchCard from "@/components/match-card";

const STAGES = [
  { key: "all", label: "Todos" },
  { key: "group", label: "Grupos" },
  { key: "round_of_32", label: "Oitavas" },
  { key: "round_of_16", label: "Dezesseis avos" },
  { key: "quarter", label: "Quartas" },
  { key: "semi", label: "Semifinal" },
  { key: "third_place", label: "3º Lugar" },
  { key: "final", label: "Final" },
];

export default async function PartidasPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; date?: string }>;
}) {
  const { stage = "all", date } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("matches")
    .select(`
      id, home_score, away_score, status, scheduled_at, stage,
      home_team:teams!matches_home_team_id_fkey(name, code, flag_url),
      away_team:teams!matches_away_team_id_fkey(name, code, flag_url)
    `)
    .order("scheduled_at");

  if (stage && stage !== "all") {
    query = query.eq("stage", stage);
  }

  if (date) {
    // date is YYYY-MM-DD in BRT; convert to UTC range
    const startBRT = new Date(`${date}T00:00:00-03:00`);
    const endBRT = new Date(`${date}T23:59:59-03:00`);
    query = query
      .gte("scheduled_at", startBRT.toISOString())
      .lte("scheduled_at", endBRT.toISOString());
  }

  const { data: matches } = await query;

  const matchList = (matches ?? []).map((m) => ({
    ...m,
    home_team: Array.isArray(m.home_team) ? m.home_team[0] ?? null : m.home_team,
    away_team: Array.isArray(m.away_team) ? m.away_team[0] ?? null : m.away_team,
  }));

  // Group by date (BRT)
  const byDate = new Map<string, typeof matchList>();
  for (const m of matchList) {
    const dateKey = new Date(m.scheduled_at).toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    const existing = byDate.get(dateKey) ?? [];
    existing.push(m);
    byDate.set(dateKey, existing);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Partidas</h1>

      {/* Stage filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {STAGES.map(({ key, label }) => (
          <Link
            key={key}
            href={key === "all" ? "/partidas" : `/partidas?stage=${key}`}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              stage === key || (key === "all" && stage === "all")
                ? "bg-primary text-white"
                : "bg-surface text-muted hover:text-foreground border border-white/10"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Match list grouped by date */}
      {byDate.size === 0 ? (
        <p className="text-sm text-muted">Nenhuma partida encontrada.</p>
      ) : (
        <div className="space-y-8">
          {[...byDate.entries()].map(([dateLabel, dayMatches]) => (
            <section key={dateLabel} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted capitalize">
                {dateLabel}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {dayMatches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
