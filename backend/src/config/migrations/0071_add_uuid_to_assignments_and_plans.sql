-- Migration 0071: Add user_id_uuid to trainer_assignments, diet_plans, and workout_programs
ALTER TABLE trainer_assignments ADD COLUMN IF NOT EXISTS user_id_uuid VARCHAR(50) AFTER user_id;
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS user_id_uuid VARCHAR(50) AFTER user_id;
ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS user_id_uuid VARCHAR(50) AFTER user_id;

-- Update existing records in trainer_assignments
UPDATE trainer_assignments ta
JOIN users u ON u.id = ta.user_id
SET ta.user_id_uuid = u.user_id
WHERE ta.user_id_uuid IS NULL;

-- Update existing records in diet_plans
UPDATE diet_plans dp
JOIN users u ON u.id = dp.user_id
SET dp.user_id_uuid = u.user_id
WHERE dp.user_id_uuid IS NULL;

-- Update existing records in workout_programs
UPDATE workout_programs wp
JOIN users u ON u.id = wp.user_id
SET wp.user_id_uuid = u.user_id
WHERE wp.user_id_uuid IS NULL;
