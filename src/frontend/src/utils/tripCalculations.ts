import { getDaysInRange, formatDateKey } from './dateRange';
import { isDateIncluded } from './weekendInclusion';
import type { DateRange, DailyData } from '../hooks/useLedgerLocalState';

/**
 * Calculate total income from dailyData within a date range.
 * This calculation is based on the recorded trip data (dailyData keys),
 * not on the current travellers list, so it remains stable even after
 * travellers are deleted.
 */
export function calculateIncomeFromDailyData(
  dailyData: DailyData,
  dateRange: DateRange,
  ratePerTrip: number,
  includeSaturday: boolean,
  includeSunday: boolean
): number {
  const days = getDaysInRange(dateRange.start, dateRange.end);
  let totalIncome = 0;

  days.forEach((day) => {
    const dateKey = formatDateKey(day);
    const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
    if (!isIncluded) return;

    const dayData = dailyData[dateKey];
    if (!dayData) return;

    // Iterate over all traveller IDs present in the daily data for this date
    Object.keys(dayData).forEach((travellerId) => {
      const tripData = dayData[travellerId];
      if (tripData) {
        const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
        totalIncome += tripCount * ratePerTrip;
      }
    });
  });

  return totalIncome;
}

/**
 * Calculate monthly income breakdown from dailyData.
 * Returns a map of month keys (yyyy-MM) to income amounts.
 */
export function calculateMonthlyIncomeFromDailyData(
  dailyData: DailyData,
  dateRange: DateRange,
  ratePerTrip: number,
  includeSaturday: boolean,
  includeSunday: boolean
): Map<string, number> {
  const days = getDaysInRange(dateRange.start, dateRange.end);
  const monthlyIncome = new Map<string, number>();

  days.forEach((day) => {
    const dateKey = formatDateKey(day);
    const monthKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}`;
    const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
    
    if (!isIncluded) return;

    const dayData = dailyData[dateKey];
    if (!dayData) return;

    let dayIncome = 0;
    Object.keys(dayData).forEach((travellerId) => {
      const tripData = dayData[travellerId];
      if (tripData) {
        const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
        dayIncome += tripCount * ratePerTrip;
      }
    });

    monthlyIncome.set(monthKey, (monthlyIncome.get(monthKey) || 0) + dayIncome);
  });

  return monthlyIncome;
}
