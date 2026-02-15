import { parseISO } from 'date-fns';
import { getDaysInRange, formatDateKey } from './dateRange';
import { isDateIncludedForCalculation } from './weekendInclusion';
import type { Traveller, DateRange, DailyData, CashPayment, OtherPending } from '../hooks/useLedgerLocalState';

export interface TravellerBalanceResult {
  totalTrips: number;
  totalCharge: number;
  totalPayments: number;
  balance: number;
}

/**
 * Calculate the balance for a specific traveller within the given date range
 * Returns an object with total trips, charges, payments, and balance
 * 
 * Weekend trips are included if:
 * - The relevant weekend checkbox is enabled, OR
 * - The date has saved trip data in dailyData
 */
export function calculateTravellerBalance(
  travellerId: string,
  dailyData: DailyData,
  dateRange: DateRange,
  ratePerTrip: number,
  cashPayments: CashPayment[],
  includeSaturday: boolean,
  includeSunday: boolean,
  otherPending?: OtherPending[]
): TravellerBalanceResult {
  const days = getDaysInRange(dateRange.start, dateRange.end);
  
  // Calculate total trips
  let totalTrips = 0;
  days.forEach((day) => {
    const dateKey = formatDateKey(day);
    const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);
    if (!isIncluded) return;

    const tripData = dailyData[dateKey]?.[travellerId];
    if (tripData) {
      const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
      totalTrips += tripCount;
    }
  });

  const totalCharge = totalTrips * ratePerTrip;

  // Calculate payments in range
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

  // Calculate other pending in range (if provided)
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

  // Balance = charges + other pending - payments
  const balance = totalCharge + otherPendingInRange - paymentsInRange;

  return {
    totalTrips,
    totalCharge,
    totalPayments: paymentsInRange,
    balance,
  };
}
