/**
 * Predefined event topics. Users can select up to 3 per event.
 * Must match backend EVENT_TOPICS.
 */
export const EVENT_TOPICS = [
  'Music',
  'Tech',
  'Networking',
  'Sports',
  'Food & Drink',
  'Arts & Culture',
  'Wellness',
  'Education',
  'Business',
  'Social',
  'Gaming',
  'Outdoor',
  'Community',
  'Film & Cinema',
  'Photography',
  'Travel',
  'Fashion',
  'Volunteering',
  'Science',
  'Startups',
  'Finance',
  'Meditation',
  'Yoga',
  'Running',
  'Cycling',
  'Comedy',
  'Literature',
  'Dance',
  'Cooking',
  'Wine Tasting',
  'Environment',
  'Career',
  'Language Exchange',
  'Book Club',
  'Trivia',
  'Karaoke',
  'DIY & Crafts',
  'Pets',
  'Other',
] as const;

export type EventTopic = (typeof EVENT_TOPICS)[number];

export const MAX_EVENT_TOPICS = 3;
