import { apiClient } from './client';
import { useAuthStore } from '../store/auth/authStore';
import type {
  Event,
  CreateEventRequest,
  CreateEventResponse,
  UpdateEventRequest,
  EventAttendee,
  EventCoHost,
  AddCoHostRequest,
  UpdateCoHostRequest,
} from '../features/events/types';

/**
 * Get the current auth token from the store
 */
const getAuthToken = (): string | undefined => {
  const session = useAuthStore.getState().session;
  if (!session) {
    console.warn('[getAuthToken] No session found in store');
    return undefined;
  }
  if (!session.accessToken) {
    console.warn('[getAuthToken] Session exists but no accessToken');
    return undefined;
  }
  console.log('[getAuthToken] Token retrieved successfully');
  return session.accessToken;
};

const EVENTS_PAGE_SIZE = 10;

export const eventsApi = {
  list: async (
    prioritizeFollowed: boolean = false,
    limit: number = EVENTS_PAGE_SIZE,
    offset: number = 0
  ): Promise<Event[]> => {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (prioritizeFollowed) params.set('prioritizeFollowed', 'true');
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiClient.get<Event[]>(`/events${query}`, token);
  },

  getById: async (id: string, includeCoHosts: boolean = false): Promise<Event | null> => {
    const token = getAuthToken();
    try {
      const query = includeCoHosts ? '?includeCoHosts=true' : '';
      return await apiClient.get<Event>(`/events/${id}${query}`, token);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  create: async (req: CreateEventRequest): Promise<CreateEventResponse> => {
    const token = getAuthToken();
    if (!token) {
      console.error('[eventsApi.create] No token found in store');
      throw new Error('Authentication required to create events. Please log in again.');
    }
    console.log('[eventsApi.create] Token found, making request...');
    return await apiClient.post<CreateEventResponse>('/events', req, token);
  },

  join: async (
    eventId: string,
    paymentMethod?: 'points' | 'cash' | 'credit_card',
    pointsAmount?: number,
    paymentIntentId?: string
  ): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required to join events');
    }
    const body: { paymentMethod?: string; pointsAmount?: number; paymentIntentId?: string } = {};
    if (paymentMethod) {
      body.paymentMethod = paymentMethod;
    }
    if (pointsAmount !== undefined) {
      body.pointsAmount = pointsAmount;
    }
    if (paymentIntentId) {
      body.paymentIntentId = paymentIntentId;
    }
    await apiClient.post(`/events/${eventId}/join`, body, token);
  },

  createPaymentIntent: async (
    eventId: string,
    pointsAmount?: number
  ): Promise<{ clientSecret: string; paymentIntentId: string }> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    return await apiClient.post<{ clientSecret: string; paymentIntentId: string }>(
      `/events/${eventId}/create-payment-intent`,
      pointsAmount != null ? { pointsAmount } : {},
      token
    );
  },

  leave: async (eventId: string): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required to leave events');
    }
    await apiClient.post(`/events/${eventId}/leave`, {}, token);
  },

  getAttendees: async (eventId: string): Promise<EventAttendee[]> => {
    return await apiClient.get<EventAttendee[]>(`/events/${eventId}/attendees`);
  },

  cancel: async (eventId: string, cancelSeries: boolean = false): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    await apiClient.post(`/events/${eventId}/cancel`, { cancelSeries }, token);
  },

  update: async (eventId: string, req: UpdateEventRequest): Promise<CreateEventResponse> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required to update events');
    }
    return await apiClient.patch<CreateEventResponse>(`/events/${eventId}`, req, token);
  },

  getCoHosts: async (eventId: string): Promise<EventCoHost[]> => {
    const token = getAuthToken();
    // Token is optional - co-hosts are public information
    return await apiClient.get<EventCoHost[]>(`/events/${eventId}/co-hosts`, token);
  },

  addCoHost: async (eventId: string, req: AddCoHostRequest): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    await apiClient.post(`/events/${eventId}/co-hosts`, req, token);
  },

  removeCoHost: async (eventId: string, userId: string): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    await apiClient.delete(`/events/${eventId}/co-hosts/${userId}`, token);
  },

  updateCoHostPermission: async (eventId: string, userId: string, req: UpdateCoHostRequest): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    await apiClient.patch(`/events/${eventId}/co-hosts/${userId}`, req, token);
  },

  verifyTicket: async (eventId: string, ticketNumber: string, userId?: string): Promise<{ admitted: boolean; message?: string; pointsAwarded?: number }> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    return await apiClient.post<{ admitted: boolean; message?: string; pointsAwarded?: number }>(
      `/events/${eventId}/tickets/verify`,
      { ticketNumber, userId },
      token
    );
  },
};
