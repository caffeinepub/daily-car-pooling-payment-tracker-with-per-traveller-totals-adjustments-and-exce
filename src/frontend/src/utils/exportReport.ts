import { format, parseISO } from 'date-fns';
import { getDaysInRange, formatDateKey } from './dateRange';
import { isDateIncludedForCalculation } from './weekendInclusion';
import { calculateIncomeFromDailyData } from './tripCalculations';
import type { Traveller, DateRange, DailyData, CashPayment, OtherPending, CarExpense, CoTravellerIncome } from '../hooks/useLedgerLocalState';

interface LedgerState {
  travellers: Traveller[];
  dateRange: DateRange;
  dailyData: DailyData;
  ratePerTrip: number;
  cashPayments: CashPayment[];
  otherPending: OtherPending[];
  carExpenses: CarExpense[];
  includeSaturday: boolean;
  includeSunday: boolean;
  coTravellerIncomes: CoTravellerIncome[];
}

interface ExportFilters {
  includeDailyGrid: boolean;
  includeSummary: boolean;
  includePayments: boolean;
  includeCarExpenses: boolean;
  includeOverallSummary: boolean;
  selectedTravellerIds: string[];
}

function filterTravellers(travellers: Traveller[], selectedIds: string[]): Traveller[] {
  return travellers.filter((t) => selectedIds.includes(t.id));
}

function arrayToCSV(data: any[][]): string {
  return data
    .map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell ?? '');
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(',')
    )
    .join('\n');
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export async function exportToCSV(state: LedgerState, filters: ExportFilters): Promise<void> {
  const { travellers, dateRange, dailyData, ratePerTrip, cashPayments, otherPending, carExpenses, includeSaturday, includeSunday, coTravellerIncomes } = state;
  const filteredTravellers = filterTravellers(travellers, filters.selectedTravellerIds);
  const days = getDaysInRange(dateRange.start, dateRange.end);

  const sections: string[] = [];

  // Daily Grid
  if (filters.includeDailyGrid) {
    const gridData: any[][] = [];
    const headerRow = ['Date', 'Day'];
    filteredTravellers.forEach((t) => {
      headerRow.push(`${t.name} (AM)`, `${t.name} (PM)`);
    });
    gridData.push(headerRow);

    days.forEach((day) => {
      const dateKey = formatDateKey(day);
      const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);
      const row: any[] = [format(day, 'dd-MM'), format(day, 'EEEE')];

      filteredTravellers.forEach((t) => {
        const tripData = dailyData[dateKey]?.[t.id] || { morning: false, evening: false };
        if (isIncluded) {
          row.push(tripData.morning ? 1 : 0, tripData.evening ? 1 : 0);
        } else {
          row.push('-', '-');
        }
      });

      gridData.push(row);
    });

    sections.push('Daily Grid\n' + arrayToCSV(gridData));
  }

  // Summary
  if (filters.includeSummary) {
    const summaryData: any[][] = [];
    summaryData.push(['Traveller', 'Total Trips', 'Rate/Trip', 'Total Charge', 'Other Pending', 'Payments', 'Balance']);

    filteredTravellers.forEach((t) => {
      let totalTrips = 0;

      days.forEach((day) => {
        const dateKey = formatDateKey(day);
        const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);
        if (!isIncluded) return;

        const tripData = dailyData[dateKey]?.[t.id];
        if (tripData) {
          const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
          totalTrips += tripCount;
        }
      });

      const totalCharge = totalTrips * ratePerTrip;

      const paymentsInRange = cashPayments
        .filter((p) => {
          if (p.travellerId !== t.id) return false;
          try {
            const paymentDate = parseISO(p.date);
            return paymentDate >= dateRange.start && paymentDate <= dateRange.end;
          } catch {
            return false;
          }
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const otherPendingInRange = otherPending
        .filter((p) => {
          if (p.travellerId !== t.id) return false;
          try {
            const pendingDate = parseISO(p.date);
            return pendingDate >= dateRange.start && pendingDate <= dateRange.end;
          } catch {
            return false;
          }
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const balance = totalCharge + otherPendingInRange - paymentsInRange;

      summaryData.push([t.name, totalTrips, ratePerTrip, totalCharge, otherPendingInRange, paymentsInRange, balance]);
    });

    sections.push('Summary\n' + arrayToCSV(summaryData));
  }

  // Payments
  if (filters.includePayments) {
    const paymentsData: any[][] = [];
    paymentsData.push(['Date', 'Traveller', 'Amount', 'Note']);

    const filteredPayments = cashPayments.filter((p) => {
      if (!filters.selectedTravellerIds.includes(p.travellerId)) return false;
      try {
        const paymentDate = parseISO(p.date);
        return paymentDate >= dateRange.start && paymentDate <= dateRange.end;
      } catch {
        return false;
      }
    });

    filteredPayments
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((p) => {
        const traveller = travellers.find((t) => t.id === p.travellerId);
        paymentsData.push([
          format(parseISO(p.date), 'dd-MM-yyyy'),
          traveller?.name || 'Unknown',
          p.amount,
          p.note || '',
        ]);
      });

    sections.push('Payment History\n' + arrayToCSV(paymentsData));
  }

  // Car Expenses
  if (filters.includeCarExpenses) {
    const expensesData: any[][] = [];
    expensesData.push(['Date', 'Category', 'Amount', 'Note']);

    const filteredExpenses = carExpenses.filter((e) => {
      try {
        const expenseDate = parseISO(e.date);
        return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
      } catch {
        return false;
      }
    });

    filteredExpenses
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((e) => {
        expensesData.push([
          format(parseISO(e.date), 'dd-MM-yyyy'),
          e.category,
          e.amount,
          e.note || '',
        ]);
      });

    sections.push('Car Expenses\n' + arrayToCSV(expensesData));
  }

  // Overall Summary
  if (filters.includeOverallSummary) {
    const totalIncome = calculateIncomeFromDailyData(
      dailyData,
      dateRange,
      ratePerTrip,
      includeSaturday,
      includeSunday,
      coTravellerIncomes
    );

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

    const overallData: any[][] = [];
    overallData.push(['Metric', 'Amount']);
    overallData.push(['Total Income', totalIncome]);
    overallData.push(['Total Expense', totalExpense]);
    overallData.push(['Profit/Loss', profitLoss]);

    sections.push('Overall Summary\n' + arrayToCSV(overallData));
  }

  const csvContent = sections.join('\n\n\n');
  const filename = `Carpool_Report_${format(dateRange.start, 'yyyy-MM-dd')}_to_${format(dateRange.end, 'yyyy-MM-dd')}.csv`;

  downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
}

// PDF and Excel exports are not available as the required packages are not installed
export async function exportToPDF(_state: LedgerState, _filters: ExportFilters): Promise<void> {
  throw new Error('PDF export is not available. Please use CSV export instead.');
}

export async function exportToExcel(_state: LedgerState, _filters: ExportFilters): Promise<void> {
  throw new Error('Excel export is not available. Please use CSV export instead.');
}
