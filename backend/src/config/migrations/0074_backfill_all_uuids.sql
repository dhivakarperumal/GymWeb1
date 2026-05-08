-- Migration 0074: Generate UUIDs for existing users and backfill all related tables
UPDATE users SET user_id = UUID() WHERE user_id IS NULL OR user_id = '';

-- Backfill trainer_assignments
UPDATE trainer_assignments ta
JOIN users u ON u.id = ta.user_id
SET ta.user_id_uuid = u.user_id
WHERE ta.user_id_uuid IS NULL;

-- Backfill diet_plans
UPDATE diet_plans dp
JOIN users u ON u.id = dp.user_id
SET dp.user_id_uuid = u.user_id
WHERE dp.user_id_uuid IS NULL;

-- Backfill workout_programs
UPDATE workout_programs wp
JOIN users u ON u.id = wp.user_id
SET wp.user_id_uuid = u.user_id
WHERE wp.user_id_uuid IS NULL;

-- Backfill staff
UPDATE staff s
JOIN users u ON (s.email = u.email AND s.email IS NOT NULL AND s.email != '') OR (s.username = u.username)
SET s.user_id = u.user_id
WHERE s.user_id IS NULL;

-- Backfill gym_members
UPDATE gym_members gm
JOIN users u ON (gm.email = u.email AND gm.email IS NOT NULL AND gm.email != '') OR (gm.phone = u.mobile AND gm.phone IS NOT NULL AND gm.phone != '')
SET gm.user_id = u.user_id
WHERE gm.user_id IS NULL;

-- Backfill default levels and categories
UPDATE workout_programs SET level = 'Beginner' WHERE level IS NULL OR level = '';
UPDATE workout_programs SET category = 'General' WHERE category IS NULL OR category = '';
