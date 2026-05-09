BEGIN;

ALTER TABLE users
DROP COLUMN IF EXISTS last_security_verified_at;

ALTER TABLE users
DROP COLUMN IF EXISTS security_locked_until;

ALTER TABLE users
DROP COLUMN IF EXISTS failed_security_attempts;

ALTER TABLE users
DROP COLUMN IF EXISTS security_code_enabled;

ALTER TABLE users
DROP COLUMN IF EXISTS security_code_hash;

COMMIT;
