-- The first scheduled run of cleanup-stale-upload-sessions timed out at
-- pg_net's default 5000ms (net._http_response.error_msg: "Timeout of 5000
-- ms reached" / timed_out = true), most likely an Edge Function cold
-- start. Raise the timeout to 15s so a cold start doesn't get killed
-- mid-flight.
select cron.alter_job(
  (select jobid from cron.job where jobname = 'cleanup-stale-upload-sessions'),
  command := $$
  select net.http_post(
    url := 'https://mperhmypqmzbhngpieyf.supabase.co/functions/v1/cleanup-stale-sessions',
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
