-- Migration 0046: Add consent_data JSON column to enquiries
ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS consent_data JSON NULL AFTER terms_accepted;