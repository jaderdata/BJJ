-- ============================================================
-- Migration: create meetings table (idempotent)
-- Date: 2026-03-24
-- ============================================================

-- Drop and recreate to ensure all columns are present
DROP TABLE IF EXISTS meetings CASCADE;

CREATE TABLE meetings (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id        uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    created_by        uuid NOT NULL,
    title             text NOT NULL,
    scheduled_at      timestamptz NOT NULL,
    duration_min      integer NOT NULL DEFAULT 30,
    attendee_email    text,
    attendee_name     text,
    organizer_email   text,
    organizer_name    text,
    meeting_link      text,
    extra_emails      text,
    notes             text,
    email_sent        boolean NOT NULL DEFAULT false,
    email_lang        text NOT NULL DEFAULT 'pt' CHECK (email_lang IN ('pt', 'en')),
    recurrence        text NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none', 'weekly', 'biweekly', 'monthly')),
    parent_meeting_id uuid REFERENCES meetings(id) ON DELETE SET NULL,
    deleted_at        timestamptz DEFAULT NULL,
    confirmed_at      timestamptz DEFAULT NULL,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_meetings_academy_id   ON meetings (academy_id);
CREATE INDEX idx_meetings_created_by   ON meetings (created_by);
CREATE INDEX idx_meetings_scheduled_at ON meetings (scheduled_at);
CREATE INDEX idx_meetings_deleted_at   ON meetings (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_meetings_parent_id    ON meetings (parent_meeting_id) WHERE parent_meeting_id IS NOT NULL;
CREATE INDEX idx_meetings_confirmed_at ON meetings (confirmed_at) WHERE confirmed_at IS NOT NULL;

-- RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meetings_all" ON meetings;
CREATE POLICY "meetings_all" ON meetings
    FOR ALL USING (true) WITH CHECK (true);
