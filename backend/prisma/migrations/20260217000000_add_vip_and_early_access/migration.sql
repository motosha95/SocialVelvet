-- AlterTable
ALTER TABLE "users" ADD COLUMN "vipTier" TEXT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN "listFrom" TIMESTAMP(3), ADD COLUMN "vipOnly" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "isCuratedPick" BOOLEAN NOT NULL DEFAULT false;
