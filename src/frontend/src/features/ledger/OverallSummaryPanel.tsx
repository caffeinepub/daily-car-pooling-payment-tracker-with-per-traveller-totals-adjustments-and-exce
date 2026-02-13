import { useLedgerState } from './LedgerStateContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '../../utils/money';
import { parseISO, format } from 'date-fns';
import { TrendingUp, IndianRupee, Car, DollarSign } from 'lucide-react';
import { calculateIncomeFromDailyData } from '../../utils/tripCalculations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ResponsiveTableShell from '../../components/ResponsiveTableShell';

export default function OverallSummaryPanel() {
  const { dateRange, dailyData, ratePerTrip, carExpenses, includeSaturday, includeSunday } = useLedgerState();

  // Calculate total income using dailyData-driven calculation
  const totalIncome = calculateIncomeFromDailyData(
    dailyData,
    dateRange,
    ratePerTrip,
    includeSaturday,
    includeSunday
  );

  // Calculate total expenses in range
  const expensesInRange = carExpenses.filter((e) => {
    try {
      const expenseDate = parseISO(e.date);
      return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
    } catch {
      return false;
    }
  });

  const totalExpense = expensesInRange.reduce((sum, e) => sum + e.amount, 0);
  const profitLoss = totalIncome - totalExpense;

  // Month-wise breakdown
  const monthlyData: Record<string, { income: number; expense: number }> = {};

  // Calculate monthly income from dailyData
  const allDates = Object.keys(dailyData);
  allDates.forEach((dateKey) => {
    try {
      const [year, month] = dateKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      
      // Check if date is in range
      if (date < new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), 1) ||
          date > new Date(dateRange.end.getFullYear(), dateRange.end.getMonth() + 1, 0)) {
        return;
      }

      const monthKey = format(date, 'MMM yyyy');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }

      // Count trips for this date
      const dayData = dailyData[dateKey];
      let dayTrips = 0;
      Object.values(dayData).forEach((tripData) => {
        dayTrips += (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
      });

      monthlyData[monthKey].income += dayTrips * ratePerTrip;
    } catch {
      // Skip invalid dates
    }
  });

  // Add expenses to monthly data
  expensesInRange.forEach((e) => {
    try {
      const expenseDate = parseISO(e.date);
      const monthKey = format(expenseDate, 'MMM yyyy');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      monthlyData[monthKey].expense += e.amount;
    } catch {
      // Skip invalid dates
    }
  });

  const monthlyEntries = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    income: data.income,
    expense: data.expense,
    profit: data.income - data.expense,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Overall Summary
        </CardTitle>
        <CardDescription>Financial overview for the selected date range</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
              <IndianRupee className="h-4 w-4" />
              <p className="text-sm font-medium">Income</p>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(totalIncome)}
            </p>
          </div>

          <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
              <Car className="h-4 w-4" />
              <p className="text-sm font-medium">Expense</p>
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">
              {formatCurrency(totalExpense)}
            </p>
          </div>

          <div className="p-4 border rounded-lg bg-accent">
            <div className="flex items-center gap-2 text-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <p className="text-sm font-medium">Profit/Loss</p>
            </div>
            <p
              className={`text-2xl font-bold ${
                profitLoss > 0
                  ? 'text-green-600 dark:text-green-400'
                  : profitLoss < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground'
              }`}
            >
              {formatCurrency(profitLoss)}
            </p>
          </div>
        </div>

        {/* Month-wise Breakdown */}
        {monthlyEntries.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Month-wise Breakdown</h3>
            <ResponsiveTableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Expense</TableHead>
                    <TableHead className="text-right">Profit/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyEntries.map((entry) => (
                    <TableRow key={entry.month}>
                      <TableCell className="font-medium">{entry.month}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.income)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.expense)}</TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          entry.profit > 0
                            ? 'text-green-600 dark:text-green-400'
                            : entry.profit < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formatCurrency(entry.profit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ResponsiveTableShell>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
