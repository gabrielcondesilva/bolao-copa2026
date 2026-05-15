import { shouldSyncNow, syncMatches } from "@/lib/api-football/sync";

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return unauthorized();
  }

  try {
    const active = await shouldSyncNow();
    if (!active) {
      return Response.json({ ok: true, skipped: true, reason: "no active matches" });
    }

    const result = await syncMatches();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error("[sync-matches] cron error:", err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
