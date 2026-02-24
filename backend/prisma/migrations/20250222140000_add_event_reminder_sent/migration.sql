-- CreateTable
CREATE TABLE "event_reminder_sent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_reminder_sent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_reminder_sent_eventId_userId_reminderType_key" ON "event_reminder_sent"("eventId", "userId", "reminderType");

-- CreateIndex
CREATE INDEX "event_reminder_sent_eventId_idx" ON "event_reminder_sent"("eventId");
