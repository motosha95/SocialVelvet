// Simple in-memory store for admitted tickets per event
// Maps eventId -> Set of admitted user IDs
const admittedTicketsStore = new Map<string, Set<string>>();

export const getAdmittedUserIds = (eventId: string): Set<string> => {
  return admittedTicketsStore.get(eventId) || new Set();
};

export const addAdmittedUserId = (eventId: string, userId: string): void => {
  const current = admittedTicketsStore.get(eventId) || new Set();
  current.add(userId);
  admittedTicketsStore.set(eventId, current);
};

export const setAdmittedUserIds = (eventId: string, userIds: Set<string>): void => {
  admittedTicketsStore.set(eventId, userIds);
};

export const clearAdmittedTickets = (eventId: string): void => {
  admittedTicketsStore.delete(eventId);
};
