-- AlterTable
ALTER TABLE "Product" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_userId_archived_idx" ON "Product"("userId", "archived");
