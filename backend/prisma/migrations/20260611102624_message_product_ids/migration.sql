-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
