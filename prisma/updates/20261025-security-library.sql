-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Title" ADD COLUMN     "streamFormat" TEXT NOT NULL DEFAULT 'file',
ADD COLUMN     "subtitles" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "streamFormat" TEXT NOT NULL DEFAULT 'file',
ADD COLUMN     "subtitles" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "WatchProgress" ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Watchlist" (
    "userId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("userId","titleId")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;
