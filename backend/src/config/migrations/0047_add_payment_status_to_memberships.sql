ALTER TABLE memberships
  ADD COLUMN paymentStatus VARCHAR(50) DEFAULT 'Pending' AFTER status;
