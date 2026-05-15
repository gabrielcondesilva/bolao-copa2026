import { createAdminClient } from "@/lib/supabase/admin";

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return unauthorized();
  }

  const admin = createAdminClient();

  // Fetch all active profiles ordered by current ranking
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, total_points")
    .eq("is_active", true)
    .order("total_points", { ascending: false });

  if (error) {
    console.error("[snapshot-positions] fetch failed:", error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!profiles?.length) {
    return Response.json({ ok: true, updated: 0 });
  }

  // Write current rank into position_yesterday for each profile.
  // Done sequentially — small player count (~20) makes batching unnecessary.
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < profiles.length; i++) {
    const { error: updateErr } = await admin
      .from("profiles")
      .update({ position_yesterday: i + 1 })
      .eq("id", profiles[i].id);

    if (updateErr) {
      console.error(`[snapshot-positions] update failed for ${profiles[i].id}:`, updateErr.message);
      errors++;
    } else {
      updated++;
    }
  }

  await admin.from("audit_logs").insert({
    actor_id: null,
    action: "snapshot_positions",
    entity_type: "profiles",
    entity_id: null,
    old_value: null,
    new_value: { profiles_updated: updated, errors },
  });

  return Response.json({ ok: true, updated, errors });
}
