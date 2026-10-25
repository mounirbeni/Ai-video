-- Additive and repeatable, including databases updated by the previous Vercel db-push command.
-- Serialize concurrent production builds and commit all schema changes together.
BEGIN;
SET LOCAL lock_timeout = '15s';
SET LOCAL statement_timeout = '60s';
SELECT pg_advisory_xact_lock(hashtext('nexora:20261025:security-library'));

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Title" ADD COLUMN IF NOT EXISTS "streamFormat" TEXT NOT NULL DEFAULT 'file',
ADD COLUMN IF NOT EXISTS "subtitles" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Episode" ADD COLUMN IF NOT EXISTS "streamFormat" TEXT NOT NULL DEFAULT 'file',
ADD COLUMN IF NOT EXISTS "subtitles" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "WatchProgress" ADD COLUMN IF NOT EXISTS "completed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Watchlist" (
    "userId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("userId","titleId")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RateLimit" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

-- Existing installations may already have these foreign keys.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Watchlist_userId_fkey' AND conrelid = '"Watchlist"'::regclass) THEN
    ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Watchlist_titleId_fkey' AND conrelid = '"Watchlist"'::regclass) THEN
    ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
