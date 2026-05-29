-- ============================================================
-- setup-cron.sql
-- Run this in your Supabase SQL Editor AFTER deploying edge functions.
-- Replace YOUR_PROJECT_REF with your actual Supabase project ref.
-- ============================================================

-- Enable extensions (should already be enabled by migrations)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create or replace the cron schedule
SELECT cron.unschedule('scheduler-tick-every-minute');

SELECT cron.schedule(
  'scheduler-tick-every-minute',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/scheduler-tick',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Verify
SELECT * FROM cron.job WHERE jobname = 'scheduler-tick-every-minute';
