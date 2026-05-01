-- Migration 0055: Add plan_price to followups table
ALTER TABLE followups ADD COLUMN plan_price DECIMAL(10, 2) NULL;
