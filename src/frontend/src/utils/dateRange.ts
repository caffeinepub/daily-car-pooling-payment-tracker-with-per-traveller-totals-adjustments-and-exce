import { format, eachDayOfInterval, startOfWeek, endOfWeek, addDays, getDay, startOfYear, endOfYear } from 'date-fns';

export function getDaysInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'MMM dd, EEE');
}

/**
 * Get the current week's Monday–Friday date range
 */
export function getCurrentWeekMondayToFriday(): { start: Date; end: Date } {
  const today = new Date();
  // Get Monday of current week (week starts on Monday)
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  // Get Friday of current week
  const friday = addDays(monday, 4);
  
  return { start: monday, end: friday };
}

/**
 * Get the full year date range (Jan 1 – Dec 31) for a given year
 */
export function getFullYearRange(year: number): { start: Date; end: Date } {
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(new Date(year, 0, 1));
  return { start, end };
}

/**
 * Get all weekdays (Mon-Fri) within a date range as date keys
 */
export function getWeekdaysInRange(start: Date, end: Date): string[] {
  const allDays = getDaysInRange(start, end);
  return allDays
    .filter((date) => {
      const day = getDay(date);
      // 0 = Sunday, 6 = Saturday; we want 1-5 (Mon-Fri)
      return day >= 1 && day <= 5;
    })
    .map(formatDateKey);
}
