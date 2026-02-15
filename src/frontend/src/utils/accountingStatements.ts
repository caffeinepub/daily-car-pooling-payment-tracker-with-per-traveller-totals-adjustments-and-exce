import { format, parseISO } from 'date-fns';
import { getDaysInRange, formatDateKey } from './dateRange';
import { isDateIncludedForCalculation } from './weekendInclusion';
import type { DateRange, DailyData, CarExpense, CoTravellerIncome } from '../hooks/useLedgerLocalState';

export interface MonthlyReportData {
  months: Array<{
    monthKey: string;
    monthLabel: string;
    income: number;
    expenses: number;
    netIncome: number;
  }>;
  totalIncome: number;
  totalExpenses: number;
  totalNetIncome: number;
}

export interface ProfitLossStatement {
  revenue: {
    tripIncome: number;
    coTravellerIncome: number;
    totalRevenue: number;
  };
  expenses: {
    byCategory: Array<{ category: string; amount: number }>;
    totalExpenses: number;
  };
  netProfitLoss: number;
}

export interface IncomeStatement {
  operatingIncome: {
    tripIncome: number;
    coTravellerIncome: number;
    totalOperatingIncome: number;
  };
  totalIncome: number;
}

export interface ExpenseStatement {
  expensesByCategory: Array<{ category: string; amount: number }>;
  totalExpenses: number;
}

/**
 * Generate monthly report data from ledger state
 */
export function generateMonthlyReport(
  dailyData: DailyData,
  dateRange: DateRange,
  ratePerTrip: number,
  includeSaturday: boolean,
  includeSunday: boolean,
  carExpenses: CarExpense[],
  coTravellerIncomes: CoTravellerIncome[]
): MonthlyReportData {
  const monthlyData = new Map<string, { income: number; expenses: number }>();
  const days = getDaysInRange(dateRange.start, dateRange.end);

  // Calculate income per month
  days.forEach((day) => {
    const dateKey = formatDateKey(day);
    const monthKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}`;
    const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);

    if (!isIncluded) return;

    const dayData = dailyData[dateKey];
    if (!dayData) return;

    let dayIncome = 0;
    Object.keys(dayData).forEach((travellerId) => {
      const tripData = dayData[travellerId];
      if (tripData) {
        const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
        dayIncome += tripCount * ratePerTrip;
      }
    });

    const existing = monthlyData.get(monthKey) || { income: 0, expenses: 0 };
    monthlyData.set(monthKey, { ...existing, income: existing.income + dayIncome });
  });

  // Add co-traveller income to monthly breakdown
  coTravellerIncomes.forEach((income) => {
    try {
      const incomeDate = parseISO(income.date);
      if (incomeDate >= dateRange.start && incomeDate <= dateRange.end) {
        const monthKey = `${incomeDate.getFullYear()}-${String(incomeDate.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthlyData.get(monthKey) || { income: 0, expenses: 0 };
        monthlyData.set(monthKey, { ...existing, income: existing.income + income.amount });
      }
    } catch {
      // Skip invalid dates
    }
  });

  // Calculate expenses per month
  carExpenses.forEach((expense) => {
    try {
      const expenseDate = parseISO(expense.date);
      if (expenseDate >= dateRange.start && expenseDate <= dateRange.end) {
        const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthlyData.get(monthKey) || { income: 0, expenses: 0 };
        monthlyData.set(monthKey, { ...existing, expenses: existing.expenses + expense.amount });
      }
    } catch {
      // Skip invalid dates
    }
  });

  // Convert to sorted array
  const months = Array.from(monthlyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-');
      const monthLabel = format(new Date(parseInt(year), parseInt(month) - 1, 1), 'MMMM yyyy');
      return {
        monthKey,
        monthLabel,
        income: data.income,
        expenses: data.expenses,
        netIncome: data.income - data.expenses,
      };
    });

  const totalIncome = months.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = months.reduce((sum, m) => sum + m.expenses, 0);
  const totalNetIncome = totalIncome - totalExpenses;

  return {
    months,
    totalIncome,
    totalExpenses,
    totalNetIncome,
  };
}

/**
 * Generate Profit & Loss Statement
 */
