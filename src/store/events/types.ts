import type { Event } from '../../features/events/types';

export interface EventsState {
  events: Event[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
}

export interface EventsActions {
  fetchEvents: () => Promise<void>;
  loadMoreEvents: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  joinEvent: (eventId: string, paymentMethod?: 'points' | 'cash' | 'credit_card', pointsAmount?: number, paymentIntentId?: string) => Promise<void>;
  leaveEvent: (eventId: string) => Promise<void>;
  addEvent: (event: Event) => void;
  updateEvent: (event: Event) => void;
  removeEvent: (eventId: string) => void;
  removeEventsBySeriesId: (seriesId: string) => void;
}

