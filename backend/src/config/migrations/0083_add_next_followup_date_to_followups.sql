-- Migration 0083: Add next_followup_date to followups table
ALTER TABLE followups ADD COLUMN IF NOT EXISTS next_followup_date DATE NULL;
