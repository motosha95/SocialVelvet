-- AlterTable: Change price from DECIMAL to DOUBLE PRECISION if it was created as DECIMAL
-- This fixes 500 errors when creating paid events (Prisma Float works with plain numbers)
ALTER TABLE "events" ALTER COLUMN "price" TYPE DOUBLE PRECISION USING "price"::double precision;
