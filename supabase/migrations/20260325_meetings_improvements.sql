-- ============================================================
-- Migration: meetings table improvements
-- Date: 2026-03-25
-- Changes:
--   1. soft-delete: deleted_at column
--   2. email language persistence: email_lang column
--   3. recurrence: recurrence + parent_meeting_id columns
-- ============================================================

-- 1. Soft-delete support
ALTER TABLE meetings
    ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 2. Persist email language preference per meeting
ALTER TABLE meetings
    ADD COLUMN IF NOT EXISTS email_lang text DEFAULT 'pt'
    CHECK (email_lang IN ('pt', 'en'));

-- 3. Recurrence support
ALTER TABLE meetings
    ADD COLUMN IF NOT EXISTS recurrence text DEFAULT 'none'
    CHECK (recurrence IN ('none', 'weekly', 'biweekly', 'monthly'));

ALTER TABLE meetings
    ADD COLUMN IF NOT EXISTS parent_meeting_id uuid
    REFERENCES meetings(id) ON DELETE SET NULL;

-- Index for efficient filtering of non-deleted meetings
CREATE INDEX IF NOT EXISTS idx_meetings_deleted_at
    ON meetings (deleted_at)
    WHERE deleted_at IS NULL;

-- Index for recurring instances lookup
CREATE INDEX IF NOT EXISTS idx_meetings_parent_id
    ON meetings (parent_meeting_id)
    WHERE parent_meeting_id IS NOT NULL;
