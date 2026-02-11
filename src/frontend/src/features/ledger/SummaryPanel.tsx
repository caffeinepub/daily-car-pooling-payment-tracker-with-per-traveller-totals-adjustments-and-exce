import { useLedgerState } from './LedgerStateContext';
import { getDaysInRange, formatDateKey } from '../../utils/dateRange';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import EmptyState from '../../components/EmptyState';
import { Receipt } from 'lucide-react';
import { formatCurrency } from '../../utils/money';
import CashPaymentForm from './CashPaymentForm';
import { format, parseISO } from 'date-fns';

export default function SummaryPanel() {
  const { travellers, dateRange, dailyData, ratePerTrip, cashPayments, addCashPayment } = useLedgerState();

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

  // Calculate totals based on trips and payments within date range
  const summaries = travellers.map((t) => {
    let totalTrips = 0;
    days.forEach((day) => {
      const dateKey = formatDateKey(day);
      const tripData = dailyData[dateKey]?.[t.id];
      if (tripData) {
        if (tripData.morning) totalTrips++;
        if (tripData.evening) totalTrips++;
      }
    });

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

    const balance = totalCharge - paymentsInRange;

    return {
      id: t.id,
      name: t.name,
      totalTrips,
      totalCharge,
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
              <span className="font-semibold text-sm">{s.name}</span>
              <Badge variant={s.balance > 0 ? 'destructive' : 'secondary'}>
                {s.balance > 0 ? 'Pending' : 'Paid'}
              </Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Trips travelled:</span>
                <span className="font-medium text-foreground">{s.totalTrips}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total charge:</span>
                <span className="font-medium text-foreground">{formatCurrency(s.totalCharge)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Payments:</span>
                <span className="font-medium text-foreground">{formatCurrency(s.payments)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Balance:</span>
                <span className={s.balance > 0 ? 'text-destructive' : 'text-green-600'}>
                  {formatCurrency(s.balance)}
                </span>
              </div>
            </div>
            <div className="pt-2">
              <CashPaymentForm
                travellerId={s.id}
                travellerName={s.name}
                onAddPayment={addCashPayment}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
