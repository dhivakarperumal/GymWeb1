-- Migration 0037: Fix enquiry table constraints and add missing health fields
-- Make message nullable as it's now optional in the new form
ALTER TABLE enquiries
  MODIFY COLUMN message TEXT NULL;

-- Add health metrics that were present in frontend but missing in DB
ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS height DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS bmi DECIMAL(4,1);
