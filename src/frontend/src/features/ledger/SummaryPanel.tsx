import { useLedgerState } from './LedgerStateContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import EmptyState from '../../components/EmptyState';
import { Receipt } from 'lucide-react';
import { formatCurrency } from '../../utils/money';
import CashPaymentForm from './CashPaymentForm';
import OtherPendingAmountForm from './OtherPendingAmountForm';
import { calculateTravellerBalance } from '../../utils/travellerBalance';

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

  // Calculate summaries using shared utility
  const summaries = travellers.map((t) => 
    calculateTravellerBalance(
      t,
      dateRange,
      dailyData,
      ratePerTrip,
      cashPayments,
      otherPending,
      includeSaturday,
      includeSunday
    )
  );

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
            {/* Responsive header with name and badge */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="font-semibold text-base break-words">{s.name}</h3>
              <Badge 
                variant={s.status === 'Owes' ? 'destructive' : s.status === 'Overpaid' ? 'default' : 'secondary'}
                className="self-start sm:self-auto whitespace-nowrap"
              >
                {s.status} {formatCurrency(Math.abs(s.balance))}
              </Badge>
            </div>

            <div className="text-sm space-y-1 text-muted-foreground">
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

            {/* Responsive action buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <CashPaymentForm travellerId={s.id} travellerName={s.name} onSubmit={addCashPayment} />
              <OtherPendingAmountForm travellerId={s.id} travellerName={s.name} onSubmit={addOtherPending} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
