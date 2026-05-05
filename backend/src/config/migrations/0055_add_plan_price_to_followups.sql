-- Migration 0055: Add plan_price to followups table
ALTER TABLE followups ADD COLUMN IF NOT EXISTS plan_price DECIMAL(10, 2) NULL;
