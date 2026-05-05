ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS paymentStatus VARCHAR(50) DEFAULT 'Pending' AFTER status;
