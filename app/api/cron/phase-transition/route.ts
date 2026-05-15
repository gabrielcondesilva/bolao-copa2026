import { createAdminClient } from "@/lib/supabase/admin";

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return unauthorized();
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const transitions: Array<{ phaseKey: string; from: string; to: string }> = [];

  // ── 1. Pending → Open: phases whose open_at has arrived ──────────────────
  const { data: toOpen } = await admin
    .from("phase_schedule")
    .select("id, phase_key")
    .eq("status", "pending")
    .not("open_at", "is", null)
    .lte("open_at", now);

  for (const phase of toOpen ?? []) {
    const { error } = await admin
      .from("phase_schedule")
      .update({ status: "open" })
      .eq("id", phase.id);

    if (error) {
      console.error(`[phase-transition] failed to open ${phase.phase_key}:`, error.message);
      continue;
    }

    transitions.push({ phaseKey: phase.phase_key, from: "pending", to: "open" });

    await admin.from("audit_logs").insert({
      actor_id: null,
      action: "auto_phase_transition",
      entity_type: "phase_schedule",
      entity_id: phase.id,
      old_value: { status: "pending" },
      new_value: { status: "open" },
    });
  }

  // ── 2. Open → Closed: phases whose close_at has arrived ──────────────────
  const { data: toClose } = await admin
    .from("phase_schedule")
    .select("id, phase_key")
    .eq("status", "open")
    .not("close_at", "is", null)
    .lte("close_at", now);

  for (const phase of toClose ?? []) {
    const { error } = await admin
      .from("phase_schedule")
      .update({ status: "closed" })
      .eq("id", phase.id);

    if (error) {
      console.error(`[phase-transition] failed to close ${phase.phase_key}:`, error.message);
      continue;
    }

    transitions.push({ phaseKey: phase.phase_key, from: "open", to: "closed" });

    await admin.from("audit_logs").insert({
      actor_id: null,
      action: "auto_phase_transition",
      entity_type: "phase_schedule",
      entity_id: phase.id,
      old_value: { status: "open" },
      new_value: { status: "closed" },
    });
  }

  return Response.json({ ok: true, transitions });
}
