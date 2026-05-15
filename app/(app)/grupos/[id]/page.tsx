import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GroupTable from "@/components/group-table";
import MatchCard from "@/components/match-card";
import { computeStandings } from "@/lib/groups/standings";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: group }, { data: teams }, { data: matches }] = await Promise.all([
    supabase.from("groups").select("id, name").eq("id", id).single(),
    supabase
      .from("teams")
      .select("id, name, code, flag_url")
      .eq("group_id", id),
    supabase
      .from("matches")
      .select(`
        id, home_score, away_score, status, scheduled_at, stage,
        home_team_id, away_team_id,
        home_team:teams!matches_home_team_id_fkey(name, code, flag_url),
        away_team:teams!matches_away_team_id_fkey(name, code, flag_url)
      `)
      .eq("group_id", id)
      .order("scheduled_at"),
  ]);

  if (!group) notFound();

  const standings = computeStandings(teams ?? [], matches ?? []);

  const matchesForCard = (matches ?? []).map((m) => ({
    ...m,
    home_team: Array.isArray(m.home_team) ? m.home_team[0] ?? null : m.home_team,
    away_team: Array.isArray(m.away_team) ? m.away_team[0] ?? null : m.away_team,
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted mb-1">Grupo</p>
        <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
      </div>

      <section className="bg-surface rounded-xl border border-white/5 p-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">Classificação</h2>
        <GroupTable rows={standings} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Partidas</h2>
        {matchesForCard.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma partida agendada.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {matchesForCard.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
