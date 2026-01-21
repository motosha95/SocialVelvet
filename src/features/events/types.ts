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
  canEdit?: boolean; // Whether current user can edit
  coHosts?: EventCoHost[]; // Co-hosts (only included when fetching single event with permissions)
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
}

