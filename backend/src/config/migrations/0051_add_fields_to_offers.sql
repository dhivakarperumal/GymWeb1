-- Migration 0051: add more fields to offers table
ALTER TABLE offers 
ADD COLUMN start_date DATE NULL,
ADD COLUMN end_date DATE NULL,
ADD COLUMN promo_type VARCHAR(50) DEFAULT 'discount',
ADD COLUMN contact VARCHAR(20) NULL;
