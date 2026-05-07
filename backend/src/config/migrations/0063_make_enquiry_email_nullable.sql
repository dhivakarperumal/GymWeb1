-- Migration 0063: Make email nullable in enquiries table
ALTER TABLE enquiries
  MODIFY COLUMN email VARCHAR(255) NULL;
