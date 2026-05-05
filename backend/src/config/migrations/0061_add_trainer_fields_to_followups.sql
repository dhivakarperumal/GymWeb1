-- Migration to add trainer_id and trainer_name to followups table
ALTER TABLE followups ADD COLUMN IF NOT EXISTS trainer_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE followups ADD COLUMN IF NOT EXISTS trainer_name VARCHAR(255) DEFAULT NULL;
