-- Migration 0069: Add user_id (UUID) to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) UNIQUE AFTER id;

-- Update existing users with a generated UUID if they don't have one
-- Note: MySQL 8.0+ has UUID(), but for compatibility we might just leave them null or handle in code.
-- Since this is a new column, we can use a simple trick if supported, or just let the code handle it for new users.
-- For existing ones, we can use a temporary update if UUID() is available.
UPDATE users SET user_id = (SELECT UUID()) WHERE user_id IS NULL;
