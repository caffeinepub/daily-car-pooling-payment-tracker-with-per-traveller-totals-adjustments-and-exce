import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseISO } from "date-fns";
import { Car, IndianRupee } from "lucide-react";
import { useState } from "react";
import { getTodayIST } from "../../utils/dateRange";
import { formatINR } from "../../utils/money";
import {
  calculateIncomeFromDailyData,
  calculateMonthlyIncomeFromDailyData,
} from "../../utils/tripCalculations";
import { useLedgerState } from "./LedgerStateContext";

export default function OverallSummaryPanel() {
  const {
    dailyData,
    dateRange,
    ratePerTrip,
    rateHistory,
    carExpenses,
    includeSaturday,
    includeSunday,
    coTravellerIncomes,
  } = useLedgerState();

  const [selectedDay, setSelectedDay] = useState<string>(getTodayIST());

  // Calculate total income using dailyData-driven calculation
  const totalIncome = calculateIncomeFromDailyData(
    dailyData,
    dateRange,
    ratePerTrip,
    includeSaturday,
    includeSunday,
    coTravellerIncomes,
    rateHistory,
  );

  // Calculate total car expenses within date range
  const totalExpense = carExpenses
    .filter((e) => {
      try {
        const expenseDate = parseISO(e.date);
        return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
      } catch {
        return false;
      }
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const profitLoss = totalIncome - totalExpense;

  // Calculate monthly breakdown
  const monthlyIncome = calculateMonthlyIncomeFromDailyData(
    dailyData,
    dateRange,
    ratePerTrip,
    includeSaturday,
    includeSunday,
    coTravellerIncomes,
    rateHistory,
  );

  const monthlyExpenses = new Map<string, number>();
  for (const e of carExpenses) {
    try {
      const expenseDate = parseISO(e.date);
      if (expenseDate >= dateRange.start && expenseDate <= dateRange.end) {
        const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, "0")}`;
        monthlyExpenses.set(
          monthKey,
          (monthlyExpenses.get(monthKey) || 0) + e.amount,
        );
      }
    } catch {
      // Skip invalid dates
    }
  }

  // Combine all months
  const allMonths = new Set([
    ...monthlyIncome.keys(),
    ...monthlyExpenses.keys(),
  ]);
  const sortedMonths = Array.from(allMonths).sort();

  // Daily summary calculation
  const dailyIncome = calculateIncomeFromDailyData(
    dailyData,
    {
      start: new Date(`${selectedDay}T00:00:00`),
      end: new Date(`${selectedDay}T23:59:59`),
    },
    ratePerTrip,
    includeSaturday,
    includeSunday,
    coTravellerIncomes,
    rateHistory,
  );
  const dailyExpense = carExpenses
    .filter((e) => e.date === selectedDay)
    .reduce((sum, e) => sum + e.amount, 0);
  const dailyProfitLoss = dailyIncome - dailyExpense;

  return (
    <div className="space-y-6">
      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Daily Summary</CardTitle>
              <CardDescription>
                Income & expense for a specific day
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="daily-date"
                className="text-xs text-muted-foreground whitespace-nowrap"
              >
                Select Date
              </Label>
              <Input
                id="daily-date"
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-40 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-accent/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <IndianRupee className="h-4 w-4" />
                <span>Day Income</span>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatINR(dailyIncome)}
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-accent/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Car className="h-4 w-4" />
                <span>Day Expense</span>
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatINR(dailyExpense)}
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-accent/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <IndianRupee className="h-4 w-4" />
                <span>Day Profit/Loss</span>
              </div>
              <div
                className={`text-2xl font-bold ${dailyProfitLoss > 0 ? "text-green-600 dark:text-green-400" : dailyProfitLoss < 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}`}
              >
                {formatINR(dailyProfitLoss)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overall Summary</CardTitle>
          <CardDescription>
            Financial overview for the selected date range
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-accent/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <IndianRupee className="h-4 w-4" />
                <span>Total Income</span>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatINR(totalIncome)}
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-accent/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Car className="h-4 w-4" />
                <span>Total Expense</span>
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatINR(totalExpense)}
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-accent/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <IndianRupee className="h-4 w-4" />
                <span>Profit/Loss</span>
              </div>
              <div
                className={`text-2xl font-bold ${
                  profitLoss > 0
                    ? "text-green-600 dark:text-green-400"
                    : profitLoss < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-foreground"
                }`}
              >
                {formatINR(profitLoss)}
              </div>
            </div>
          </div>

          {/* Monthly Breakdown */}
          {sortedMonths.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Month-wise Breakdown
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">
                        Month
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium">
                        Income
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium">
                        Expense
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium">
                        Profit/Loss
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMonths.map((monthKey) => {
                      const income = monthlyIncome.get(monthKey) || 0;
                      const expense = monthlyExpenses.get(monthKey) || 0;
                      const profit = income - expense;

                      return (
                        <tr key={monthKey} className="border-t">
                          <td className="px-4 py-2 text-sm">{monthKey}</td>
                          <td className="px-4 py-2 text-sm text-right text-green-600 dark:text-green-400">
                            {formatINR(income)}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-red-600 dark:text-red-400">
                            {formatINR(expense)}
                          </td>
                          <td
                            className={`px-4 py-2 text-sm text-right font-medium ${
                              profit > 0
                                ? "text-green-600 dark:text-green-400"
                                : profit < 0
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-foreground"
                            }`}
                          >
                            {formatINR(profit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
