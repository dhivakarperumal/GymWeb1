-- Migration 0072: Add user_id (UUID) to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) AFTER id;

-- Update existing staff with their corresponding user_id from users table
UPDATE staff s
JOIN users u ON (u.email = s.email AND s.email IS NOT NULL AND s.email != '') 
             OR (u.username = s.username AND s.username IS NOT NULL AND s.username != '')
SET s.user_id = u.user_id
WHERE s.user_id IS NULL;
