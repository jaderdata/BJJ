-- ============================================================
-- Migration: add timezone_name to meetings
-- Date: 2026-03-25
-- Stores the display label shown in the email (e.g. "Horário de Brasília")
-- ============================================================

ALTER TABLE meetings
    ADD COLUMN IF NOT EXISTS timezone_name text DEFAULT 'Horário de Brasília';
