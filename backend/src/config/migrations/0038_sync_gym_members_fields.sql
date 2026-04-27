-- Migration 0038: Add detailed fields to gym_members table to match enquiries
ALTER TABLE gym_members
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS age INT,
  ADD COLUMN IF NOT EXISTS employer VARCHAR(255),
  ADD COLUMN IF NOT EXISTS occupation VARCHAR(255),
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
  ADD COLUMN IF NOT EXISTS emergency_contact_address TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone_home VARCHAR(20),
  ADD COLUMN IF NOT EXISTS emergency_contact_phone_work VARCHAR(20),
  ADD COLUMN IF NOT EXISTS fitness_goal TEXT,
  ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
