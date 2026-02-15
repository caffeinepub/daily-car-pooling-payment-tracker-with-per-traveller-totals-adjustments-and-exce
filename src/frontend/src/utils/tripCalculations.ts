import { getDaysInRange, formatDateKey } from './dateRange';
import { isDateIncludedForCalculation } from './weekendInclusion';
import type { DateRange, DailyData, CoTravellerIncome } from '../hooks/useLedgerLocalState';
import { parseISO } from 'date-fns';

/**
 * Calculate total income from dailyData within a date range.
 * This calculation is based on the recorded trip data (dailyData keys),
 * not on the current travellers list, so it remains stable even after
 * travellers are deleted.
 * 
 * Weekend trips are included if:
 * - The relevant weekend checkbox is enabled, OR
 * - The date has saved trip data in dailyData
 */
export function calculateIncomeFromDailyData(
  dailyData: DailyData,
  dateRange: DateRange,
  ratePerTrip: number,
  includeSaturday: boolean,
  includeSunday: boolean,
  coTravellerIncomes?: CoTravellerIncome[]
): number {
  const days = getDaysInRange(dateRange.start, dateRange.end);
  let totalIncome = 0;

  days.forEach((day) => {
    const dateKey = formatDateKey(day);
    const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);
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

  // Add co-traveller income within date range
  if (coTravellerIncomes) {
    coTravellerIncomes.forEach((income) => {
      try {
        const incomeDate = parseISO(income.date);
        if (incomeDate >= dateRange.start && incomeDate <= dateRange.end) {
          totalIncome += income.amount;
        }
      } catch {
        // Skip invalid dates
      }
    });
  }

  return totalIncome;
}

/**
 * Calculate monthly income breakdown from dailyData.
 * Returns a map of month keys (yyyy-MM) to income amounts.
 * 
 * Weekend trips are included if:
 * - The relevant weekend checkbox is enabled, OR
 * - The date has saved trip data in dailyData
 */
export function calculateMonthlyIncomeFromDailyData(
  dailyData: DailyData,
  dateRange: DateRange,
  ratePerTrip: number,
  includeSaturday: boolean,
  includeSunday: boolean,
  coTravellerIncomes?: CoTravellerIncome[]
): Map<string, number> {
  const days = getDaysInRange(dateRange.start, dateRange.end);
  const monthlyIncome = new Map<string, number>();

  days.forEach((day) => {
    const dateKey = formatDateKey(day);
    const monthKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}`;
    const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);
    
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

  // Add co-traveller income to monthly breakdown
  if (coTravellerIncomes) {
    coTravellerIncomes.forEach((income) => {
      try {
        const incomeDate = parseISO(income.date);
        if (incomeDate >= dateRange.start && incomeDate <= dateRange.end) {
          const monthKey = `${incomeDate.getFullYear()}-${String(incomeDate.getMonth() + 1).padStart(2, '0')}`;
          monthlyIncome.set(monthKey, (monthlyIncome.get(monthKey) || 0) + income.amount);
        }
      } catch {
        // Skip invalid dates
      }
    });
  }

  return monthlyIncome;
}
