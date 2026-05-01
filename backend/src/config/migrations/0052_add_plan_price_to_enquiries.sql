-- Migration 0052: Add plan_price to enquiries table
ALTER TABLE enquiries ADD COLUMN plan_price DECIMAL(10, 2) NULL;
