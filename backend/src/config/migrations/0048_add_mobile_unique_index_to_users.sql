-- Migration 0048: enforce unique mobile numbers for users

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
