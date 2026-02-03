import { create } from 'zustand';

import { eventsApi } from '../../api/eventsApi';
import type { Event } from '../../features/events/types';
import type { EventsActions, EventsState } from './types';

export type EventsStore = EventsState & EventsActions;

export const useEventsStore = create<EventsStore>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    const state = get();
    if (state.isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const events = await eventsApi.list(true); // Prioritize events from followed hosts
      set({ events, isLoading: false, error: null });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load events',
      });
    }
  },

  refreshEvents: async () => {
    set({ error: null });

    try {
      const events = await eventsApi.list(true);
      set({ events, error: null });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to refresh events',
      });
    }
  },

  joinEvent: async (eventId: string) => {
    try {
      await eventsApi.join(eventId);
      // Optimistically update the store, but the UI will refresh from API for accuracy
      const events = get().events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              isJoined: true,
              attendeeCount: Math.max(event.attendeeCount, (event.attendeeCount || 0) + 1),
            }
          : event
      );
      set({ events });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to join event';
      set({ error });
      throw new Error(error);
    }
  },

  leaveEvent: async (eventId: string) => {
    try {
      await eventsApi.leave(eventId);
      // Optimistically update the store, but the UI will refresh from API for accuracy
      const events = get().events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              isJoined: false,
              attendeeCount: Math.max(0, (event.attendeeCount || 1) - 1),
            }
          : event
      );
      set({ events });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to leave event';
      set({ error });
      throw new Error(error);
    }
  },

  addEvent: (event: Event) => {
    const events = [event, ...get().events];
    set({ events });
  },

  updateEvent: (updatedEvent: Event) => {
    const events = get().events.map((event) => (event.id === updatedEvent.id ? updatedEvent : event));
    set({ events });
  },
}));

