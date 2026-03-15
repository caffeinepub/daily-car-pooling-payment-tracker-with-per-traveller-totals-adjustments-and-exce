import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Returns today's date string (YYYY-MM-DD) using the device's local timezone.
 * Uses local date parts to avoid UTC conversion issues (day-ahead bug in IST).
 */
export function getTodayIST(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns a Date object for today using the device's local timezone.
 */
export function getTodayDateIST(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getCurrentMonthRange(): DateRange {
  const now = getTodayDateIST();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}

export function getCurrentWeekMondayToFriday(): DateRange {
  const now = getTodayDateIST();
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

/**
 * Returns a YYYY-MM-DD key for the given date using LOCAL date parts.
 * CRITICAL: Do NOT use toISOString() here — it converts to UTC and causes
 * a day-ahead mismatch for IST users (UTC+5:30).
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getWeekdaysInRange(start: Date, end: Date): Date[] {
  const allDays = getDaysInRange(start, end);
  return allDays.filter((day) => {
    const dayOfWeek = day.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sunday (0) and Saturday (6)
  });
}

export type DateRangeClassification =
  | { type: "full-month"; month: number; year: number }
  | { type: "full-year"; year: number }
  | { type: "custom"; year?: number };

export function classifyDateRange(
  start: Date,
  end: Date,
): DateRangeClassification {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.getMonth() + 1;

  // Check if it's a full year
  const yearStart = startOfYear(new Date(startYear, 0, 1));
  const yearEnd = endOfYear(new Date(startYear, 0, 1));
  if (
    start.getTime() === yearStart.getTime() &&
    end.getTime() === yearEnd.getTime()
  ) {
    return { type: "full-year", year: startYear };
  }

  // Check if it's a full month
  if (startYear === endYear) {
    const monthStart = startOfMonth(new Date(startYear, startMonth - 1, 1));
    const monthEnd = endOfMonth(new Date(startYear, startMonth - 1, 1));
    if (
      start.getTime() === monthStart.getTime() &&
      end.getTime() === monthEnd.getTime()
    ) {
      return { type: "full-month", month: startMonth, year: startYear };
    }
  }

  // Otherwise it's custom
  return {
    type: "custom",
    year: startYear === endYear ? startYear : undefined,
  };
}
