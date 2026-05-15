import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Service role client — bypasses RLS.
// NEVER import this file from browser-side code (app/(app)/*, components/*).
// Use only in Server Actions, API routes, and cron handlers.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
