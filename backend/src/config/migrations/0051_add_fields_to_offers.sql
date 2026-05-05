-- Migration 0051: add more fields to offers table
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS start_date DATE NULL,
ADD COLUMN IF NOT EXISTS end_date DATE NULL,
ADD COLUMN IF NOT EXISTS promo_type VARCHAR(50) DEFAULT 'discount',
ADD COLUMN IF NOT EXISTS contact VARCHAR(20) NULL;
