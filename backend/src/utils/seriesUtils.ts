export type SeriesInterval = '1week' | '2weeks' | '3weeks' | '1month';

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
  
  // Limit to max series events
  const actualCount = Math.min(count, MAX_SERIES_EVENTS);
  
  for (let i = 1; i < actualCount; i++) {
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

export { MAX_SERIES_EVENTS };
