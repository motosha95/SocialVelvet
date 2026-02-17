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
  isPaid?: boolean; // Whether this is a paid event (vs free)
  price?: number; // Single price (when no tiers)
  pricingTiers?: PricingTier[]; // Up to 4 tiers: { name, price }
  currency?: string; // Currency code (default AED)
  topics?: string[]; // Up to 3 topics from predefined list
  canEdit?: boolean; // Whether current user can edit
  isFromFollowedHost?: boolean; // Whether the organizer is someone the current user follows
  coHosts?: EventCoHost[]; // Co-hosts (only included when fetching single event with permissions)
  seriesId?: string; // ID linking events in a series
  seriesInterval?: SeriesInterval; // Interval for series recurrence
  seriesIndex?: number; // Index of this event in the series (0-based)
  isCancelled?: boolean; // Whether the event has been cancelled
  listFrom?: string; // Early access: visible to all after this date; VIPs see before
  vipOnly?: boolean; // Only VIP Plus can see and join
  isCuratedPick?: boolean; // Featured in weekly VIP picks
  vipDiscountPercent?: number; // 10 or 20 when user has VIP discount applied
  createdAt: string;
  updatedAt: string;
}

export interface PricingTier {
  name: string;
  price: number;
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
  isPaid?: boolean; // If true, creates a paid event (vs free)
  price?: number; // Single price (when not using tiers)
  pricingTiers?: PricingTier[]; // Up to 4 tiers: { name, price }
  currency?: string; // Currency code (default AED)
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
  isPaid?: boolean;
  price?: number | null;
  pricingTiers?: PricingTier[] | null;
  currency?: string;
  topics?: string[];
  listFrom?: string | null; // ISO date; before this only VIPs see event (early access)
  vipOnly?: boolean;
  isCuratedPick?: boolean;
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
