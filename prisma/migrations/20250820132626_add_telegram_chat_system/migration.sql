-- AlterTable
ALTER TABLE "public"."order_comments" ADD COLUMN     "telegramMessageId" TEXT;

-- CreateTable
CREATE TABLE "public"."user_order_context" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_order_context_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_order_context_userId_key" ON "public"."user_order_context"("userId");
