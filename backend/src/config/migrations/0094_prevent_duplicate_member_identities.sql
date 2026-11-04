ALTER TABLE gym_members
  ADD COLUMN IF NOT EXISTS phone_identity VARCHAR(20)
    GENERATED ALWAYS AS (
      NULLIF(
        CASE
          WHEN CHAR_LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '')) = 12
            AND LEFT(REGEXP_REPLACE(phone, '[^0-9]', ''), 2) = '91'
            THEN RIGHT(REGEXP_REPLACE(phone, '[^0-9]', ''), 10)
          WHEN CHAR_LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '')) = 11
            AND LEFT(REGEXP_REPLACE(phone, '[^0-9]', ''), 1) = '0'
            THEN RIGHT(REGEXP_REPLACE(phone, '[^0-9]', ''), 10)
          ELSE REGEXP_REPLACE(phone, '[^0-9]', '')
        END,
        ''
      )
    ) STORED,
  ADD COLUMN IF NOT EXISTS email_identity VARCHAR(100)
    GENERATED ALWAYS AS (NULLIF(LOWER(TRIM(email)), '')) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS uq_gym_members_phone_identity
  ON gym_members(phone_identity);
CREATE UNIQUE INDEX IF NOT EXISTS uq_gym_members_email_identity
  ON gym_members(email_identity);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_identity VARCHAR(20)
    GENERATED ALWAYS AS (
      NULLIF(
        CASE
          WHEN CHAR_LENGTH(REGEXP_REPLACE(mobile, '[^0-9]', '')) = 12
            AND LEFT(REGEXP_REPLACE(mobile, '[^0-9]', ''), 2) = '91'
            THEN RIGHT(REGEXP_REPLACE(mobile, '[^0-9]', ''), 10)
          WHEN CHAR_LENGTH(REGEXP_REPLACE(mobile, '[^0-9]', '')) = 11
            AND LEFT(REGEXP_REPLACE(mobile, '[^0-9]', ''), 1) = '0'
            THEN RIGHT(REGEXP_REPLACE(mobile, '[^0-9]', ''), 10)
          ELSE REGEXP_REPLACE(mobile, '[^0-9]', '')
        END,
        ''
      )
    ) STORED,
  ADD COLUMN IF NOT EXISTS email_identity VARCHAR(255)
    GENERATED ALWAYS AS (NULLIF(LOWER(TRIM(email)), '')) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone_identity
  ON users(phone_identity);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_identity
  ON users(email_identity);
