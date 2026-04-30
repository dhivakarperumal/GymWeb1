-- Migration 0049: remove unique constraint from username in users if it exists

SET @idx_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND index_name = 'idx_users_username'
);

SET @sql = IF(@idx_exists > 0,
  'ALTER TABLE users DROP INDEX idx_users_username',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
