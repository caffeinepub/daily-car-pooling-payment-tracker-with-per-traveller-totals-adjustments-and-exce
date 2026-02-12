import { useLedgerState } from './LedgerStateContext';
import { getDaysInRange } from '../../utils/dateRange';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '../../utils/money';
import { TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';
import { parseISO, format } from 'date-fns';
import { calculateIncomeFromDailyData, calculateMonthlyIncomeFromDailyData } from '../../utils/tripCalculations';

export default function OverallSummaryPanel() {
  const { 
    dateRange, 
    dailyData, 
    ratePerTrip, 
    carExpenses,
    includeSaturday,
    includeSunday,
  } = useLedgerState();

  const days = getDaysInRange(dateRange.start, dateRange.end);

  // Calculate total income from dailyData (stable even after traveller deletion)
  const totalIncome = calculateIncomeFromDailyData(
    dailyData,
    dateRange,
    ratePerTrip,
    includeSaturday,
    includeSunday
  );

  // Calculate total expenses within date range
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

  // Month-wise breakdown using dailyData-driven calculation
  const monthlyIncomeMap = calculateMonthlyIncomeFromDailyData(
    dailyData,
    dateRange,
    ratePerTrip,
    includeSaturday,
    includeSunday
  );

  const monthlyData = new Map<string, { income: number; expense: number }>();

  // Initialize with income data
  monthlyIncomeMap.forEach((income, monthKey) => {
    monthlyData.set(monthKey, { income, expense: 0 });
  });

  // Add expense data
  carExpenses.forEach((e) => {
    try {
      const expenseDate = parseISO(e.date);
      if (expenseDate >= dateRange.start && expenseDate <= dateRange.end) {
        const monthKey = format(expenseDate, 'yyyy-MM');
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { income: 0, expense: 0 });
        }
        const monthData = monthlyData.get(monthKey)!;
        monthData.expense += e.amount;
      }
    } catch {
      // Skip invalid dates
    }
  });

  const monthlyBreakdown = Array.from(monthlyData.entries())
    .map(([monthKey, data]) => ({
      month: monthKey,
      monthLabel: format(parseISO(monthKey + '-01'), 'MMMM yyyy'),
      income: data.income,
      expense: data.expense,
      profitLoss: data.income - data.expense,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall Summary</CardTitle>
        <CardDescription>
          Financial overview for {format(dateRange.start, 'MMM dd, yyyy')} - {format(dateRange.end, 'MMM dd, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2 p-4 rounded-lg bg-accent/30 border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IndianRupee className="h-4 w-4" />
              <span>Income</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalIncome)}
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4 rounded-lg bg-accent/30 border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4" />
              <span>Expense</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalExpense)}
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4 rounded-lg bg-accent/30 border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Profit/Loss</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(profitLoss)}
            </div>
          </div>
        </div>

        <Separator />

        {/* Month-wise Breakdown */}
        {monthlyBreakdown.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Month-wise Breakdown</h3>
            <div className="space-y-2">
              {monthlyBreakdown.map((month) => (
                <div key={month.month} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{month.monthLabel}</span>
                    <Badge variant={month.profitLoss >= 0 ? 'default' : 'destructive'}>
                      {month.profitLoss >= 0 ? 'Profit' : 'Loss'} {formatCurrency(Math.abs(month.profitLoss))}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <div>Income</div>
                      <div className="font-medium text-foreground">{formatCurrency(month.income)}</div>
                    </div>
                    <div>
                      <div>Expense</div>
                      <div className="font-medium text-foreground">{formatCurrency(month.expense)}</div>
                    </div>
                    <div>
                      <div>Net</div>
                      <div className="font-medium text-foreground">{formatCurrency(month.profitLoss)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
