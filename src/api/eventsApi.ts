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

export const eventsApi = {
  list: async (): Promise<Event[]> => {
    const token = getAuthToken();
    return await apiClient.get<Event[]>('/events', token);
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

  join: async (eventId: string): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required to join events');
    }
    await apiClient.post(`/events/${eventId}/join`, {}, token);
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
};
