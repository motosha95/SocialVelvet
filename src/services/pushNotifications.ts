import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

/**
 * Request permission and get the current Expo push token.
 * Returns null if permission denied or token unavailable.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== 'granted') return null;

  try {
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    });
    return tokenData.data;
  } catch {
    return null;
  }
}

/**
 * Register the current device's push token with the backend.
 * Call this when the user is logged in (e.g. after sign-in or when app opens with session).
 */
export async function registerPushTokenWithBackend(accessToken: string): Promise<void> {
  const token = await getExpoPushToken();
  if (!token) return;
  try {
    await apiClient.post<{ ok: boolean }>('/users/me/push-token', { token }, accessToken);
  } catch (err) {
    console.warn('[push] Failed to register token with backend:', err);
  }
}
