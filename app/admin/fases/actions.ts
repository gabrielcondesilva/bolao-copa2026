"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function overridePhaseStatus(
  phaseId: string,
  status: "open" | "closed",
  reason: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    throw new Error("Sem permissão");
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("phase_schedule")
    .update({
      status,
      override_by: user.id,
      override_at: new Date().toISOString(),
      override_reason: reason || null,
    })
    .eq("id", phaseId);

  if (error) throw new Error(`Falha ao atualizar fase: ${error.message}`);

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: "override_phase_status",
    entity_type: "phase_schedule",
    entity_id: phaseId,
    old_value: null,
    new_value: { status, reason },
  });

  revalidatePath("/admin/fases");
}
