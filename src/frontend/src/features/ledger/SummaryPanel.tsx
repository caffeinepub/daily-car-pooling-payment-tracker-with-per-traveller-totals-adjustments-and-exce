import { useLedgerState } from './LedgerStateContext';
import { getDaysInRange, formatDateKey } from '../../utils/dateRange';
import { isDateIncludedForCalculation, isWeekendDay } from '../../utils/weekendInclusion';
import { formatCurrency } from '../../utils/money';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '../../components/EmptyState';
import { Receipt, IndianRupee } from 'lucide-react';
import { parseISO } from 'date-fns';
import CashPaymentForm from './CashPaymentForm';
import OtherPendingAmountForm from './OtherPendingAmountForm';
import { useState } from 'react';

export default function SummaryPanel() {
  const { 
    travellers, 
    dateRange, 
    dailyData, 
    ratePerTrip, 
    cashPayments, 
    otherPending, 
    addCashPayment, 
    addOtherPending,
    includeSaturday,
    includeSunday,
  } = useLedgerState();

  const days = getDaysInRange(dateRange.start, dateRange.end);

  // Calculate per-traveller summaries
  const summaries = travellers.map((traveller) => {
    let weekdayTrips = 0;
    let weekendTrips = 0;

    days.forEach((day) => {
      const dateKey = formatDateKey(day);
      const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);
      if (!isIncluded) return;

      const tripData = dailyData[dateKey]?.[traveller.id];
      if (tripData) {
        const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
        const { isSaturday, isSunday } = isWeekendDay(day);
        if (isSaturday || isSunday) {
          weekendTrips += tripCount;
        } else {
          weekdayTrips += tripCount;
        }
      }
    });

    const totalTrips = weekdayTrips + weekendTrips;
    const totalCharge = totalTrips * ratePerTrip;

    // Calculate payments in range
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

    // Calculate other pending in range
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

    return {
      traveller,
      weekdayTrips,
      weekendTrips,
      totalTrips,
      totalCharge,
      paymentsInRange,
      otherPendingInRange,
      balance,
    };
  });

  if (travellers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Per-traveller charges and balances</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Receipt}
            title="Add travellers first"
            description="You need to add travellers before viewing the summary"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
        <CardDescription>Per-traveller charges and balances for the selected date range</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {summaries.map((summary) => (
          <div
            key={summary.traveller.id}
            className="p-4 border rounded-lg bg-card hover:bg-accent/30 transition-colors space-y-3"
          >
            {/* Name and Badge Row */}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{summary.traveller.name}</h3>
              <Badge variant="outline">
                {summary.weekdayTrips} weekday + {summary.weekendTrips} weekend = {summary.totalTrips} trips
              </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Total Charge</p>
                <p className="font-semibold">{formatCurrency(summary.totalCharge)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Other Pending</p>
                <p className="font-semibold">{formatCurrency(summary.otherPendingInRange)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payments</p>
                <p className="font-semibold">{formatCurrency(summary.paymentsInRange)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Balance</p>
                <p
                  className={`font-bold ${
                    summary.balance > 0
                      ? 'text-green-600 dark:text-green-400'
                      : summary.balance < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  {formatCurrency(summary.balance)}
                </p>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap gap-2 pt-2">
              <CashPaymentForm
                travellerId={summary.traveller.id}
                travellerName={summary.traveller.name}
                onSubmit={(payment) => {
                  addCashPayment(payment);
                }}
              />
              <OtherPendingAmountForm
                travellerId={summary.traveller.id}
                travellerName={summary.traveller.name}
                onSubmit={(pending) => {
                  addOtherPending(pending);
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
