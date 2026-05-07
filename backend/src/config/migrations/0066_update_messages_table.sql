-- Migration 0066: Update messages table to include memberId and ensure sent_at
-- This migration adds memberId column and renames sentAt to sent_at for consistency if needed, 
-- but I will keep it as sentAt to avoid breaking existing code, just adding memberId.

ALTER TABLE messages ADD COLUMN IF NOT EXISTS memberId INT AFTER userId;
