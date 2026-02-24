-- All events now have tickets - set default to true and update existing events
ALTER TABLE "events" ALTER COLUMN "isTicketed" SET DEFAULT true;
UPDATE "events" SET "isTicketed" = true WHERE "isTicketed" = false;
