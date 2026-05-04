-- Migration 0015: add product_name and product_image snapshot columns to cart_items table

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'product_name') = 0,
  'ALTER TABLE cart_items ADD COLUMN product_name VARCHAR(255) DEFAULT NULL',
  'SELECT "Column product_name already exists"'
));

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql2 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'product_image') = 0,
  'ALTER TABLE cart_items ADD COLUMN product_image TEXT DEFAULT NULL',
  'SELECT "Column product_image already exists"'
));

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;