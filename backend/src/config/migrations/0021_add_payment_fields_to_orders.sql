-- Migration 0021: Add payment fields to orders table

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255) AFTER total;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'CASH' AFTER payment_id;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT AFTER payment_method;
