-- Migration 0055: Drop members table (use with caution)
-- This will permanently delete the `members` table and its data.
-- Make a backup before running.
-- Temporarily disable foreign key checks to allow dropping the parent table.
-- WARNING: This will remove data that other tables may reference and may leave orphaned rows.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS members;
SET FOREIGN_KEY_CHECKS = 1;
