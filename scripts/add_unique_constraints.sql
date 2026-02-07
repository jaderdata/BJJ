-- Migration: Add unique constraints to prevent duplicate academy links per event
-- Fix: Use ctid instead of id for deduplication as some tables might not have an 'id' column

-- 1. Remove any potential duplicates in event_academies (keeping one)
DELETE FROM public.event_academies a
USING public.event_academies b
WHERE a.ctid > b.ctid 
  AND a.event_id = b.event_id 
  AND a.academy_id = b.academy_id;

-- 2. Add unique constraint to event_academies
ALTER TABLE public.event_academies
ADD CONSTRAINT unique_event_academy UNIQUE (event_id, academy_id);

-- 3. Remove any potential duplicates in visits (keeping one)
DELETE FROM public.visits a
USING public.visits b
WHERE a.ctid > b.ctid 
  AND a.event_id = b.event_id 
  AND a.academy_id = b.academy_id;

-- 4. Add unique constraint to visits
ALTER TABLE public.visits
ADD CONSTRAINT unique_event_academy_visit UNIQUE (event_id, academy_id);

-- Confirmation log
SELECT '✅ Unique constraints added successfully' as status;
