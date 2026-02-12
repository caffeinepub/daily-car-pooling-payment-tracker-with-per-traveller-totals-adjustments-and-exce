import { parseISO } from 'date-fns';
import { getDaysInRange, formatDateKey } from './dateRange';
import { isDateIncluded } from './weekendInclusion';
import type { Traveller, DateRange, DailyData, CashPayment, OtherPending } from '../hooks/useLedgerLocalState';

export interface TravellerBalance {
  id: string;
  name: string;
  totalTrips: number;
  totalCharge: number;
  otherPending: number;
  payments: number;
  balance: number;
  status: 'Owes' | 'Overpaid' | 'Settled';
}

export function calculateTravellerBalance(
  traveller: Traveller,
  dateRange: DateRange,
  dailyData: DailyData,
  ratePerTrip: number,
  cashPayments: CashPayment[],
  otherPending: OtherPending[],
  includeSaturday: boolean,
  includeSunday: boolean
): TravellerBalance {
  const days = getDaysInRange(dateRange.start, dateRange.end);
  let totalTrips = 0;

  days.forEach((day) => {
    const dateKey = formatDateKey(day);
    const tripData = dailyData[dateKey]?.[traveller.id];
    
    if (tripData) {
      const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
      if (!isIncluded) return;
      
      const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
      totalTrips += tripCount;
    }
  });

  const totalCharge = totalTrips * ratePerTrip;

  // Calculate payments within the selected date range
  const paymentsInRange = cashPayments
    .filter((p) => {
      if (p.travellerId !== traveller.id) return false;
      try {
        const paymentDate = parseISO(p.date);
        return paymentDate >= dateRange.start && paymentDate <= dateRange.end;
      } catch {
        return false;
      }
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // Calculate other pending amounts within the selected date range
  const otherPendingInRange = otherPending
    .filter((p) => {
      if (p.travellerId !== traveller.id) return false;
      try {
        const pendingDate = parseISO(p.date);
        return pendingDate >= dateRange.start && pendingDate <= dateRange.end;
      } catch {
        return false;
      }
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const balance = totalCharge + otherPendingInRange - paymentsInRange;
  
  let status: 'Owes' | 'Overpaid' | 'Settled';
  if (balance > 0) {
    status = 'Owes';
  } else if (balance < 0) {
    status = 'Overpaid';
  } else {
    status = 'Settled';
  }

  return {
    id: traveller.id,
    name: traveller.name,
    totalTrips,
    totalCharge,
    otherPending: otherPendingInRange,
    payments: paymentsInRange,
    balance,
    status,
  };
}
