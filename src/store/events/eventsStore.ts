import { create } from 'zustand';

import { eventsApi } from '../../api/eventsApi';
import type { Event } from '../../features/events/types';
import type { EventsActions, EventsState } from './types';

export type EventsStore = EventsState & EventsActions;

const PAGE_SIZE = 10;

export const useEventsStore = create<EventsStore>((set, get) => ({
  events: [],
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  error: null,

  fetchEvents: async () => {
    const state = get();
    if (state.isLoading) {
      return;
    }

    set({ isLoading: true, error: null, hasMore: true });

    try {
      const events = await eventsApi.list(true, PAGE_SIZE, 0);
      set({
        events,
        isLoading: false,
        error: null,
        hasMore: events.length >= PAGE_SIZE,
      });
    } catch (err) {
      set({
        isLoading: false,
        hasMore: false,
        error: err instanceof Error ? err.message : 'Failed to load events',
      });
    }
  },

  loadMoreEvents: async () => {
    const state = get();
    if (state.isLoadingMore || !state.hasMore || state.isLoading) {
      return;
    }

    set({ isLoadingMore: true });

    try {
      const offset = state.events.length;
      const more = await eventsApi.list(true, PAGE_SIZE, offset);
      const events = [...state.events, ...more];
      set({
        events,
        isLoadingMore: false,
        hasMore: more.length >= PAGE_SIZE,
      });
    } catch (err) {
      set({
        isLoadingMore: false,
        hasMore: false,
      });
    }
  },

  refreshEvents: async () => {
    set({ error: null });

    try {
      const events = await eventsApi.list(true, PAGE_SIZE, 0);
      set({ events, error: null, hasMore: events.length >= PAGE_SIZE });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to refresh events',
      });
    }
  },

  joinEvent: async (
    eventId: string,
    paymentMethod?: 'points' | 'cash' | 'credit_card',
    pointsAmount?: number
  ) => {
    try {
      await eventsApi.join(eventId, paymentMethod, pointsAmount);
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

  removeEvent: (eventId: string) => {
    set({ events: get().events.filter((e) => e.id !== eventId) });
  },

  removeEventsBySeriesId: (seriesId: string) => {
    set({ events: get().events.filter((e) => e.seriesId !== seriesId) });
  },
}));

