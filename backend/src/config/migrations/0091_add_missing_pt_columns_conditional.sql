-- Migration 0091: Conditionally add missing PT and payment related columns
-- Uses INFORMATION_SCHEMA to support older MySQL versions where
-- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` may not be available.

-- Helper block repeated per column: builds and executes an ALTER only when needed.

/* memberships table columns */
-- pt_planId
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN pt_planId INT',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'pt_planId');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_planName
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN pt_planName VARCHAR(100)',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'pt_planName');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_price
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN pt_price DECIMAL(10,2) DEFAULT 0',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'pt_price');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_pricePaid
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN pt_pricePaid DECIMAL(10,2) DEFAULT 0',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'pt_pricePaid');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_duration
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN pt_duration INT',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'pt_duration');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_startDate
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN pt_startDate DATE NULL',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'pt_startDate');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_endDate
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN pt_endDate DATE NULL',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'pt_endDate');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_paymentMode
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN pt_paymentMode VARCHAR(50)',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'pt_paymentMode');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_paymentDate
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN pt_paymentDate DATE NULL',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'pt_paymentDate');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_paymentStatus
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN pt_paymentStatus VARCHAR(50)',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'pt_paymentStatus');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_status
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN pt_status VARCHAR(50) DEFAULT ''active''',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'pt_status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_trainerId
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN pt_trainerId INT',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'pt_trainerId');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_trainerName
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN pt_trainerName VARCHAR(100)',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'pt_trainerName');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_discount
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN pt_discount DECIMAL(10,2) DEFAULT 0',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'pt_discount');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_amount
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN pt_amount DECIMAL(10,2) DEFAULT 0',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'pt_amount');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- has_pt_plan
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN has_pt_plan TINYINT(1) DEFAULT 0',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'has_pt_plan');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- collectedBy
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN collectedBy VARCHAR(255)',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'collectedBy');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- dues (JSON or LONGTEXT fallback)
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE memberships ADD COLUMN dues LONGTEXT NULL',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' AND COLUMN_NAME = 'dues');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

/* gym_members table columns */
-- pt_plan
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE gym_members ADD COLUMN pt_plan VARCHAR(100)',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gym_members' AND COLUMN_NAME = 'pt_plan');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_duration
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE gym_members ADD COLUMN pt_duration INT',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gym_members' AND COLUMN_NAME = 'pt_duration');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_join_date
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE gym_members ADD COLUMN pt_join_date DATE NULL',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gym_members' AND COLUMN_NAME = 'pt_join_date');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_expiry_date
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE gym_members ADD COLUMN pt_expiry_date DATE NULL',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gym_members' AND COLUMN_NAME = 'pt_expiry_date');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_status on gym_members
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE gym_members ADD COLUMN pt_status VARCHAR(50) DEFAULT ''active''',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gym_members' AND COLUMN_NAME = 'pt_status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pt_form_completed
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE gym_members ADD COLUMN pt_form_completed TINYINT(1) DEFAULT 0',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gym_members' AND COLUMN_NAME = 'pt_form_completed');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill has_pt_plan from gym_plans where possible
SET @sql = (SELECT IF(COUNT(*) = 0,
  'UPDATE memberships m INNER JOIN gym_plans gp ON m.planId = gp.id SET m.has_pt_plan = CASE WHEN gp.trainer_included = 1 OR gp.trainer_included = true THEN 1 ELSE 0 END WHERE m.planId IS NOT NULL',
  'SELECT "skip"')
  FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gym_plans');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