export function generateProfitLossStatement(
  dailyData: DailyData,
  dateRange: DateRange,
  ratePerTrip: number,
  includeSaturday: boolean,
  includeSunday: boolean,
  carExpenses: CarExpense[],
  coTravellerIncomes: CoTravellerIncome[]
): ProfitLossStatement {
  const days = getDaysInRange(dateRange.start, dateRange.end);

  // Calculate trip income
  let tripIncome = 0;
  days.forEach((day) => {
    const dateKey = formatDateKey(day);
    const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);

    if (!isIncluded) return;

    const dayData = dailyData[dateKey];
    if (!dayData) return;

    Object.keys(dayData).forEach((travellerId) => {
      const tripData = dayData[travellerId];
      if (tripData) {
        const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
        tripIncome += tripCount * ratePerTrip;
      }
    });
  });

  // Calculate co-traveller income
  let coTravellerIncome = 0;
  coTravellerIncomes.forEach((income) => {
    try {
      const incomeDate = parseISO(income.date);
      if (incomeDate >= dateRange.start && incomeDate <= dateRange.end) {
        coTravellerIncome += income.amount;
      }
    } catch {
      // Skip invalid dates
    }
  });

  const totalRevenue = tripIncome + coTravellerIncome;

  // Calculate expenses by category
  const expensesByCategory = new Map<string, number>();
  carExpenses.forEach((expense) => {
    try {
      const expenseDate = parseISO(expense.date);
      if (expenseDate >= dateRange.start && expenseDate <= dateRange.end) {
        const current = expensesByCategory.get(expense.category) || 0;
        expensesByCategory.set(expense.category, current + expense.amount);
      }
    } catch {
      // Skip invalid dates
    }
  });

  const expensesByCategoryArray = Array.from(expensesByCategory.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const totalExpenses = expensesByCategoryArray.reduce((sum, e) => sum + e.amount, 0);
  const netProfitLoss = totalRevenue - totalExpenses;

  return {
    revenue: {
      tripIncome,
      coTravellerIncome,
      totalRevenue,
    },
    expenses: {
      byCategory: expensesByCategoryArray,
      totalExpenses,
    },
    netProfitLoss,
  };
}

/**
 * Generate Income Statement
 */
export function generateIncomeStatement(
  dailyData: DailyData,
  dateRange: DateRange,
  ratePerTrip: number,
  includeSaturday: boolean,
  includeSunday: boolean,
  coTravellerIncomes: CoTravellerIncome[]
): IncomeStatement {
  const days = getDaysInRange(dateRange.start, dateRange.end);

  // Calculate trip income
  let tripIncome = 0;
  days.forEach((day) => {
    const dateKey = formatDateKey(day);
    const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);

    if (!isIncluded) return;

    const dayData = dailyData[dateKey];
    if (!dayData) return;

    Object.keys(dayData).forEach((travellerId) => {
      const tripData = dayData[travellerId];
      if (tripData) {
        const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
        tripIncome += tripCount * ratePerTrip;
      }
    });
  });

  // Calculate co-traveller income
  let coTravellerIncome = 0;
  coTravellerIncomes.forEach((income) => {
    try {
      const incomeDate = parseISO(income.date);
      if (incomeDate >= dateRange.start && incomeDate <= dateRange.end) {
        coTravellerIncome += income.amount;
      }
    } catch {
      // Skip invalid dates
    }
  });

  const totalOperatingIncome = tripIncome + coTravellerIncome;

  return {
    operatingIncome: {
      tripIncome,
      coTravellerIncome,
      totalOperatingIncome,
    },
    totalIncome: totalOperatingIncome,
  };
}

/**
 * Generate Expense Statement
 */
export function generateExpenseStatement(
  dateRange: DateRange,
  carExpenses: CarExpense[]
): ExpenseStatement {
  const expensesByCategory = new Map<string, number>();

  carExpenses.forEach((expense) => {
    try {
      const expenseDate = parseISO(expense.date);
      if (expenseDate >= dateRange.start && expenseDate <= dateRange.end) {
        const current = expensesByCategory.get(expense.category) || 0;
        expensesByCategory.set(expense.category, current + expense.amount);
      }
    } catch {
      // Skip invalid dates
    }
  });

  const expensesByCategoryArray = Array.from(expensesByCategory.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const totalExpenses = expensesByCategoryArray.reduce((sum, e) => sum + e.amount, 0);

  return {
    expensesByCategory: expensesByCategoryArray,
    totalExpenses,
  };
}
