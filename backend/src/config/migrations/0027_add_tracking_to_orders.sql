-- Migration 0027: Add tracking fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name VARCHAR(255) AFTER order_track;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS docket_number VARCHAR(255) AFTER courier_name;
