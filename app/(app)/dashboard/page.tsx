import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RealtimeLeaderboard from "@/components/realtime-leaderboard";
import RealtimeMatchCard, { type MatchData } from "@/components/realtime-match-card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: leaderboard },
    { data: liveMatches },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, role, total_points, position_yesterday")
      .eq("id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("id, name, avatar_url, total_points, position_yesterday")
      .eq("is_active", true)
      .order("total_points", { ascending: false })
      .limit(50),
    supabase
      .from("matches")
      .select(`
        id, home_score, away_score, status, scheduled_at, stage,
        home_team:teams!matches_home_team_id_fkey(name, code, flag_url),
        away_team:teams!matches_away_team_id_fkey(name, code, flag_url)
      `)
      .in("status", ["live", "finished"])
      .order("scheduled_at", { ascending: false })
      .limit(5),
  ]);

  // Rank the current user in the sorted list (used in the greeting)
  const sorted = [...(leaderboard ?? [])].sort(
    (a, b) => b.total_points - a.total_points || a.id.localeCompare(b.id)
  );
  const userRank = sorted.findIndex((p) => p.id === user.id) + 1;

  const recentMatches = (liveMatches ?? []) as MatchData[];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {profile?.name ?? "jogador"}
        </h1>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-muted text-sm">
            <span className="text-primary font-semibold">
              {profile?.total_points ?? 0} pts
            </span>
          </p>
          {userRank > 0 && (
            <p className="text-muted text-sm">
              {userRank}º lugar
              {profile?.position_yesterday != null &&
                profile.position_yesterday !== userRank && (
                  <span
                    className={`ml-1 text-xs font-semibold ${
                      userRank < profile.position_yesterday
                        ? "text-success"
                        : "text-accent"
                    }`}
                  >
                    {userRank < profile.position_yesterday
                      ? `▲${profile.position_yesterday - userRank}`
                      : `▼${userRank - profile.position_yesterday}`}
                  </span>
                )}
            </p>
          )}
        </div>
      </div>

      {/* Live / recent matches */}
      {recentMatches.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            {recentMatches.some((m) => m.status === "live")
              ? "Ao vivo agora"
              : "Últimas partidas"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {recentMatches.map((m) => (
              <RealtimeMatchCard key={m.id} initialMatch={m} />
            ))}
          </div>
        </section>
      )}

      {/* Leaderboard */}
      <RealtimeLeaderboard
        initial={leaderboard ?? []}
        currentUserId={user.id}
      />
    </div>
  );
}
