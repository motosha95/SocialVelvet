import { prisma } from '../db/client';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Send push notifications via Expo Push API.
 * @param tokens - Array of Expo push tokens (e.g. "ExponentPushToken[xxx]")
 * @param payload - title, body, and optional data for deep linking
 */
export async function sendExpoPush(tokens: string[], payload: PushPayload): Promise<void> {
  if (tokens.length === 0) return;
  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default' as const,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  }));
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('[push] Expo API error', res.status, text);
    throw new Error(`Expo push failed: ${res.status}`);
  }
}

/**
 * Get all push tokens for a user and send a notification.
 * Use this from your services (events, chat, etc.) when you need to notify a user.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!prisma.pushToken) {
    console.warn('[push] PushToken model not available. Run: npx prisma generate');
    return;
  }
  const rows = await prisma.pushToken.findMany({
    where: { userId },
    select: { token: true },
  });
  const tokens = rows.map((r) => r.token).filter(Boolean);
  await sendExpoPush(tokens, payload);
}
