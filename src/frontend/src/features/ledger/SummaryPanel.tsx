import { useLedgerState } from './LedgerStateContext';
import { getDaysInRange, formatDateKey } from '../../utils/dateRange';
import { isDateIncluded } from '../../utils/weekendInclusion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import EmptyState from '../../components/EmptyState';
import { Receipt } from 'lucide-react';
import { formatCurrency } from '../../utils/money';
import CashPaymentForm from './CashPaymentForm';
import OtherPendingAmountForm from './OtherPendingAmountForm';
import { parseISO } from 'date-fns';

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

  if (travellers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Per-traveller totals</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Receipt}
            title="No data yet"
            description="Add travellers and mark daily participation to see summaries"
          />
        </CardContent>
      </Card>
    );
  }

  // Calculate totals based on trips, payments, and other pending within date range
  const summaries = travellers.map((t) => {
    let weekdayTrips = 0;
    let weekendTrips = 0;
    
    days.forEach((day) => {
      const dateKey = formatDateKey(day);
      const tripData = dailyData[dateKey]?.[t.id];
      
      if (tripData) {
        const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
        if (!isIncluded) return;
        
        const dayOfWeek = day.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
        
        if (isWeekend) {
          weekendTrips += tripCount;
        } else {
          weekdayTrips += tripCount;
        }
      }
    });

    const totalTrips = weekdayTrips + weekendTrips;
    const totalCharge = totalTrips * ratePerTrip;

    // Calculate payments within the selected date range
    const paymentsInRange = cashPayments
      .filter((p) => {
        if (p.travellerId !== t.id) return false;
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
        if (p.travellerId !== t.id) return false;
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
      id: t.id,
      name: t.name,
      weekdayTrips,
      weekendTrips,
      totalTrips,
      totalCharge,
      otherPending: otherPendingInRange,
      payments: paymentsInRange,
      balance,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
        <CardDescription>
          Total charge = (number of checked boxes across AM/PM) × {formatCurrency(ratePerTrip)} per trip
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {summaries.map((s) => (
          <div key={s.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">{s.name}</h3>
              <Badge variant={s.balance > 0 ? 'destructive' : s.balance < 0 ? 'default' : 'secondary'}>
                {s.balance > 0 ? 'Owes' : s.balance < 0 ? 'Overpaid' : 'Settled'} {formatCurrency(Math.abs(s.balance))}
              </Badge>
            </div>

            <div className="text-sm space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Weekday Trips:</span>
                <span className="font-medium text-foreground">{s.weekdayTrips}</span>
              </div>
              <div className="flex justify-between">
                <span>Weekend Trips:</span>
                <span className="font-medium text-foreground">{s.weekendTrips}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Trips:</span>
                <span className="font-medium text-foreground">{s.totalTrips}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Charge:</span>
                <span className="font-medium text-foreground">{formatCurrency(s.totalCharge)}</span>
              </div>
              {s.otherPending > 0 && (
                <div className="flex justify-between">
                  <span>Other Pending:</span>
                  <span className="font-medium text-foreground">+{formatCurrency(s.otherPending)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Payments:</span>
                <span className="font-medium text-foreground">−{formatCurrency(s.payments)}</span>
              </div>
            </div>

            <Separator className="my-2" />

            <div className="flex gap-2">
              <CashPaymentForm travellerId={s.id} travellerName={s.name} onSubmit={addCashPayment} />
              <OtherPendingAmountForm travellerId={s.id} travellerName={s.name} onSubmit={addOtherPending} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
