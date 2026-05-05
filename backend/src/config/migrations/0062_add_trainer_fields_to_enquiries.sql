-- Migration to add trainer fields to enquiries table
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS trainer_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS trainer_name VARCHAR(255) DEFAULT NULL;
