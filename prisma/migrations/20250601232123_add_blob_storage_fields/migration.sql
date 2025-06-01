-- AlterTable
ALTER TABLE "Statement" ADD COLUMN "blobUrl" TEXT;
ALTER TABLE "Statement" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "Statement" ADD COLUMN "mimeType" TEXT DEFAULT 'application/pdf';

-- CreateIndex
CREATE INDEX "Statement_cardId_statementDate_idx" ON "Statement"("cardId", "statementDate");

-- CreateIndex
CREATE INDEX "Statement_status_idx" ON "Statement"("status");
