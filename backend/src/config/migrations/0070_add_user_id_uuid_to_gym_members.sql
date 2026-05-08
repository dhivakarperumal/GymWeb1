-- Migration 0070: Add user_id (UUID) to gym_members table
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) AFTER id;

-- Update existing gym_members with their corresponding user_id from users table
UPDATE gym_members gm
JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') 
             OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
SET gm.user_id = u.user_id
WHERE gm.user_id IS NULL;
