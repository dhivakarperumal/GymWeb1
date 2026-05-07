-- Migration 0064: Make email nullable in users table
ALTER TABLE users
  MODIFY COLUMN email VARCHAR(255) NULL;
