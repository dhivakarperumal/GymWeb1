-- Migration 0060: Final consolidation to fix Follow-up Enquiry system
-- This file ensures all missing columns and tables are created.

-- 1. Create interactions table if missing
CREATE TABLE IF NOT EXISTS followup_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    followup_id INT NOT NULL,
    interaction_date DATETIME NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    next_followup_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Add plan_price to followups table
ALTER TABLE followups ADD COLUMN plan_price DECIMAL(10, 2) NULL;
