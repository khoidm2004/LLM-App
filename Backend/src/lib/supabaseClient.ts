import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const MEETING_DOCUMENTS_BUCKET = "meeting-documents";

let client: SupabaseClient | null = null;

// Service-role client: full access, bypasses RLS. Only ever used from this
// backend; every request that reaches it must already be scoped to the
// caller's own session by the route handler. Lazily created so a missing
// Supabase config doesn't crash routes that don't need it (e.g. the
// existing /api/summarize endpoint).
export const getSupabaseClient = (): SupabaseClient => {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use " +
        "document upload/summarization. Never expose the service role key " +
        "to the frontend — it bypasses RLS.",
    );
  }

  client = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
  return client;
};
