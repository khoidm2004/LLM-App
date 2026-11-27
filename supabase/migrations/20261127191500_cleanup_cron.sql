-- Schedules the cleanup-stale-sessions Edge Function to run every 10
-- minutes via pg_cron + pg_net. Requires the Edge Function already
-- deployed (supabase/functions/cleanup-stale-sessions).
--
-- The service role key AND the function URL (which embeds the project ref)
-- are stored in Vault rather than embedded directly in the cron job body,
-- since cron.job is otherwise queryable by anyone with database access,
-- and this file is committed to a public repo.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Run this once each, replacing the placeholders, from the SQL editor or
-- MCP execute_sql (not committed with real values in this file):
--   select vault.create_secret(
--     '<SERVICE_ROLE_KEY>',
--     'cleanup_stale_sessions_service_key'
--   );
--   select vault.create_secret(
--     'https://<project-ref>.supabase.co/functions/v1/cleanup-stale-sessions',
--     'cleanup_stale_sessions_function_url'
--   );

select cron.schedule(
  'cleanup-stale-upload-sessions',
  '*/10 * * * *',
  $$
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
    body := '{}'::jsonb
  );
  $$
);
