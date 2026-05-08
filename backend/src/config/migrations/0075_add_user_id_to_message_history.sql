-- Migration 0075: Add user_id column to message_history for storing UUID
ALTER TABLE message_history ADD COLUMN IF NOT EXISTS user_id VARCHAR(36) AFTER userId;
