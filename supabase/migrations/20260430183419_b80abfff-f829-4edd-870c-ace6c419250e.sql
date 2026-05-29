SELECT cron.schedule(
  'scheduler-tick-every-minute',
  '* * * * *',
  $$SELECT net.http_post(
    url:='https://knanstydicpqfwbyiodh.supabase.co/functions/v1/scheduler-tick',
    headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuYW5zdHlkaWNwcWZ3Ynlpb2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTU1NTQsImV4cCI6MjA4MTM5MTU1NH0.C9ztrizFiWDk2g7nao0_U8q66Ic8pVokoY9Gyhf5Hlw"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;$$
);