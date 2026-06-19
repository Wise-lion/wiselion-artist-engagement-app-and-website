-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('SONG', 'AUDIO_MESSAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "description" TEXT,
    "url" TEXT,
    "artworkUrl" TEXT,
    "durationSec" INTEGER,
    "premiumOnly" BOOLEAN NOT NULL DEFAULT false,
    "platformLinks" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaItem_kind_active_idx" ON "MediaItem"("kind", "active");
