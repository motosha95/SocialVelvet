-- AlterTable
ALTER TABLE "events" ADD COLUMN "topics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
