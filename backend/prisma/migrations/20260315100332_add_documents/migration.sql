-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RECEIPT', 'INVOICE', 'WARRANTY_CERTIFICATE', 'PHOTO', 'OTHER');

-- AlterEnum
ALTER TYPE "Category" ADD VALUE 'NONE';

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "category" SET DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "docType" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_productId_idx" ON "Document"("productId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
