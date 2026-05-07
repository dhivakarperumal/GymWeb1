-- Migration 0067: Update message_history table to include memberId and userId
-- This allows for better filtering of bulk messages that might be targeted at specific individuals.

ALTER TABLE message_history ADD COLUMN IF NOT EXISTS userId INT AFTER failed;
ALTER TABLE message_history ADD COLUMN IF NOT EXISTS memberId INT AFTER userId;
