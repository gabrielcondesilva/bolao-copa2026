import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GroupTable from "@/components/group-table";
import { computeStandings } from "@/lib/groups/standings";

export default async function GruposPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: groups }, { data: teams }, { data: matches }] = await Promise.all([
    supabase.from("groups").select("id, name").order("name"),
    supabase.from("teams").select("id, name, code, flag_url, group_id"),
    supabase
      .from("matches")
      .select("home_team_id, away_team_id, home_score, away_score, status, group_id")
      .eq("stage", "group"),
  ]);

  const groupList = groups ?? [];
  const teamList = teams ?? [];
  const matchList = matches ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Grupos</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groupList.map((group) => {
          const groupTeams = teamList.filter((t) => t.group_id === group.id);
          const groupMatches = matchList.filter((m) => m.group_id === group.id);
          const standings = computeStandings(groupTeams, groupMatches);

          return (
            <Link
              key={group.id}
              href={`/grupos/${group.id}`}
              className="block bg-surface rounded-xl border border-white/5 p-4 hover:border-white/20 transition-colors"
            >
              <h2 className="text-sm font-semibold text-foreground mb-3">
                Grupo {group.name}
              </h2>
              <GroupTable rows={standings} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
