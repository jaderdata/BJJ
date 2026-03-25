-- Migration: make academy_id optional in meetings
-- Date: 2026-03-25
-- Academy is no longer required when creating a meeting

ALTER TABLE meetings ALTER COLUMN academy_id DROP NOT NULL;
