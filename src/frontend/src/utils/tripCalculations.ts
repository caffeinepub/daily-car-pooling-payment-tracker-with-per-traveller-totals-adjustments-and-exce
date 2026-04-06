import { parseISO } from "date-fns";
import type {
  CoTravellerIncome,
  DailyData,
  DateRange,
} from "../hooks/useLedgerLocalState";
import { formatDateKey, getDaysInRange } from "./dateRange";
import { type RateHistoryEntry, getRateForDate } from "./rateHistory";
import { isDateIncludedForCalculation } from "./weekendInclusion";

export function calculateIncomeFromDailyData(
  dailyData: DailyData,
  dateRange: DateRange,
  ratePerTrip: number,
  includeSaturday: boolean,
  includeSunday: boolean,
  coTravellerIncomes?: CoTravellerIncome[],
  rateHistory?: RateHistoryEntry[],
): number {
  const days = getDaysInRange(dateRange.start, dateRange.end);
  let totalIncome = 0;

  for (const day of days) {
    const dateKey = formatDateKey(day);
    const isIncluded = isDateIncludedForCalculation(
      day,
      includeSaturday,
      includeSunday,
      dateKey,
      dailyData,
    );
    if (!isIncluded) continue;

    const dayData = dailyData[dateKey];
    if (!dayData) continue;

    const rateForDay = getRateForDate(day, rateHistory ?? [], ratePerTrip);
    for (const travellerId of Object.keys(dayData)) {
      const tripData = dayData[travellerId];
      if (tripData) {
        const tripCount =
          (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
        totalIncome += tripCount * rateForDay;
      }
    }
  }

  if (coTravellerIncomes) {
    for (const income of coTravellerIncomes) {
      try {
        const incomeDate = parseISO(income.date);
        if (incomeDate >= dateRange.start && incomeDate <= dateRange.end) {
          totalIncome += income.amount;
        }
      } catch {
        // Skip invalid dates
      }
    }
  }

  return totalIncome;
}

export function calculateMonthlyIncomeFromDailyData(
  dailyData: DailyData,
  dateRange: DateRange,
  ratePerTrip: number,
  includeSaturday: boolean,
  includeSunday: boolean,
  coTravellerIncomes?: CoTravellerIncome[],
  rateHistory?: RateHistoryEntry[],
): Map<string, number> {
  const days = getDaysInRange(dateRange.start, dateRange.end);
  const monthlyIncome = new Map<string, number>();

  for (const day of days) {
    const dateKey = formatDateKey(day);
    const monthKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}`;
    const isIncluded = isDateIncludedForCalculation(
      day,
      includeSaturday,
      includeSunday,
      dateKey,
      dailyData,
    );

    if (!isIncluded) continue;

    const dayData = dailyData[dateKey];
    if (!dayData) continue;

    const rateForDay = getRateForDate(day, rateHistory ?? [], ratePerTrip);
    let dayIncome = 0;
    for (const travellerId of Object.keys(dayData)) {
      const tripData = dayData[travellerId];
      if (tripData) {
        const tripCount =
          (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
        dayIncome += tripCount * rateForDay;
      }
    }

    monthlyIncome.set(monthKey, (monthlyIncome.get(monthKey) || 0) + dayIncome);
  }

  if (coTravellerIncomes) {
    for (const income of coTravellerIncomes) {
      try {
        const incomeDate = parseISO(income.date);
        if (incomeDate >= dateRange.start && incomeDate <= dateRange.end) {
          const monthKey = `${incomeDate.getFullYear()}-${String(incomeDate.getMonth() + 1).padStart(2, "0")}`;
          monthlyIncome.set(
            monthKey,
            (monthlyIncome.get(monthKey) || 0) + income.amount,
          );
        }
      } catch {
        // Skip invalid dates
      }
    }
  }

  return monthlyIncome;
}
