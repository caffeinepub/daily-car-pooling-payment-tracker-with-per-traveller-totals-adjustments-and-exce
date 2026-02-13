import { parseISO } from 'date-fns';
import { getDaysInRange, formatDateKey } from './dateRange';
import { isDateIncluded } from './weekendInclusion';
import type { Traveller, DateRange, DailyData, CashPayment, OtherPending } from '../hooks/useLedgerLocalState';

/**
 * Calculate the balance for a specific traveller within the given date range
 * Returns the total amount owed (positive) or overpaid (negative)
 */
export function calculateTravellerBalance(
  travellerId: string,
  dateRange: DateRange,
  dailyData: DailyData,
  ratePerTrip: number,
  cashPayments: CashPayment[],
  otherPending: OtherPending[],
  includeSaturday: boolean,
  includeSunday: boolean
): number {
  const days = getDaysInRange(dateRange.start, dateRange.end);
  
  // Calculate total trips
  let totalTrips = 0;
  days.forEach((day) => {
    const dateKey = formatDateKey(day);
    const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
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

  // Calculate other pending in range
  const otherPendingInRange = otherPending
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

  // Balance = charges + other pending - payments
  return totalCharge + otherPendingInRange - paymentsInRange;
}
