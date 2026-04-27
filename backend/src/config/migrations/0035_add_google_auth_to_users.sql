-- Migration 0035: Add Google Auth support to users table
-- This adds google_id and picture columns and makes password_hash nullable

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS picture TEXT;

-- Make password_hash nullable for social login users
ALTER TABLE users
  MODIFY COLUMN password_hash TEXT NULL;
