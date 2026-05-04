-- Migration 0026: add session_time column to trainer_assignments

ALTER TABLE trainer_assignments
  ADD COLUMN IF NOT EXISTS session_time TIME NULL AFTER trainer_source;