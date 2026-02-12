// Auth types (matching frontend)
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  userId: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  accessToken: string;
  userId: string;
}

// Event types (matching frontend)
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
  seriesInterval?: '1week' | '2weeks' | '3weeks' | '1month'; // Interval for series recurrence
  seriesIndex?: number; // Index of this event in the series (0-based)
  isCancelled?: boolean; // Whether the event has been cancelled
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
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  location?: string;
  date?: string;
  maxAttendees?: number;
  imageUrl?: string;
  isPaid?: boolean;
  price?: number | null;
  pricingTiers?: PricingTier[] | null;
  currency?: string;
  topics?: string[];
}

export interface AddCoHostRequest {
  userId: string;
  canEdit?: boolean;
}

export interface UpdateCoHostRequest {
  canEdit: boolean;
}

export interface CreateEventResponse {
  event: Event;
}

export interface EventAttendee {
  userId: string;
  name: string;
  avatarUrl?: string;
  joinedAt: string;
  admittedAt?: string; // When ticket was scanned/admitted
}

// Chat types
export interface Conversation {
  id: string;
  eventId?: string;
  participants: Array<{
    userId: string;
    name: string;
    avatarUrl?: string;
  }>;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  };
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  createdAt: string;
}

// User profile types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}