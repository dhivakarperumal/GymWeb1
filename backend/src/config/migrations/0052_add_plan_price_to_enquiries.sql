-- Migration 0052: Add plan_price to enquiries table
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS plan_price DECIMAL(10, 2) NULL;
