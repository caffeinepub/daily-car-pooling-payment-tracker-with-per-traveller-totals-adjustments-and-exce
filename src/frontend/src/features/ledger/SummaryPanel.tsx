import { useMemo } from 'react';
import { useLedgerState } from './LedgerStateContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt } from 'lucide-react';
import { formatCurrency } from '../../utils/money';
import { calculateTravellerBalance } from '../../utils/ledgerBalances';
import { getDaysInRange, formatDateKey } from '../../utils/dateRange';
import { isDateIncludedForCalculation } from '../../utils/weekendInclusion';
import { Badge } from '@/components/ui/badge';
import { getPaymentStatus, getChargeClassName, getPaymentClassName } from '../../utils/paymentStatus';
import ResponsiveTableShell from '../../components/ResponsiveTableShell';
import { parseISO } from 'date-fns';
import SummaryPanelActionsCell from './SummaryPanelActionsCell';

export default function SummaryPanel() {
  const {
    travellers,
    dateRange,
    dailyData,
    ratePerTrip,
    cashPayments,
    otherPending,
    includeSaturday,
    includeSunday,
  } = useLedgerState();

  const summaryData = useMemo(() => {
    const days = getDaysInRange(dateRange.start, dateRange.end);

    return travellers.map((traveller) => {
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

      const balance = calculateTravellerBalance(
        traveller.id,
        dateRange,
        dailyData,
        ratePerTrip,
        cashPayments,
        otherPending,
        includeSaturday,
        includeSunday
      );

      return {
        traveller,
        totalTrips,
        totalCharge,
        otherPending: otherPendingInRange,
        payments: paymentsInRange,
        balance,
      };
    });
  }, [travellers, dateRange, dailyData, ratePerTrip, cashPayments, otherPending, includeSaturday, includeSunday]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Trips & Payment
        </CardTitle>
        <CardDescription>
          Per-traveller summary for the selected date range
        </CardDescription>
      </CardHeader>
      <CardContent>
        {travellers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No travellers added yet</p>
          </div>
        ) : (
          <ResponsiveTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px] max-w-[150px]">Traveller</TableHead>
                  <TableHead className="text-center whitespace-nowrap px-2">Trips</TableHead>
                  <TableHead className="text-right whitespace-nowrap px-2">Total Charges</TableHead>
                  <TableHead className="text-right whitespace-nowrap px-2">Other Pending</TableHead>
                  <TableHead className="text-right whitespace-nowrap px-2">Payments</TableHead>
                  <TableHead className="text-right whitespace-nowrap px-2">Balance</TableHead>
                  <TableHead className="text-center whitespace-nowrap px-2">Status</TableHead>
                  <TableHead className="text-center whitespace-nowrap px-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryData.map((row) => {
                  const statusInfo = getPaymentStatus(row.balance);

                  return (
                    <TableRow key={row.traveller.id}>
                      <TableCell className="font-medium truncate max-w-[150px]" title={row.traveller.name}>
                        {row.traveller.name}
                      </TableCell>
                      <TableCell className="text-center font-medium px-2">{row.totalTrips}</TableCell>
                      <TableCell className={`text-right font-medium px-2 whitespace-nowrap text-sm ${getChargeClassName()}`}>
                        {formatCurrency(row.totalCharge)}
                      </TableCell>
                      <TableCell className={`text-right font-medium px-2 whitespace-nowrap text-sm ${getChargeClassName()}`}>
                        {formatCurrency(row.otherPending)}
                      </TableCell>
                      <TableCell className={`text-right font-medium px-2 whitespace-nowrap text-sm ${getPaymentClassName()}`}>
                        {formatCurrency(row.payments)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold px-2 whitespace-nowrap text-sm ${statusInfo.amountClassName}`}>
                        {formatCurrency(Math.abs(row.balance))}
                      </TableCell>
                      <TableCell className="text-center px-2">
                        <Badge variant={statusInfo.badgeVariant} className="text-xs whitespace-nowrap">{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="px-2">
                        <SummaryPanelActionsCell
                          travellerId={row.traveller.id}
                          travellerName={row.traveller.name}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ResponsiveTableShell>
        )}
      </CardContent>
    </Card>
  );
}
