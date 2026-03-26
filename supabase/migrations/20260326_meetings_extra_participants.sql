-- Migration: add extra_participants jsonb column to meetings
-- Date: 2026-03-26
-- Stores extra participants with name and email, replacing the flat extra_emails array for new records.

ALTER TABLE meetings ADD COLUMN IF NOT EXISTS extra_participants jsonb;
