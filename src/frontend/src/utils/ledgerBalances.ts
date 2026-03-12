import { parseISO } from "date-fns";
import type {
  CashPayment,
  DailyData,
  DateRange,
  OtherPending,
  Traveller,
} from "../hooks/useLedgerLocalState";
import { formatDateKey, getDaysInRange } from "./dateRange";
import { isDateIncludedForCalculation } from "./weekendInclusion";

export interface TravellerBalanceResult {
  totalTrips: number;
  totalCharge: number;
  totalPayments: number;
  balance: number;
}

export function calculateTravellerBalance(
  travellerId: string,
  dailyData: DailyData,
  dateRange: DateRange,
  ratePerTrip: number,
  cashPayments: CashPayment[],
  includeSaturday: boolean,
  includeSunday: boolean,
  otherPending?: OtherPending[],
): TravellerBalanceResult {
  const days = getDaysInRange(dateRange.start, dateRange.end);

  let totalTrips = 0;
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

    const tripData = dailyData[dateKey]?.[travellerId];
    if (tripData) {
      const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
      totalTrips += tripCount;
    }
  }

  const totalCharge = totalTrips * ratePerTrip;

  const paymentsInRange = cashPayments
    .filter((p) => {
      if (p.travellerId !== travellerId) return false;
      try {
        const paymentDate = parseISO(p.date);
        return paymentDate >= dateRange.start && paymentDate <= dateRange.end;
      } catch {
        return false;
      }
    })
    .reduce((sum, p) => sum + p.amount, 0);

  let otherPendingInRange = 0;
  if (otherPending) {
    otherPendingInRange = otherPending
      .filter((p) => {
        if (p.travellerId !== travellerId) return false;
        try {
          const pendingDate = parseISO(p.date);
          return pendingDate >= dateRange.start && pendingDate <= dateRange.end;
        } catch {
          return false;
        }
      })
      .reduce((sum, p) => sum + p.amount, 0);
  }

  const balance = totalCharge + otherPendingInRange - paymentsInRange;

  return {
    totalTrips,
    totalCharge,
    totalPayments: paymentsInRange,
    balance,
  };
}

// Re-export Traveller type so callers don't need a separate import
export type { Traveller };
