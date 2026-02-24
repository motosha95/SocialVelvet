-- AlterTable: Add pricing tiers (JSON array of { name, price }), max 4
ALTER TABLE "events" ADD COLUMN "pricingTiers" JSONB;
