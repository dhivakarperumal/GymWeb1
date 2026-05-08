-- Migration 0073: Add member_weight to diet_plans and workout_programs
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS member_weight VARCHAR(20) AFTER member_mobile;
ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS member_weight VARCHAR(20) AFTER member_mobile;

-- Backfill member_weight from gym_members if possible
UPDATE diet_plans dp
JOIN users u ON u.id = dp.user_id
JOIN gym_members gm ON (gm.user_id = u.user_id AND u.user_id IS NOT NULL)
SET dp.member_weight = gm.weight
WHERE dp.member_weight IS NULL;

UPDATE workout_programs wp
JOIN users u ON u.id = wp.user_id
JOIN gym_members gm ON (gm.user_id = u.user_id AND u.user_id IS NOT NULL)
SET wp.member_weight = gm.weight
WHERE wp.member_weight IS NULL;
