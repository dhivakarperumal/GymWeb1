-- Migration 0090: Ensure `memberships` and `gym_members` tables have all expected columns
-- This is a safe, idempotent migration that adds any missing columns used by the application

-- Ensure memberships has all controller-expected columns
ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS userId INT,
  ADD COLUMN IF NOT EXISTS userName VARCHAR(100),
  ADD COLUMN IF NOT EXISTS userEmail VARCHAR(100),
  ADD COLUMN IF NOT EXISTS userPhone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS planId INT,
  ADD COLUMN IF NOT EXISTS planName VARCHAR(100),
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pricePaid DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS secondPaymentPaid DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS secondPaymentDate DATE NULL,
  ADD COLUMN IF NOT EXISTS duration INT,
  ADD COLUMN IF NOT EXISTS startDate DATE NULL,
  ADD COLUMN IF NOT EXISTS endDate DATE NULL,
  ADD COLUMN IF NOT EXISTS paymentId VARCHAR(100),
  ADD COLUMN IF NOT EXISTS paymentMode VARCHAR(50),
  ADD COLUMN IF NOT EXISTS paymentDate DATE NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS paymentStatus VARCHAR(50) DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS referredBy VARCHAR(255),
  ADD COLUMN IF NOT EXISTS trainerId INT,
  ADD COLUMN IF NOT EXISTS trainerName VARCHAR(100),
  ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS collectedBy VARCHAR(255),
  ADD COLUMN IF NOT EXISTS has_pt_plan TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pt_planId INT,
  ADD COLUMN IF NOT EXISTS pt_planName VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pt_price DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pt_pricePaid DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pt_duration INT,
  ADD COLUMN IF NOT EXISTS pt_startDate DATE NULL,
  ADD COLUMN IF NOT EXISTS pt_endDate DATE NULL,
  ADD COLUMN IF NOT EXISTS pt_paymentMode VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pt_paymentDate DATE NULL,
  ADD COLUMN IF NOT EXISTS pt_paymentStatus VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pt_trainerId INT,
  ADD COLUMN IF NOT EXISTS pt_trainerName VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pt_discount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pt_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dues JSON NULL,
  ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Ensure gym_members has fields expected by controllers and sync logic
ALTER TABLE gym_members
  ADD COLUMN IF NOT EXISTS user_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS fingerprint_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pt_plan VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pt_duration INT,
  ADD COLUMN IF NOT EXISTS pt_join_date DATE NULL,
  ADD COLUMN IF NOT EXISTS pt_expiry_date DATE NULL,
  ADD COLUMN IF NOT EXISTS pt_status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS pt_form_completed TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- If necessary, backfill simple relationships (best-effort, won't overwrite existing data)
-- Backfill gym_members.user_id where possible from users table (matching on email or mobile)
UPDATE gym_members gm
LEFT JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
SET gm.user_id = u.user_id
WHERE (gm.user_id IS NULL OR gm.user_id = '') AND u.user_id IS NOT NULL;

-- Ensure memberships.has_pt_plan is set based on gym_plans.trainer_included for existing rows
UPDATE memberships m
INNER JOIN gym_plans gp ON m.planId = gp.id
SET m.has_pt_plan = CASE WHEN gp.trainer_included = 1 OR gp.trainer_included = true THEN 1 ELSE 0 END
WHERE m.planId IS NOT NULL;
