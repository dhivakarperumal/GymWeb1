-- Migration 0068: add status to users table

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
