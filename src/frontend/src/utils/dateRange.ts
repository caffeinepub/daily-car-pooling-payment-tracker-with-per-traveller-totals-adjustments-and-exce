import { format, eachDayOfInterval, startOfWeek, endOfWeek, addDays, getDay, startOfYear, endOfYear, startOfMonth, endOfMonth, isSameDay, isSameYear } from 'date-fns';

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
 * Get the current calendar month date range (first day to last day)
 */
export function getCurrentMonth(): { start: Date; end: Date } {
  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  return { start, end };
}

/**
 * Get the full month date range for a given month and year
 */
export function getFullMonthRange(year: number, month: number): { start: Date; end: Date } {
  const date = new Date(year, month - 1, 1); // month is 1-indexed
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return { start, end };
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

/**
 * Classify a date range as exact full-month, exact full-year, or custom
 */
export interface DateRangeClassification {
  type: 'full-month' | 'full-year' | 'custom';
  year?: number;
  month?: number; // 1-indexed (1 = January, 12 = December)
}

export function classifyDateRange(start: Date, end: Date): DateRangeClassification {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.getMonth(); // 0-indexed
  const endMonth = end.getMonth(); // 0-indexed

  // Check if it's a full year (Jan 1 to Dec 31 of the same year)
  const yearStart = startOfYear(new Date(startYear, 0, 1));
  const yearEnd = endOfYear(new Date(startYear, 0, 1));
  if (isSameDay(start, yearStart) && isSameDay(end, yearEnd) && isSameYear(start, end)) {
    return { type: 'full-year', year: startYear };
  }

  // Check if it's a full month (first day to last day of the same month/year)
  if (startYear === endYear && startMonth === endMonth) {
    const monthStart = startOfMonth(new Date(startYear, startMonth, 1));
    const monthEnd = endOfMonth(new Date(startYear, startMonth, 1));
    if (isSameDay(start, monthStart) && isSameDay(end, monthEnd)) {
      return { type: 'full-month', year: startYear, month: startMonth + 1 }; // Return 1-indexed month
    }
  }

  // Otherwise it's custom
  return { type: 'custom' };
}
