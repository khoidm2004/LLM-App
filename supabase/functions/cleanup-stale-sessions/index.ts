// Scheduled cleanup for the meeting-document upload feature.
//
// Invoked by a pg_cron job (every 10 minutes, see
// supabase/migrations/20261127191500_cleanup_cron.sql) rather than by the
// client, so cleanup happens even if nobody's browser is open. Finds
// upload_sessions idle for more than 20 minutes, deletes their files from
// the private "meeting-documents" bucket, then deletes the session row
// (uploaded_files/summaries cascade via FK on delete cascade).
import { createClient } from "jsr:@supabase/supabase-js@2";

const STALE_AFTER_MINUTES = 20;
const BUCKET = "meeting-documents";

interface StaleSession {
  id: number;
  session_token: string;
}

interface CleanupResult {
  sessionToken: string;
  filesRemoved: number;
  error?: string;
}

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const cutoff = new Date(
    Date.now() - STALE_AFTER_MINUTES * 60 * 1000,
  ).toISOString();

  const { data: staleSessions, error: selectError } = await supabase
    .from("upload_sessions")
    .select("id, session_token")
    .lt("last_activity_at", cutoff);

  if (selectError) {
    return new Response(JSON.stringify({ error: selectError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results: CleanupResult[] = [];

  for (const session of (staleSessions ?? []) as StaleSession[]) {
    try {
      const { data: objects, error: listError } = await supabase.storage
        .from(BUCKET)
        .list(session.session_token);

      if (listError) throw listError;

      const paths = (objects ?? []).map(
        (object) => `${session.session_token}/${object.name}`,
      );

      if (paths.length > 0) {
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove(paths);
        if (removeError) throw removeError;
      }

      // uploaded_files/summaries rows cascade-delete with this.
      const { error: deleteError } = await supabase
        .from("upload_sessions")
        .delete()
        .eq("id", session.id);

      if (deleteError) throw deleteError;

      results.push({
        sessionToken: session.session_token,
        filesRemoved: paths.length,
      });
    } catch (error) {
      results.push({
        sessionToken: session.session_token,
        filesRemoved: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return new Response(JSON.stringify({ cleaned: results.length, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
