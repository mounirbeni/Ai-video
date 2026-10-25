-- Preserve existing profiles; initials remain the default until a choice is saved.
BEGIN;
SET LOCAL lock_timeout = '15s';
SET LOCAL statement_timeout = '60s';
SELECT pg_advisory_xact_lock(hashtext('nexora:20261025:profile-avatars'));
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarId" TEXT;
COMMIT;
