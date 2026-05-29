-- Drops the broken cron job that was hardcoded to a foreign Supabase project.
-- Run setup-cron.sql after deploying edge functions to create the correct schedule.

SELECT cron.unschedule('scheduler-tick-every-minute');
