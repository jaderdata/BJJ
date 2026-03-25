-- ============================================================
-- Migration: add confirmed_at to meetings
-- Date: 2026-03-25
-- Allows tracking when an attendee confirmed their presence
-- via the email confirmation link.
-- ============================================================

ALTER TABLE meetings
    ADD COLUMN IF NOT EXISTS confirmed_at timestamptz DEFAULT NULL;

-- Index for filtering confirmed/unconfirmed meetings efficiently
CREATE INDEX IF NOT EXISTS idx_meetings_confirmed_at
    ON meetings (confirmed_at)
    WHERE confirmed_at IS NOT NULL;
