BEGIN;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS security_code_hash text NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS security_code_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS failed_security_attempts integer NOT NULL DEFAULT 0;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS security_locked_until timestamp NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_security_verified_at timestamp NULL;

COMMIT;
