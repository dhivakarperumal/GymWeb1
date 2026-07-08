-- Migration 0055: Drop members table (use with caution)
-- This will permanently delete the `members` table and its data.
-- Make a backup before running.
DROP TABLE IF EXISTS members;
