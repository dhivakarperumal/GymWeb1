-- Migration 0039: Add gender to enquiries table
ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
