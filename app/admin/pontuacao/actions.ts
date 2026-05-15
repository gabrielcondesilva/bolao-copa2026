"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { massRecalculate } from "@/lib/scoring/mass-recalculate";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") throw new Error("Sem permissão");
}

export async function updateScoringRule(formData: FormData) {
  await assertAdmin();
  const id = formData.get("id") as string;
  const points = parseInt(formData.get("points") as string, 10);
  if (!id || isNaN(points)) throw new Error("Dados inválidos");

  const admin = createAdminClient();
  const { error } = await admin
    .from("scoring_config")
    .update({ points })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/pontuacao");
}

export async function triggerMassRecalculate(): Promise<{
  matchesProcessed: number;
  groupsProcessed: number;
  errors: string[];
}> {
  await assertAdmin();
  return massRecalculate();
}
