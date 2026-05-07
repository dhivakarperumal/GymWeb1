-- Migration 0065: Add fingerprint_id column to gym_members table
ALTER TABLE gym_members
  ADD COLUMN IF NOT EXISTS fingerprint_id VARCHAR(50);
