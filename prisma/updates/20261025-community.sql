BEGIN;
SET LOCAL lock_timeout = '15s';
SET LOCAL statement_timeout = '60s';
SELECT pg_advisory_xact_lock(hashtext('nexora:20261025:community'));
CREATE TABLE IF NOT EXISTS "CommunityPost" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'updates',
  "published" BOOLEAN NOT NULL DEFAULT false,
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "CommunityPost_published_pinned_createdAt_idx" ON "CommunityPost"("published", "pinned", "createdAt");
COMMIT;
