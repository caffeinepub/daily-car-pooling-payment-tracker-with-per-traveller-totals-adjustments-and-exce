import { startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';

export interface DateRange {
  start: Date;
  end: Date;
}

export function getCurrentMonthRange(): DateRange {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}

export function getCurrentWeekMondayToFriday(): DateRange {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 4); // Friday (Monday + 4 days)
  
  return {
    start: weekStart,
    end: weekEnd,
  };
}

export function getFullMonthRange(year: number, month: number): DateRange {
  const date = new Date(year, month - 1, 1);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function getFullYearRange(year: number): DateRange {
  const date = new Date(year, 0, 1);
  return {
    start: startOfYear(date),
    end: endOfYear(date),
  };
}

export function getDaysInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getWeekdaysInRange(start: Date, end: Date): Date[] {
  const allDays = getDaysInRange(start, end);
  return allDays.filter((day) => {
    const dayOfWeek = day.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sunday (0) and Saturday (6)
  });
}

export type DateRangeClassification =
  | { type: 'full-month'; month: number; year: number }
  | { type: 'full-year'; year: number }
  | { type: 'custom'; year?: number };

export function classifyDateRange(start: Date, end: Date): DateRangeClassification {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.getMonth() + 1;
  const endMonth = end.getMonth() + 1;

  // Check if it's a full year
  const yearStart = startOfYear(new Date(startYear, 0, 1));
  const yearEnd = endOfYear(new Date(startYear, 0, 1));
  if (
    start.getTime() === yearStart.getTime() &&
    end.getTime() === yearEnd.getTime()
  ) {
    return { type: 'full-year', year: startYear };
  }

  // Check if it's a full month
  if (startYear === endYear) {
    const monthStart = startOfMonth(new Date(startYear, startMonth - 1, 1));
    const monthEnd = endOfMonth(new Date(startYear, startMonth - 1, 1));
    if (
      start.getTime() === monthStart.getTime() &&
      end.getTime() === monthEnd.getTime()
    ) {
      return { type: 'full-month', month: startMonth, year: startYear };
    }
  }

  // Otherwise it's custom
  return { type: 'custom', year: startYear === endYear ? startYear : undefined };
}
