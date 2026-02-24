import { Share } from 'react-native';
import type { Event } from '../types';

export async function shareEvent(event: Event): Promise<void> {
  const date = new Date(event.date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const message = [
    `${event.title}`,
    `📅 ${date}`,
    `📍 ${event.location}`,
    event.description ? `\n${event.description}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  await Share.share({
    message,
    title: event.title,
  });
}
