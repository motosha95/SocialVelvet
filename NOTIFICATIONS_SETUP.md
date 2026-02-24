# Sending Notifications to Users

Social Velvet can send **push notifications** to users on their devices. This guide uses **Expo Push Notifications**, which work with your existing Expo app and don’t require FCM/APNs setup until you build a standalone app.

## How it works

1. **App** asks for permission, gets a **push token** from Expo, and sends it to your backend.
2. **Backend** stores the token per user (and optionally per device).
3. When something happens (e.g. event tomorrow, new message), the **backend** sends a request to **Expo’s push API**; Expo delivers the notification to the device.

```
[Your backend]  →  POST https://exp.host/--/api/v2/push/send  →  [Expo]  →  [User device]
```

---

## 1. Backend: Store push tokens

Add a table to store each device’s Expo push token for a user.

**Prisma schema** (add to `backend/prisma/schema.prisma`):

```prisma
model PushToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique   // Expo push token, e.g. "ExponentPushToken[xxx]"
  deviceId  String?             // optional: identify device for replace-old-token logic
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, token])
  @@index([userId])
  @@map("push_tokens")
}
```

On the **User** model, add the relation:

```prisma
pushTokens PushToken[]
```

Then run:

```bash
cd backend
npx prisma migrate dev --name add_push_tokens
```

---

## 2. Backend: Register token (API)

When the user logs in (or when the app gets a new token), the app calls an endpoint to save the token.

**Example route** (e.g. in `backend/src/routes/users.ts` or a new `notifications.ts`):

- **POST** `/users/me/push-token`  
  Body: `{ "token": "ExponentPushToken[xxx]", "deviceId": "optional-id" }`  
  - Authenticated.  
  - Upsert: if this user already has this token, do nothing; otherwise create (and optionally remove old tokens for the same `deviceId` to avoid duplicates).

**Example implementation:**

```ts
// POST /users/me/push-token
usersRouter.post('/me/push-token', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { token, deviceId } = req.body as { token: string; deviceId?: string };
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: { message: 'token is required' } });
    }
    await prisma.pushToken.upsert({
      where: { userId_token: { userId: req.userId, token } },
      create: { userId: req.userId, token, deviceId: deviceId ?? null },
      update: { deviceId: deviceId ?? undefined },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
```

(You’ll need the `@@unique([userId, token])` on `PushToken` for `userId_token` in `where`.)

---

## 3. Backend: Send a notification (Expo Push API)

When you want to notify a user (e.g. event reminder, new message), load their push tokens and send each to Expo.

**Example helper** (e.g. `backend/src/services/pushNotifications.ts`):

```ts
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export async function sendExpoPush(
  tokens: string[],
  payload: { title: string; body: string; data?: Record<string, unknown> }
): Promise<void> {
  if (tokens.length === 0) return;
  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default',
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
```

**Example: notify one user by userId**

```ts
const tokens = await prisma.pushToken.findMany({
  where: { userId: targetUserId },
  select: { token: true },
});
await sendExpoPush(
  tokens.map((t) => t.token),
  { title: 'Event tomorrow', body: 'Your event "Meetup" is tomorrow at 6 PM.', data: { eventId: '...' } }
);
```

Use this from your existing services (events, chat, etc.) whenever you need to send a notification.

---

## 4. App: Install and request permission

```bash
npx expo install expo-notifications
```

**Get and send the token to your backend** (e.g. in your root app component or right after login):

```ts
import * as Notifications from 'expo-notifications';

async function registerForPushNotifications(): Promise<string | null> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== 'granted') return null;

  const projectId = process.env.EXPO_PUBLIC_PROJECT_ID; // from app.json/app.config.js
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data; // "ExponentPushToken[xxx]"
}

// After login (e.g. in authStore or AppNavigator when user is logged in):
const token = await registerForPushNotifications();
if (token) {
  await apiClient.post('/users/me/push-token', { token }, authToken);
}
```

- **Android:** Notifications work in Expo Go and in development builds.
- **iOS:** In Expo Go you get a token but may not see real push until you use a development build with proper capabilities. For a development build, set `ios.usesAppleSignIn` and ensure push entitlement is enabled.

---

## 5. When to send notifications

Call your “send push” logic from existing backend code, for example:

| Event              | Who to notify        | Example payload                          |
|--------------------|----------------------|------------------------------------------|
| Event starting soon| Attendees            | “Starts in 1 hour: Event Name”           |
| New message in chat| Other participants   | “John: message preview”                  |
| Event cancelled    | Attendees            | “Event Name has been cancelled”           |
| New follower       | Followed user        | “Jane is now following you”              |
| Quest completed    | The user             | “Quest ‘First Steps’ completed! +25 pts” |

Always resolve the target user(s), load their `PushToken` records, then call `sendExpoPush` with the right title/body (and optional `data` for deep linking).

---

## 6. Optional: In-app only (no push)

If you don’t want push yet, you can still show **in-app notifications** (e.g. a bell icon with a list fetched from an API). That would require:

- A **Notification** (or **UserNotification**) model to store “unread” items.
- An API like **GET /users/me/notifications** and **PATCH /users/me/notifications/:id/read**.
- The app polls or refetches on focus and shows a list/badge in the UI.

Push tokens and Expo are only needed for **sending notifications to the device** when the app is in the background or closed.

---

## Summary

1. Add **PushToken** (and relation on User), run migration.
2. Add **POST /users/me/push-token** and call it from the app after login with the Expo token.
3. Add **sendExpoPush** and use it from your services whenever you want to notify users.
4. In the app, install **expo-notifications**, request permission, get the Expo push token, and send it to **POST /users/me/push-token**.

---

## Implemented in this project

- **Backend**
  - `PushToken` model in Prisma and migration `20250222120000_add_push_tokens`.
  - `POST /users/me/push-token` (authenticated) to register a token.
  - `backend/src/services/pushNotifications.ts`: `sendExpoPush(tokens, payload)` and `sendPushToUser(userId, payload)`.
- **App**
  - `expo-notifications` in `package.json`. Run `npm install` (or `npx expo install expo-notifications`) in the app root.
  - `src/services/pushNotifications.ts`: `getExpoPushToken()` and `registerPushTokenWithBackend(accessToken)`.
  - `AppNavigator` registers the push token when the user is logged in (after hydration).

**Run the migration** (from `backend/`):

```bash
npx prisma migrate dev
# or if you prefer to apply an existing migration: npx prisma migrate deploy
```

**Optional – Expo project ID (for push in development):**  
If you use EAS or Expo’s push service, set `EXPO_PUBLIC_PROJECT_ID` in the app (e.g. in `.env` or app config). You can find it in `app.json` under `extra.expoClient.projectId` after running `eas init`, or from the Expo dashboard.
