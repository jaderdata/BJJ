/*
  AUTO-FINISH LONG VISITS JOB
  
  This script sets up a database function and a cron job (via pg_cron) 
  to automatically finalize visits that have been running for more than 1 hour.
*/

-- 1. Create the function to find and finish long visits
CREATE OR REPLACE FUNCTION auto_finish_long_visits()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT id, started_at
        FROM visits
        WHERE status = 'Pendente'  -- Assuming 'Pendente' is the status for active visits (based on types.ts: PENDING = 'Pendente')
          AND started_at < NOW() - INTERVAL '1 hour'
    LOOP
        -- Update the visit to 'VISITED' (Visitada)
        -- Set finished_at to exactly 1 hour after started_at
        UPDATE visits
        SET 
            status = 'Visitada',
            finished_at = r.started_at + INTERVAL '1 hour',
            summary = COALESCE(summary, '') || ' [Auto-finalizado pelo sistema após 1h]',
            updated_at = NOW()
        WHERE id = r.id;
        
        RAISE NOTICE 'Auto-finished visit % started at %', r.id, r.started_at;
    END LOOP;
END;
$$;

-- 2. Verify pg_cron extension (Supabase usually has this, but requires enabling in Dashboard > Database > Extensions)
-- create extension if not exists pg_cron;

-- 3. Schedule the job to run every 5 minutes
-- SELECT cron.schedule(
--    'auto-finish-visits', -- name of the cron job
--    '*/5 * * * *',        -- every 5 minutes
--   'SELECT auto_finish_long_visits();'
-- );

-- TO REMOVE/STOP THE JOB:
-- SELECT cron.unschedule('auto-finish-visits');
