import { useLedgerState } from './LedgerStateContext';
import { getDaysInRange, formatDateKey } from '../../utils/dateRange';
import { isDateIncludedForCalculation } from '../../utils/weekendInclusion';
import { formatCurrency } from '../../utils/money';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import EmptyState from '../../components/EmptyState';
import { DollarSign } from 'lucide-react';
import { parseISO } from 'date-fns';

export default function PaymentSummaryPanel() {
  const {
    travellers,
    dateRange,
    dailyData,
    ratePerTrip,
    cashPayments,
    otherPending,
    coTravellerIncomes,
    includeSaturday,
    includeSunday,
  } = useLedgerState();

  const days = getDaysInRange(dateRange.start, dateRange.end);

  // Calculate per-traveller summaries
  const summaries = travellers.map((traveller) => {
    let totalTrips = 0;

    days.forEach((day) => {
      const dateKey = formatDateKey(day);
      const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);
      if (!isIncluded) return;

      const tripData = dailyData[dateKey]?.[traveller.id];
      if (tripData) {
        const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
        totalTrips += tripCount;
      }
    });

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

    const totalDue = totalCharge + otherPendingInRange;
    const balance = totalDue - paymentsInRange;

    return {
      traveller,
      totalCharge,
      otherPendingInRange,
      totalDue,
      paymentsInRange,
      balance,
    };
  });

  // Calculate Other Co-Travellers total in range
  const otherCoTravellersTotal = coTravellerIncomes
    .filter((income) => {
      try {
        const incomeDate = parseISO(income.date);
        return incomeDate >= dateRange.start && incomeDate <= dateRange.end;
      } catch {
        return false;
      }
    })
    .reduce((sum, income) => sum + income.amount, 0);

  // Calculate overall totals
  const overallTotalPaymentsReceived = summaries.reduce((sum, s) => sum + s.paymentsInRange, 0) + otherCoTravellersTotal;
  const overallTotalDue = summaries.reduce((sum, s) => sum + Math.max(0, s.balance), 0);

  if (travellers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Summary
          </CardTitle>
          <CardDescription>Overview of payments and dues</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={DollarSign}
            title="Add travellers first"
            description="You need to add travellers before viewing the payment summary"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment Summary
        </CardTitle>
        <CardDescription>Payment status for the selected date range</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Per-Traveller Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Traveller</TableHead>
                <TableHead className="text-right">Total Charge</TableHead>
                <TableHead className="text-right">Payments</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((summary) => {
                const isDue = summary.balance > 0;
                const isOverpaid = summary.balance < 0;
                const isSettled = summary.balance === 0;

                return (
                  <TableRow key={summary.traveller.id}>
                    <TableCell className="font-medium">{summary.traveller.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(summary.totalDue)}</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400 font-medium">
                      {formatCurrency(summary.paymentsInRange)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        isDue
                          ? 'text-red-600 dark:text-red-400'
                          : isOverpaid
                            ? 'text-green-600 dark:text-green-400'
                            : ''
                      }`}
                    >
                      {formatCurrency(Math.abs(summary.balance))}
                    </TableCell>
                    <TableCell className="text-center">
                      {isDue && (
                        <Badge variant="destructive" className="font-medium">
                          Due
                        </Badge>
                      )}
                      {isOverpaid && (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700 font-medium">
                          Overpaid
                        </Badge>
                      )}
                      {isSettled && (
                        <Badge variant="secondary" className="font-medium">
                          Settled
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <Separator />

        {/* Overall Totals */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Overall Totals</h3>
          <div className="space-y-4">
            {/* Payment Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Cash Payments</span>
                <span className="font-medium">{formatCurrency(summaries.reduce((sum, s) => sum + s.paymentsInRange, 0))}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Other Co-Travellers</span>
                <span className="font-medium">{formatCurrency(otherCoTravellersTotal)}</span>
              </div>
            </div>

            <Separator />

            {/* Total Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-muted-foreground mb-1">Total Payments Received</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(overallTotalPaymentsReceived)}
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-muted-foreground mb-1">Total Payment Due</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(overallTotalDue)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
