import { useLedgerState } from './LedgerStateContext';
import { getDaysInRange, formatDateKey } from '../../utils/dateRange';
import { isDateIncluded } from '../../utils/weekendInclusion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '../../utils/money';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { parseISO, format, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';

export default function OverallSummaryPanel() {
  const { 
    travellers, 
    dateRange, 
    dailyData, 
    ratePerTrip, 
    carExpenses,
    includeSaturday,
    includeSunday,
  } = useLedgerState();

  const days = getDaysInRange(dateRange.start, dateRange.end);

  // Calculate total income from trips (only included dates)
  let totalIncome = 0;
  days.forEach((day) => {
    const dateKey = formatDateKey(day);
    const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
    if (!isIncluded) return;
    
    travellers.forEach((t) => {
      const tripData = dailyData[dateKey]?.[t.id];
      if (tripData) {
        const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
        totalIncome += tripCount * ratePerTrip;
      }
    });
  });

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

  // Month-wise breakdown
  const monthlyData = new Map<string, { income: number; expense: number }>();

  days.forEach((day) => {
    const dateKey = formatDateKey(day);
    const monthKey = format(day, 'yyyy-MM');
    const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { income: 0, expense: 0 });
    }
    
    const monthData = monthlyData.get(monthKey)!;
    
    if (isIncluded) {
      travellers.forEach((t) => {
        const tripData = dailyData[dateKey]?.[t.id];
        if (tripData) {
          const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
          monthData.income += tripCount * ratePerTrip;
        }
      });
    }
  });

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
              <DollarSign className="h-4 w-4" />
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
            <div className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(profitLoss)}
            </div>
          </div>
        </div>

        <Separator />

        {/* Month-wise Breakdown */}
        {monthlyBreakdown.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Month-wise Breakdown</h4>
            <div className="space-y-2">
              {monthlyBreakdown.map((month) => (
                <div key={month.month} className="p-3 rounded-lg border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{month.monthLabel}</span>
                    <Badge variant={month.profitLoss >= 0 ? 'default' : 'destructive'}>
                      {month.profitLoss >= 0 ? '+' : ''}{formatCurrency(month.profitLoss)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Income:</span>
                      <span className="font-medium text-foreground">{formatCurrency(month.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expense:</span>
                      <span className="font-medium text-foreground">{formatCurrency(month.expense)}</span>
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
