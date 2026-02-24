import { prisma } from '../db/client';
import { sendPushToUser } from './pushNotifications';

const REMINDER_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * ONE_HOUR_MS;
const WINDOW_MS = 10 * 60 * 1000; // 10 min window so we don't miss if job runs slightly off

function formatEventTime(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Find events in a time window (e.g. starting in ~1h or ~24h) and send reminders to attendees
 * who haven't received this reminder type yet.
 */
async function sendRemindersForWindow(
  windowStartMs: number,
  windowEndMs: number,
  reminderType: '1h' | '24h',
  titlePrefix: string
): Promise<void> {
  if (!prisma.eventReminderSent || !prisma.pushToken) return;

  const now = new Date();
  const from = new Date(now.getTime() + windowStartMs);
  const to = new Date(now.getTime() + windowEndMs);

  const events = await prisma.event.findMany({
    where: {
      isCancelled: false,
      date: { gte: from, lte: to },
    },
    include: {
      attendees: { select: { userId: true } },
    },
  });

  for (const event of events) {
    const eventTime = formatEventTime(event.date);
    for (const { userId } of event.attendees) {
      const existing = await prisma.eventReminderSent.findUnique({
        where: {
          eventId_userId_reminderType: {
            eventId: event.id,
            userId,
            reminderType,
          },
        },
      });
      if (existing) continue;

      await sendPushToUser(userId, {
        title: titlePrefix,
        body: `${event.title} — ${eventTime}`,
        data: { eventId: event.id, type: 'event_reminder' },
      }).catch((err) => console.warn('[eventReminders] Push failed:', userId, err));

      await prisma.eventReminderSent.create({
        data: {
          eventId: event.id,
          userId,
          reminderType,
        },
      });
    }
  }
}

/**
 * Run 1h and 24h reminder passes. Call this periodically (e.g. every 15 min).
 */
export async function sendScheduledEventReminders(): Promise<void> {
  try {
    // 1h reminder: events starting in 50–70 min
    await sendRemindersForWindow(
      ONE_HOUR_MS - WINDOW_MS / 2,
      ONE_HOUR_MS + WINDOW_MS / 2,
      '1h',
      'Event in 1 hour'
    );
    // 24h reminder: events starting in 23h50–24h10
    await sendRemindersForWindow(
      TWENTY_FOUR_HOURS_MS - WINDOW_MS,
      TWENTY_FOUR_HOURS_MS + WINDOW_MS,
      '24h',
      'Event tomorrow'
    );
  } catch (err) {
    console.error('[eventReminders] Error:', err);
  }
}

export function startEventReminderScheduler(): void {
  sendScheduledEventReminders();
  setInterval(sendScheduledEventReminders, REMINDER_INTERVAL_MS);
}
