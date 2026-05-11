-- Migration 0077: Add userName, userEmail, userPhone columns to memberships table
ALTER TABLE memberships
ADD COLUMN IF NOT EXISTS userName VARCHAR(100) AFTER userId,
ADD COLUMN IF NOT EXISTS userEmail VARCHAR(100) AFTER userName,
ADD COLUMN IF NOT EXISTS userPhone VARCHAR(20) AFTER userEmail;
