ALTER TABLE memberships
  ADD COLUMN secondPaymentPaid DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER pricePaid;
