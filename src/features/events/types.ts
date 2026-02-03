export type SeriesInterval = '1week' | '2weeks' | '3weeks' | '1month';

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string; // ISO 8601 format
  imageUrl?: string;
  organizerId: string;
  organizerName: string;
  attendeeCount: number;
  maxAttendees?: number;
  isJoined: boolean;
  isTicketed?: boolean; // Whether this is a ticketed event
  topics?: string[]; // Up to 3 topics from predefined list
  canEdit?: boolean; // Whether current user can edit
  isFromFollowedHost?: boolean; // Whether the organizer is someone the current user follows
  coHosts?: EventCoHost[]; // Co-hosts (only included when fetching single event with permissions)
  seriesId?: string; // ID linking events in a series
  seriesInterval?: SeriesInterval; // Interval for series recurrence
  seriesIndex?: number; // Index of this event in the series (0-based)
  createdAt: string;
  updatedAt: string;
}

export interface EventCoHost {
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  canEdit: boolean;
  createdAt: string;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  location: string;
  date: string; // ISO 8601 format
  maxAttendees?: number;
  imageUrl?: string;
  isTicketed?: boolean; // If true, creates a ticketed event
  topics?: string[]; // Up to 3 from predefined list
  seriesInterval?: SeriesInterval; // If provided, creates a series
  seriesCount?: number; // Number of events in series (max 12, default 12)
}

export interface CreateEventResponse {
  event: Event;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  location?: string;
  date?: string;
  maxAttendees?: number;
  imageUrl?: string | null;
  topics?: string[];
  updateAllFutureEvents?: boolean; // If true, applies changes to all future events in the series
}

export interface AddCoHostRequest {
  userId: string;
  canEdit?: boolean;
}

export interface UpdateCoHostRequest {
  canEdit: boolean;
}

export interface EventAttendee {
  userId: string;
  name: string;
  avatarUrl?: string;
  joinedAt: string;
  admittedAt?: string; // When ticket was scanned/admitted
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventImageUrl?: string;
  ticketNumber: string; // Unique ticket identifier
  createdAt: string;
}
