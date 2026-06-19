-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "MembershipPlan" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED');

-- CreateEnum
CREATE TYPE "StreamStatus" AS ENUM ('UPCOMING', 'LIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TxnType" AS ENUM ('COIN_TOPUP', 'COIN_SPEND', 'COIN_REWARD', 'MERCH_PURCHASE', 'SUBSCRIPTION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "tier" "Tier" NOT NULL DEFAULT 'FREE',
    "coinBalance" INTEGER NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "MembershipPlan" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "renewal" BOOLEAN NOT NULL DEFAULT true,
    "stripeSubscriptionId" TEXT,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stream" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "StreamStatus" NOT NULL DEFAULT 'UPCOMING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "muxStreamId" TEXT,
    "muxPlaybackId" TEXT,
    "premiumOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ticketPrice" INTEGER NOT NULL,
    "prize" INTEGER NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'SCHEDULED',
    "autoDrawSecs" INTEGER,
    "numbersDrawn" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "gridJson" JSONB NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LottoDraw" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "ticketPrice" INTEGER NOT NULL,
    "prize" INTEGER NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'SCHEDULED',
    "winningTicketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LottoDraw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LottoTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LottoTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "priceCents" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "premiumOnly" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalCents" INTEGER NOT NULL,
    "stripePaymentIntentId" TEXT,
    "paymentMethodType" TEXT,
    "shippingAddress" JSONB,
    "trackingNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TxnType" NOT NULL,
    "coinAmount" INTEGER NOT NULL DEFAULT 0,
    "cashCents" INTEGER NOT NULL DEFAULT 0,
    "paymentMethodType" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_key" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "PlayerCard_gameId_idx" ON "PlayerCard"("gameId");

-- CreateIndex
CREATE INDEX "PlayerCard_userId_idx" ON "PlayerCard"("userId");

-- CreateIndex
CREATE INDEX "LottoTicket_drawId_idx" ON "LottoTicket"("drawId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCard" ADD CONSTRAINT "PlayerCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCard" ADD CONSTRAINT "PlayerCard_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCard" ADD CONSTRAINT "PlayerCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LottoTicket" ADD CONSTRAINT "LottoTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LottoTicket" ADD CONSTRAINT "LottoTicket_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "LottoDraw"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
