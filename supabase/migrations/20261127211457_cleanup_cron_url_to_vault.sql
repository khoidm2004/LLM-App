-- Moves the Edge Function URL (which embeds the project ref) out of the
-- cron job command and into Vault, alongside the service role key. The
-- URL was previously hardcoded
-- here, which meant the project ref was readable by anyone with database
-- access (cron.job is queryable) and, more importantly, sat in plain text
-- in this file in a public repo. No functional change otherwise: same
-- schedule, same headers, same 15s timeout.
--
-- Run this once before applying, from the SQL editor or MCP execute_sql
-- (not committed with a real value in this file):
--   select vault.create_secret(
--     'https://<project-ref>.supabase.co/functions/v1/cleanup-stale-sessions',
--     'cleanup_stale_sessions_function_url'
--   );

select cron.alter_job(
  (select jobid from cron.job where jobname = 'cleanup-stale-upload-sessions'),
  command := $$
  select net.http_post(
    url := (
      select decrypted_secret from vault.decrypted_secrets
      where name = 'cleanup_stale_sessions_function_url'
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'cleanup_stale_sessions_service_key'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  );
  $$
);
