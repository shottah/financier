-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "billingName" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Merchant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_userId_billingName_key" ON "Merchant"("userId", "billingName");

-- CreateIndex
CREATE INDEX "Merchant_userId_name_idx" ON "Merchant"("userId", "name");

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "merchantId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_merchantId_idx" ON "Transaction"("merchantId");

-- Add foreign key constraint for merchant relationship
-- Note: Using a separate statement to handle potential issues with existing data
-- Transactions without merchants will have NULL merchantId (allowed by schema)