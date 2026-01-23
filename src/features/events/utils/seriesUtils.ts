import type { SeriesInterval } from '../types';

const MAX_SERIES_EVENTS = 12;

/**
 * Generate dates for an event series based on the interval
 */
export const generateSeriesDates = (
  startDate: Date,
  interval: SeriesInterval,
  count: number = MAX_SERIES_EVENTS
): Date[] => {
  const dates: Date[] = [new Date(startDate)];
  
  for (let i = 1; i < count && i < MAX_SERIES_EVENTS; i++) {
    const nextDate = new Date(startDate);
    
    switch (interval) {
      case '1week':
        nextDate.setDate(nextDate.getDate() + (i * 7));
        break;
      case '2weeks':
        nextDate.setDate(nextDate.getDate() + (i * 14));
        break;
      case '3weeks':
        nextDate.setDate(nextDate.getDate() + (i * 21));
        break;
      case '1month':
        nextDate.setMonth(nextDate.getMonth() + i);
        break;
    }
    
    dates.push(nextDate);
  }
  
  return dates;
};

/**
 * Get a human-readable label for the series interval
 */
export const getSeriesLabel = (interval: SeriesInterval): string => {
  switch (interval) {
    case '1week':
      return 'Happens weekly';
    case '2weeks':
      return 'Happens bi-weekly';
    case '3weeks':
      return 'Happens every 3 weeks';
    case '1month':
      return 'Happens monthly';
  }
};

/**
 * Get a short label for the series interval
 */
export const getSeriesShortLabel = (interval: SeriesInterval): string => {
  switch (interval) {
    case '1week':
      return 'Weekly';
    case '2weeks':
      return 'Bi-weekly';
    case '3weeks':
      return 'Every 3 weeks';
    case '1month':
      return 'Monthly';
  }
};

export { MAX_SERIES_EVENTS };
