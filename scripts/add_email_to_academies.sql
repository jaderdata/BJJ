-- Migration: Add email column to academies table
-- Run this in your Supabase SQL Editor

ALTER TABLE academies
ADD COLUMN IF NOT EXISTS email TEXT;

-- Optional: add an index for email lookups
CREATE INDEX IF NOT EXISTS idx_academies_email ON academies (email);
