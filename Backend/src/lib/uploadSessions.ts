import { getSupabaseClient } from "./supabaseClient";

export interface UploadSession {
  id: number;
  session_token: string;
  created_at: string;
  last_activity_at: string;
}

// Creates the session if it doesn't exist yet, otherwise just bumps its
// last_activity_at. A single atomic upsert avoids a check-then-insert race
// between two requests for the same brand-new session token.
export const touchSession = async (
  sessionToken: string,
): Promise<UploadSession> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("upload_sessions")
    .upsert(
      {
        session_token: sessionToken,
        last_activity_at: new Date().toISOString(),
      },
      { onConflict: "session_token" },
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create/update upload session: ${error?.message ?? "no row returned"}`,
    );
  }
  return data as UploadSession;
};

export const getSessionByToken = async (
  sessionToken: string,
): Promise<UploadSession | null> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("upload_sessions")
    .select()
    .eq("session_token", sessionToken)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to look up upload session: ${error.message}`);
  }
  return data as UploadSession | null;
};
