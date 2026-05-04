-- Migration 0019: add email, mobile, and user_id to workout_programs table

ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS member_email VARCHAR(150);
ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS member_mobile VARCHAR(20);
ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS user_id INT;
