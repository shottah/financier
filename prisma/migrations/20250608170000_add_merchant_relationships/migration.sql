-- CreateTable (only if not exists)
CREATE TABLE IF NOT EXISTS "Merchant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "billingName" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Merchant_userId_billingName_key') THEN
        CREATE UNIQUE INDEX "Merchant_userId_billingName_key" ON "Merchant"("userId", "billingName");
    END IF;
END $$;

-- CreateIndex (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Merchant_userId_name_idx') THEN
        CREATE INDEX "Merchant_userId_name_idx" ON "Merchant"("userId", "name");
    END IF;
END $$;

-- AddForeignKey (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Merchant_userId_fkey' AND table_name = 'Merchant'
    ) THEN
        ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable (add column if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Transaction' AND column_name = 'merchantId') THEN
        ALTER TABLE "Transaction" ADD COLUMN "merchantId" TEXT;
    END IF;
END $$;

-- CreateIndex (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Transaction_merchantId_idx') THEN
        CREATE INDEX "Transaction_merchantId_idx" ON "Transaction"("merchantId");
    END IF;
END $$;

-- AddForeignKey (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Transaction_merchantId_fkey' AND table_name = 'Transaction'
    ) THEN
        ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;