"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["admin", "editor"].includes(profile.role)) {
    throw new Error("Sem permissão");
  }
  return { user };
}

export async function updatePlayerStats(formData: FormData) {
  await assertAdmin();
  const id = formData.get("id") as string;
  const goals = parseInt(formData.get("goals") as string, 10);
  const assists = parseInt(formData.get("assists") as string, 10);
  const yellow_cards = parseInt(formData.get("yellow_cards") as string, 10);
  const red_cards = parseInt(formData.get("red_cards") as string, 10);

  if (!id || isNaN(goals) || isNaN(assists) || isNaN(yellow_cards) || isNaN(red_cards)) {
    throw new Error("Dados inválidos");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("players")
    .update({ goals, assists, yellow_cards, red_cards })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/estatisticas");
  revalidatePath("/estatisticas");
}
