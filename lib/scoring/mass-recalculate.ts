"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { recalculateMatchPoints, recalculateGroupPredictions } from "./recalculate";

export type MassRecalculateResult = {
  matchesProcessed: number;
  groupsProcessed: number;
  errors: string[];
};

export async function massRecalculate(): Promise<MassRecalculateResult> {
  const admin = createAdminClient();
  const errors: string[] = [];

  // All finished matches in chronological order
  const { data: matches, error: matchesError } = await admin
    .from("matches")
    .select("id, group_id, stage")
    .eq("status", "finished")
    .order("scheduled_at");

  if (matchesError) throw new Error(matchesError.message);
  if (!matches?.length) return { matchesProcessed: 0, groupsProcessed: 0, errors: [] };

  let matchesProcessed = 0;
  for (const m of matches) {
    try {
      await recalculateMatchPoints(m.id);
      matchesProcessed++;
    } catch (err) {
      errors.push(`match ${m.id}: ${(err as Error).message}`);
    }
  }

  // Recalculate group predictions for groups where all 6 matches are done
  const groupIds = [
    ...new Set(
      matches.filter((m) => m.stage === "group" && m.group_id != null).map((m) => m.group_id!)
    ),
  ];

  let groupsProcessed = 0;
  for (const groupId of groupIds) {
    const { count } = await admin
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("status", "finished");

    if ((count ?? 0) >= 6) {
      try {
        await recalculateGroupPredictions(groupId);
        groupsProcessed++;
      } catch (err) {
        errors.push(`group ${groupId}: ${(err as Error).message}`);
      }
    }
  }

  await admin.from("audit_logs").insert({
    actor_id: null,
    action: "mass_recalculate",
    entity_type: "matches",
    entity_id: null,
    old_value: null,
    new_value: { matchesProcessed, groupsProcessed, errors: errors.length },
  });

  return { matchesProcessed, groupsProcessed, errors };
}
