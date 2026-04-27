-- Migration 0036: Add detailed fields to enquiries table based on physical form
ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS age INT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS employer VARCHAR(255),
  ADD COLUMN IF NOT EXISTS occupation VARCHAR(255),
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
  ADD COLUMN IF NOT EXISTS emergency_contact_address TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone_home VARCHAR(20),
  ADD COLUMN IF NOT EXISTS emergency_contact_phone_work VARCHAR(20),
  ADD COLUMN IF NOT EXISTS fitness_goal TEXT,
  ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
