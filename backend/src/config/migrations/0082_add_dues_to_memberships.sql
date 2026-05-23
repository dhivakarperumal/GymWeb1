-- Migration 0082: Add `dues` JSON column to memberships
ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS dues JSON NULL AFTER collectedBy;
