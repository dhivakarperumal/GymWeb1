-- Migration 0076: Add user_id column to messages table for storing UUID
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id VARCHAR(36) AFTER userId;
