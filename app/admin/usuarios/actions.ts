"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Apenas admins podem gerenciar usuários");
  return user;
}

export async function inviteUser(formData: FormData) {
  const actor = await requireAdmin();
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const role = (formData.get("role") as string) || "player";

  const admin = createAdminClient();

  const { data: invite, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name },
  });

  if (error) throw new Error(`Falha ao convidar: ${error.message}`);

  // Role must be stored in app_metadata (not user_metadata) so the
  // handle_new_user trigger reads it from raw_app_meta_data.
  if (invite.user) {
    await admin.auth.admin.updateUserById(invite.user.id, {
      app_metadata: { role },
    });
  }

  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: "invite_user",
    entity_type: "profiles",
    entity_id: null,
    old_value: null,
    new_value: { email, name, role },
  });

  revalidatePath("/admin/usuarios");
}

export async function setUserActive(userId: string, isActive: boolean) {
  const actor = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) throw new Error(`Falha ao atualizar usuário: ${error.message}`);

  if (!isActive) {
    await admin.auth.admin.updateUserById(userId, { ban_duration: "876600h" });
  } else {
    await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  }

  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: isActive ? "activate_user" : "deactivate_user",
    entity_type: "profiles",
    entity_id: userId,
    old_value: null,
    new_value: { is_active: isActive },
  });

  revalidatePath("/admin/usuarios");
}
