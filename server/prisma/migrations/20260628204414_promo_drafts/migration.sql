-- CreateEnum
CREATE TYPE "PromoStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "PromoDraft" (
    "id" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" "PromoStatus" NOT NULL DEFAULT 'DRAFT',
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromoDraft_status_idx" ON "PromoDraft"("status");
