import { format, parseISO } from "date-fns";
import type {
  CarExpense,
  CoTravellerIncome,
  DailyData,
  DateRange,
} from "../hooks/useLedgerLocalState";
import { formatDateKey, getDaysInRange } from "./dateRange";
import { isDateIncludedForCalculation } from "./weekendInclusion";

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

export function generateMonthlyReport(
  dailyData: DailyData,
  dateRange: DateRange,
  ratePerTrip: number,
  includeSaturday: boolean,
  includeSunday: boolean,
  carExpenses: CarExpense[],
  coTravellerIncomes: CoTravellerIncome[],
): MonthlyReportData {
  const monthlyData = new Map<string, { income: number; expenses: number }>();
  const days = getDaysInRange(dateRange.start, dateRange.end);

  for (const day of days) {
    const dateKey = formatDateKey(day);
    const monthKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}`;
    const isIncluded = isDateIncludedForCalculation(
      day,
      includeSaturday,
      includeSunday,
      dateKey,
      dailyData,
    );
    if (!isIncluded) continue;
    const dayData = dailyData[dateKey];
    if (!dayData) continue;

    let dayIncome = 0;
    for (const travellerId of Object.keys(dayData)) {
      const tripData = dayData[travellerId];
      if (tripData) {
        dayIncome +=
          ((tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0)) *
          ratePerTrip;
      }
    }
    const existing = monthlyData.get(monthKey) || { income: 0, expenses: 0 };
    monthlyData.set(monthKey, {
      ...existing,
      income: existing.income + dayIncome,
    });
  }

  for (const income of coTravellerIncomes) {
    try {
      const incomeDate = parseISO(income.date);
      if (incomeDate >= dateRange.start && incomeDate <= dateRange.end) {
        const monthKey = `${incomeDate.getFullYear()}-${String(incomeDate.getMonth() + 1).padStart(2, "0")}`;
        const existing = monthlyData.get(monthKey) || {
          income: 0,
          expenses: 0,
        };
        monthlyData.set(monthKey, {
          ...existing,
          income: existing.income + income.amount,
        });
      }
    } catch {
      /* skip */
    }
  }

  for (const expense of carExpenses) {
    try {
      const expenseDate = parseISO(expense.date);
      if (expenseDate >= dateRange.start && expenseDate <= dateRange.end) {
        const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, "0")}`;
        const existing = monthlyData.get(monthKey) || {
          income: 0,
          expenses: 0,
        };
        monthlyData.set(monthKey, {
          ...existing,
          expenses: existing.expenses + expense.amount,
        });
      }
    } catch {
      /* skip */
    }
  }

  const months = Array.from(monthlyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split("-");
      const monthLabel = format(
        new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1),
        "MMMM yyyy",
      );
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

  return {
    months,
    totalIncome,
    totalExpenses,
    totalNetIncome: totalIncome - totalExpenses,
  };
}

export function generateProfitLossStatement(
  dailyData: DailyData,
  dateRange: DateRange,
  ratePerTrip: number,
  includeSaturday: boolean,
  includeSunday: boolean,
  carExpenses: CarExpense[],
  coTravellerIncomes: CoTravellerIncome[],
): ProfitLossStatement {
  const days = getDaysInRange(dateRange.start, dateRange.end);

  let tripIncome = 0;
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
    const dayData = dailyData[dateKey];
    if (!dayData) continue;
    for (const travellerId of Object.keys(dayData)) {
      const tripData = dayData[travellerId];
      if (tripData) {
        tripIncome +=
          ((tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0)) *
          ratePerTrip;
      }
    }
  }

  let coTravellerIncome = 0;
  for (const income of coTravellerIncomes) {
    try {
      const incomeDate = parseISO(income.date);
      if (incomeDate >= dateRange.start && incomeDate <= dateRange.end)
        coTravellerIncome += income.amount;
    } catch {
      /* skip */
    }
  }

  const expensesByCategoryMap = new Map<string, number>();
  for (const expense of carExpenses) {
    try {
      const expenseDate = parseISO(expense.date);
      if (expenseDate >= dateRange.start && expenseDate <= dateRange.end) {
        expensesByCategoryMap.set(
          expense.category,
          (expensesByCategoryMap.get(expense.category) || 0) + expense.amount,
        );
      }
    } catch {
      /* skip */
    }
  }

  const expensesByCategoryArray = Array.from(expensesByCategoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  const totalExpenses = expensesByCategoryArray.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  const totalRevenue = tripIncome + coTravellerIncome;

  return {
    revenue: { tripIncome, coTravellerIncome, totalRevenue },
    expenses: { byCategory: expensesByCategoryArray, totalExpenses },
    netProfitLoss: totalRevenue - totalExpenses,
  };
}

export function generateIncomeStatement(
  dailyData: DailyData,
  dateRange: DateRange,
  ratePerTrip: number,
  includeSaturday: boolean,
  includeSunday: boolean,
  coTravellerIncomes: CoTravellerIncome[],
): IncomeStatement {
  const days = getDaysInRange(dateRange.start, dateRange.end);

  let tripIncome = 0;
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
    const dayData = dailyData[dateKey];
    if (!dayData) continue;
    for (const travellerId of Object.keys(dayData)) {
      const tripData = dayData[travellerId];
      if (tripData) {
        tripIncome +=
          ((tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0)) *
          ratePerTrip;
      }
    }
  }

  let coTravellerIncome = 0;
  for (const income of coTravellerIncomes) {
    try {
      const incomeDate = parseISO(income.date);
      if (incomeDate >= dateRange.start && incomeDate <= dateRange.end)
        coTravellerIncome += income.amount;
    } catch {
      /* skip */
    }
  }

  const totalOperatingIncome = tripIncome + coTravellerIncome;
  return {
    operatingIncome: { tripIncome, coTravellerIncome, totalOperatingIncome },
    totalIncome: totalOperatingIncome,
  };
}

export function generateExpenseStatement(
  dateRange: DateRange,
  carExpenses: CarExpense[],
): ExpenseStatement {
  const expensesByCategoryMap = new Map<string, number>();

  for (const expense of carExpenses) {
    try {
      const expenseDate = parseISO(expense.date);
      if (expenseDate >= dateRange.start && expenseDate <= dateRange.end) {
        expensesByCategoryMap.set(
          expense.category,
          (expensesByCategoryMap.get(expense.category) || 0) + expense.amount,
        );
      }
    } catch {
      /* skip */
    }
  }

  const expensesByCategoryArray = Array.from(expensesByCategoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    expensesByCategory: expensesByCategoryArray,
    totalExpenses: expensesByCategoryArray.reduce(
      (sum, e) => sum + e.amount,
      0,
    ),
  };
}
