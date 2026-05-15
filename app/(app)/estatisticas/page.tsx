import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StatCard, { type StatRow } from "@/components/stat-card";

function toStatRows(
  players: Array<{
    id: string;
    name: string;
    photo_url: string | null;
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    team: { name: string; code: string; flag_url: string | null } | null;
  }>,
  key: "goals" | "assists" | "yellow_cards" | "red_cards",
  top = 10
): StatRow[] {
  return players
    .filter((p) => p[key] > 0)
    .sort((a, b) => b[key] - a[key])
    .slice(0, top)
    .map((p, i) => ({
      rank: i + 1,
      player: { id: p.id, name: p.name, photo_url: p.photo_url },
      team: Array.isArray(p.team) ? (p.team[0] ?? null) : p.team,
      value: p[key],
    }));
}

export default async function EstatisticasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: players } = await supabase
    .from("players")
    .select(`
      id, name, photo_url, goals, assists, yellow_cards, red_cards,
      team:teams(name, code, flag_url)
    `)
    .or("goals.gt.0,assists.gt.0,yellow_cards.gt.0,red_cards.gt.0")
    .order("goals", { ascending: false });

  const list = (players ?? []).map((p) => ({
    ...p,
    team: Array.isArray(p.team) ? (p.team[0] ?? null) : p.team,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Estatísticas</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Artilheiros" unit="gols" rows={toStatRows(list, "goals")} />
        <StatCard title="Assistências" unit="ass." rows={toStatRows(list, "assists")} />
        <StatCard title="Cartões Amarelos" unit="CA" rows={toStatRows(list, "yellow_cards")} />
        <StatCard title="Cartões Vermelhos" unit="CV" rows={toStatRows(list, "red_cards")} />
      </div>
    </div>
  );
}
