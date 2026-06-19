-- AlterTable
ALTER TABLE "MediaItem" ADD COLUMN     "kickChannel" TEXT,
ADD COLUMN     "ownedBackupUrl" TEXT,
ADD COLUMN     "platformStatus" JSONB;
