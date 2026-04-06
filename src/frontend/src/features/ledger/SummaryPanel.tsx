import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parseISO } from "date-fns";
import { Receipt } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import { useReadOnly } from "../../context/ReadOnlyContext";
import { formatDateKey, getDaysInRange } from "../../utils/dateRange";
import { formatCurrency } from "../../utils/money";
import { getRateForDate } from "../../utils/rateHistory";
import {
  isDateIncludedForCalculation,
  isWeekendDay,
} from "../../utils/weekendInclusion";
import CashPaymentForm from "./CashPaymentForm";
import { useLedgerState } from "./LedgerStateContext";
import OtherPendingAmountForm from "./OtherPendingAmountForm";

export default function SummaryPanel() {
  const {
    travellers,
    dateRange,
    dailyData,
    ratePerTrip,
    rateHistory,
    cashPayments,
    otherPending,
    addCashPayment,
    addOtherPending,
    includeSaturday,
    includeSunday,
  } = useLedgerState();
  const { isReadOnly, isSharedUser } = useReadOnly();

  const days = getDaysInRange(dateRange.start, dateRange.end);

  // Calculate per-traveller summaries
  const summaries = travellers.map((traveller) => {
    let weekdayTrips = 0;
    let weekendTrips = 0;
    let totalCharge = 0;

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

      const tripData = dailyData[dateKey]?.[traveller.id];
      if (tripData) {
        const tripCount =
          (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
        const { isSaturday, isSunday } = isWeekendDay(day);
        if (isSaturday || isSunday) {
          weekendTrips += tripCount;
        } else {
          weekdayTrips += tripCount;
        }
        const rateForDay = getRateForDate(day, rateHistory, ratePerTrip);
        totalCharge += tripCount * rateForDay;
      }
    }

    const totalTrips = weekdayTrips + weekendTrips;

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

    // Calculate other pending in range (excluded for shared users)
    const otherPendingInRange = isSharedUser
      ? 0
      : otherPending
          .filter((p) => {
            if (p.travellerId !== traveller.id) return false;
            try {
              const pendingDate = parseISO(p.date);
              return (
                pendingDate >= dateRange.start && pendingDate <= dateRange.end
              );
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
      <Card className="shadow-md">
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
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Summary</CardTitle>
        <CardDescription>
          Per-traveller charges and balances for the selected date range
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {summaries.map((summary) => {
          const isDue = summary.balance > 0;
          const isOverpaid = summary.balance < 0;
          const isSettled = summary.balance === 0;

          return (
            <div
              key={summary.traveller.id}
              className="p-4 border rounded-lg bg-card hover:bg-accent/30 transition-colors space-y-3"
            >
              {/* Name and Status Row */}
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">
                  {summary.traveller.name}
                </h3>
                <Badge variant="outline">
                  {summary.weekdayTrips} weekday + {summary.weekendTrips}{" "}
                  weekend = {summary.totalTrips} trips
                </Badge>
                {isDue && (
                  <Badge className="font-medium bg-destructive/20 text-destructive border border-destructive/40">
                    Due
                  </Badge>
                )}
                {isOverpaid && (
                  <Badge className="font-medium bg-primary/20 text-primary border border-primary/40">
                    Overpaid
                  </Badge>
                )}
                {isSettled && (
                  <Badge className="font-medium bg-primary/20 text-primary border border-primary/40">
                    Settled
                  </Badge>
                )}
              </div>

              {/* Stats Grid */}
              <div
                className={`grid gap-3 text-sm ${isSharedUser ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}
              >
                <div>
                  <p className="text-muted-foreground">Total Charge</p>
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(summary.totalCharge)}
                  </p>
                </div>
                {!isSharedUser && (
                  <div>
                    <p className="text-muted-foreground">Other Pending</p>
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(summary.otherPendingInRange)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Payments</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(summary.paymentsInRange)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Balance</p>
                  <p
                    className={`font-semibold ${
                      isDue
                        ? "text-red-600 dark:text-red-400"
                        : isOverpaid
                          ? "text-green-600 dark:text-green-400"
                          : ""
                    }`}
                  >
                    {formatCurrency(Math.abs(summary.balance))}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {!isReadOnly && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <CashPaymentForm
                    travellerId={summary.traveller.id}
                    travellerName={summary.traveller.name}
                    onSubmit={addCashPayment}
                  />
                  <OtherPendingAmountForm
                    travellerId={summary.traveller.id}
                    travellerName={summary.traveller.name}
                    onSubmit={addOtherPending}
                  />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
