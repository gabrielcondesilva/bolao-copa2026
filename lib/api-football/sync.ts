import { createAdminClient } from "@/lib/supabase/admin";
import {
  recalculateMatchPoints,
  recalculateGroupPredictions,
} from "@/lib/scoring/recalculate";

// ─── API-Football response types ──────────────────────────────────────────────

type ApiFixture = {
  fixture: {
    id: number;
    status: { short: string; elapsed: number | null };
  };
  goals: { home: number | null; away: number | null };
};

type DbMatch = {
  id: string;
  external_id: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  stage: string;
  group_id: string | null;
};

export type SyncResult = {
  updated: number;
  skipped: number;
  errors: number;
  recalculated: number;
};

// ─── Status mapping ───────────────────────────────────────────────────────────

function mapStatus(short: string): "scheduled" | "live" | "finished" | null {
  if (["NS", "TBD"].includes(short)) return "scheduled";
  if (["1H", "HT", "2H", "ET", "BT", "P", "INT", "LIVE"].includes(short)) return "live";
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  // PST (postponed), CANC (cancelled), ABD, AWD, WO — don't update status
  return null;
}

// ─── shouldSyncNow ────────────────────────────────────────────────────────────
// Returns true only when there are live matches OR matches starting within 2h.
// This preserves the 100 req/day API-Football free tier budget.

export async function shouldSyncNow(): Promise<boolean> {
  const admin = createAdminClient();
  const windowEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const [{ data: live }, { data: upcoming }] = await Promise.all([
    admin.from("matches").select("id").eq("status", "live").limit(1),
    admin
      .from("matches")
      .select("id")
      .eq("status", "scheduled")
      .lte("scheduled_at", windowEnd)
      .limit(1),
  ]);

  return (live?.length ?? 0) > 0 || (upcoming?.length ?? 0) > 0;
}

// ─── fetchFixtures ────────────────────────────────────────────────────────────

async function fetchFixtures(date: string): Promise<ApiFixture[]> {
  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST ?? "api-football-v1.p.rapidapi.com";
  const league = process.env.API_FOOTBALL_LEAGUE_ID ?? "1";
  const season = process.env.API_FOOTBALL_SEASON ?? "2026";

  if (!key) {
    console.warn("[sync-matches] RAPIDAPI_KEY not set — skipping API call");
    return [];
  }

  const url = `https://${host}/v3/fixtures?league=${league}&season=${season}&date=${date}`;

  const res = await fetch(url, {
    headers: { "x-rapidapi-key": key, "x-rapidapi-host": host },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`[sync-matches] API error ${res.status}: ${res.statusText}`);
    return [];
  }

  const json = await res.json() as { response?: ApiFixture[] };
  return json.response ?? [];
}

// ─── syncMatches ─────────────────────────────────────────────────────────────

export async function syncMatches(): Promise<SyncResult> {
  const admin = createAdminClient();

  // Fetch today's fixtures (UTC date)
  const today = new Date().toISOString().slice(0, 10);
  const fixtures = await fetchFixtures(today);

  if (fixtures.length === 0) {
    return { updated: 0, skipped: 0, errors: 0, recalculated: 0 };
  }

  // Build a map of external_id → DB match in a single query
  const externalIds = fixtures.map((f) => String(f.fixture.id));
  const { data: dbMatches } = await admin
    .from("matches")
    .select("id, external_id, home_score, away_score, status, stage, group_id")
    .in("external_id", externalIds);

  const dbMatchMap = new Map<string, DbMatch>(
    (dbMatches ?? [])
      .filter((m): m is DbMatch & { external_id: string } => m.external_id !== null)
      .map((m) => [m.external_id, m])
  );

  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let recalculated = 0;

  for (const fixture of fixtures) {
    const extId = String(fixture.fixture.id);
    const dbMatch = dbMatchMap.get(extId);

    if (!dbMatch) {
      // Placeholder knockout match or unknown fixture — skip
      skipped++;
      continue;
    }

    const newStatus = mapStatus(fixture.fixture.status.short);
    if (!newStatus) {
      // Postponed / cancelled — leave DB unchanged
      skipped++;
      continue;
    }

    const newHome = fixture.goals.home;
    const newAway = fixture.goals.away;

    const statusUnchanged = dbMatch.status === newStatus;
    const scoresUnchanged = dbMatch.home_score === newHome && dbMatch.away_score === newAway;
    if (statusUnchanged && scoresUnchanged) {
      skipped++;
      continue;
    }

    const wasFinished = dbMatch.status === "finished";
    const nowFinished = newStatus === "finished";

    // ── Update match in DB ────────────────────────────────────────────────
    const { error: updateErr } = await admin
      .from("matches")
      .update({ status: newStatus, home_score: newHome, away_score: newAway })
      .eq("id", dbMatch.id);

    if (updateErr) {
      console.error(`[sync-matches] update failed for ${dbMatch.id}:`, updateErr.message);
      errors++;
      continue;
    }

    updated++;

    // ── Trigger scoring only when a match becomes finished for the first time ──
    if (!wasFinished && nowFinished && newHome !== null && newAway !== null) {
      try {
        await recalculateMatchPoints(dbMatch.id);
        recalculated++;
      } catch (err) {
        console.error(`[sync-matches] recalculateMatchPoints failed for ${dbMatch.id}:`, err);
        errors++;
      }

      // If this is a group-stage match, check whether the entire group is now done
      if (dbMatch.stage === "group" && dbMatch.group_id) {
        const { count } = await admin
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("group_id", dbMatch.group_id)
          .neq("status", "finished");

        if (count === 0) {
          try {
            await recalculateGroupPredictions(dbMatch.group_id);
            recalculated++;
          } catch (err) {
            console.error(
              `[sync-matches] recalculateGroupPredictions failed for group ${dbMatch.group_id}:`,
              err
            );
            errors++;
          }
        }
      }
    }
  }

  return { updated, skipped, errors, recalculated };
}
