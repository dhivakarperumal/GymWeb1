-- Migration 0040: Add gender to gym_members table
ALTER TABLE gym_members
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
