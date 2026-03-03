import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLedgerState } from './LedgerStateContext';
import { formatINR } from '../../utils/money';
import { IndianRupee, Car } from 'lucide-react';
import { parseISO } from 'date-fns';
import { calculateIncomeFromDailyData, calculateMonthlyIncomeFromDailyData } from '../../utils/tripCalculations';

export default function OverallSummaryPanel() {
  const { dailyData, dateRange, ratePerTrip, carExpenses, includeSaturday, includeSunday, coTravellerIncomes } = useLedgerState();

  // Calculate total income using dailyData-driven calculation
  const totalIncome = calculateIncomeFromDailyData(
    dailyData,
    dateRange,
    ratePerTrip,
    includeSaturday,
    includeSunday,
    coTravellerIncomes
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
    coTravellerIncomes
  );

  const monthlyExpenses = new Map<string, number>();
  carExpenses.forEach((e) => {
    try {
      const expenseDate = parseISO(e.date);
      if (expenseDate >= dateRange.start && expenseDate <= dateRange.end) {
        const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
        monthlyExpenses.set(monthKey, (monthlyExpenses.get(monthKey) || 0) + e.amount);
      }
    } catch {
      // Skip invalid dates
    }
  });

  // Combine all months
  const allMonths = new Set([...monthlyIncome.keys(), ...monthlyExpenses.keys()]);
  const sortedMonths = Array.from(allMonths).sort();

  return (
    <div className="space-y-6">
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
                    ? 'text-green-600 dark:text-green-400'
                    : profitLoss < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-foreground'
                }`}
              >
                {formatINR(profitLoss)}
              </div>
            </div>
          </div>

          {/* Monthly Breakdown */}
          {sortedMonths.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Month-wise Breakdown</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">Month</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">Income</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">Expense</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">Profit/Loss</th>
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
                                ? 'text-green-600 dark:text-green-400'
                                : profit < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-foreground'
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
