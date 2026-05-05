-- Migration 0030: Fix attendance table constraints
-- The 'members' table is empty and not used for member tracking in this app (gym_members or users are used).
-- We remove the foreign key to allow storing user_id in member_id column.

SET @exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND CONSTRAINT_NAME = 'attendance_ibfk_1' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @query = IF(@exists > 0, 'ALTER TABLE attendance DROP FOREIGN KEY attendance_ibfk_1', 'SELECT "Constraint attendance_ibfk_1 not found, skipping"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Also ensure member_id is indexed for performance
CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);
