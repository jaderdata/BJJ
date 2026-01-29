-- Optimize Realtime Publication
-- Removes high-update/low-value tables from Realtime to reduce database load.
-- 
-- Removed:
-- - academies: High update volume (~1200), likely reference data not needed in realtime.
-- - vouchers: Inserts can be handled via API response, realtime likely unnecessary.
-- - finance_records: Low volume, sensitive, likely not needed in realtime.
--
-- Kept:
-- - visits: Core operational data, likely needs live updates.
-- - notifications: Critical for user alerts.
-- - events: Calendar/Scheduling.
-- - event_academies: Junction for schedule.

ALTER PUBLICATION supabase_realtime SET TABLE public.visits, public.notifications, public.events, public.event_academies;
