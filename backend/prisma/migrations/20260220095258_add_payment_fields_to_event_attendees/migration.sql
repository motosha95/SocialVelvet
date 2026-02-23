-- AlterTable
ALTER TABLE "event_attendees" ADD COLUMN     "cashPrice" DOUBLE PRECISION,
ADD COLUMN     "creditCardPrice" DOUBLE PRECISION,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "pointsUsed" INTEGER;
