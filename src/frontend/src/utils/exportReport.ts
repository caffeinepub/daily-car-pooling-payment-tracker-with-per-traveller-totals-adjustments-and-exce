import { format } from 'date-fns';
import { formatCurrency } from './money';
import { getDaysInRange, formatDateKey, formatDisplayDate } from './dateRange';
import { isDateIncludedForCalculation } from './weekendInclusion';
import { calculateTravellerBalance } from './ledgerBalances';
import type { Traveller, DailyData, DateRange, CashPayment, CarExpense, CoTravellerIncome } from '../hooks/useLedgerLocalState';
import { generatePDFReport } from './exportPdf';
import type { ReportType } from '../features/ledger/ExportReportDialog';

export interface ExportFilters {
  reportType: ReportType;
  includeDailyGrid: boolean;
  includeSummary: boolean;
  includePayments: boolean;
  includeCarExpenses: boolean;
  includeOverallSummary: boolean;
  travellerFilterMode: 'all' | 'selected';
  selectedTravellerIds: string[];
  expenseCategory: string;
  expenseSearchQuery: string;
  paymentTravellerId: string;
}

interface LedgerState {
  travellers: Traveller[];
  dailyData: DailyData;
  dateRange: DateRange;
  ratePerTrip: number;
  cashPayments: CashPayment[];
  carExpenses: CarExpense[];
  includeSaturday: boolean;
  includeSunday: boolean;
  coTravellerIncomes: CoTravellerIncome[];
  otherPending?: any[];
}

function escapeCSV(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportToCSV(state: LedgerState, filters: ExportFilters): Promise<void> {
  const lines: string[] = [];

  // Header
  lines.push(`Carpool Ledger Report`);
  lines.push(`Date Range: ${format(state.dateRange.start, 'MMM dd, yyyy')} - ${format(state.dateRange.end, 'MMM dd, yyyy')}`);
  lines.push(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`);
  lines.push('');

  // Filter travellers
  const filteredTravellers =
    filters.travellerFilterMode === 'selected'
      ? state.travellers.filter((t) => filters.selectedTravellerIds.includes(t.id))
      : state.travellers;

  if (filteredTravellers.length === 0 && filters.travellerFilterMode === 'selected') {
    lines.push('No travellers selected for export');
    downloadCSV(lines.join('\n'), 'carpool-report.csv');
    return;
  }

  const days = getDaysInRange(state.dateRange.start, state.dateRange.end);

  // Daily Participation Grid
  if (filters.includeDailyGrid) {
    lines.push('DAILY PARTICIPATION GRID');
    lines.push('');

    if (filteredTravellers.length === 0) {
      lines.push('No data available');
    } else {
      const headerRow = ['Date', ...filteredTravellers.flatMap((t) => [`${t.name} AM`, `${t.name} PM`])];
      lines.push(headerRow.map(escapeCSV).join(','));

      days.forEach((day) => {
        const dateKey = formatDateKey(day);
        const isIncluded = isDateIncludedForCalculation(
          day,
          state.includeSaturday,
          state.includeSunday,
          dateKey,
          state.dailyData
        );

        if (isIncluded) {
          const row = [formatDisplayDate(day)];
          filteredTravellers.forEach((t) => {
            const tripData = state.dailyData[dateKey]?.[t.id] || { morning: false, evening: false };
            row.push(tripData.morning ? 'Yes' : 'No');
            row.push(tripData.evening ? 'Yes' : 'No');
          });
          lines.push(row.map(escapeCSV).join(','));
        }
      });
    }

    lines.push('');
  }

  // Per-Traveller Summary with updated column headers
  if (filters.includeSummary) {
    lines.push('PER-TRAVELLER SUMMARY');
    lines.push('');

    if (filteredTravellers.length === 0) {
      lines.push('No data available');
    } else {
      lines.push(['Traveller Name', 'Trip Count', 'Total Amount', 'Total Payment', 'Balance', 'State'].map(escapeCSV).join(','));

      filteredTravellers.forEach((t) => {
        const balance = calculateTravellerBalance(
          t.id,
          state.dailyData,
          state.dateRange,
          state.ratePerTrip,
          state.cashPayments,
          state.includeSaturday,
          state.includeSunday,
          state.otherPending
        );

        const state_status = balance.balance > 0 ? 'Due' : balance.balance < 0 ? 'Overpaid' : 'Settled';

        lines.push(
          [
            t.name,
            balance.totalTrips,
            formatCurrency(balance.totalCharge),
            formatCurrency(balance.totalPayments),
            formatCurrency(Math.abs(balance.balance)),
            state_status,
          ]
            .map(escapeCSV)
            .join(',')
        );
      });
    }

    lines.push('');
  }

  // Payment History
  if (filters.includePayments) {
    lines.push('PAYMENT HISTORY');
    lines.push('');

    let filteredPayments = state.cashPayments.filter((p) => {
      const paymentDate = new Date(p.date);
      return paymentDate >= state.dateRange.start && paymentDate <= state.dateRange.end;
    });

    // Apply traveller filter mode
    if (filters.travellerFilterMode === 'selected') {
      filteredPayments = filteredPayments.filter((p) => filters.selectedTravellerIds.includes(p.travellerId));
    }

    // Apply payment-specific traveller filter
    if (filters.paymentTravellerId !== 'all') {
      filteredPayments = filteredPayments.filter((p) => p.travellerId === filters.paymentTravellerId);
    }

    if (filteredPayments.length === 0) {
      lines.push('No data available');
    } else {
      lines.push(['Date', 'Traveller', 'Amount', 'Note'].map(escapeCSV).join(','));

      filteredPayments
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((p) => {
          const traveller = state.travellers.find((t) => t.id === p.travellerId);
          lines.push(
            [
              format(new Date(p.date), 'MMM dd, yyyy'),
              traveller?.name || 'Unknown',
              formatCurrency(p.amount),
              p.note || '',
            ]
              .map(escapeCSV)
              .join(',')
          );
        });
    }

    lines.push('');
  }

  // Car Expenses
  if (filters.includeCarExpenses) {
    lines.push('CAR EXPENSES');
    lines.push('');

    let filteredExpenses = state.carExpenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return expenseDate >= state.dateRange.start && expenseDate <= state.dateRange.end;
    });

    // Apply category filter
    if (filters.expenseCategory !== 'all') {
      filteredExpenses = filteredExpenses.filter((e) => e.category === filters.expenseCategory);
    }

    // Apply search query filter
    if (filters.expenseSearchQuery.trim()) {
      const query = filters.expenseSearchQuery.toLowerCase();
      filteredExpenses = filteredExpenses.filter(
        (e) =>
          e.category.toLowerCase().includes(query) ||
          (e.note && e.note.toLowerCase().includes(query))
      );
    }

    if (filteredExpenses.length === 0) {
      lines.push('No data available');
    } else {
      lines.push(['Date', 'Category', 'Amount', 'Note'].map(escapeCSV).join(','));

      filteredExpenses
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((e) => {
          lines.push(
            [format(new Date(e.date), 'MMM dd, yyyy'), e.category, formatCurrency(e.amount), e.note || '']
              .map(escapeCSV)
              .join(',')
          );
        });
    }

    lines.push('');
  }

  // Overall Summary
  if (filters.includeOverallSummary) {
    lines.push('OVERALL SUMMARY');
    lines.push('');

    // Calculate totals
    let totalIncome = 0;
    days.forEach((day) => {
      const dateKey = formatDateKey(day);
      const isIncluded = isDateIncludedForCalculation(
        day,
        state.includeSaturday,
        state.includeSunday,
        dateKey,
        state.dailyData
      );

      if (isIncluded) {
        filteredTravellers.forEach((t) => {
          const tripData = state.dailyData[dateKey]?.[t.id];
          if (tripData) {
            const count = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
            totalIncome += count * state.ratePerTrip;
          }
        });
      }
    });

    // Add co-traveller incomes
    state.coTravellerIncomes.forEach((income) => {
      const incomeDate = new Date(income.date);
      if (incomeDate >= state.dateRange.start && incomeDate <= state.dateRange.end) {
        totalIncome += income.amount;
      }
    });

    const totalExpenses = state.carExpenses
      .filter((e) => {
        const expenseDate = new Date(e.date);
        return expenseDate >= state.dateRange.start && expenseDate <= state.dateRange.end;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    lines.push(['Metric', 'Amount'].map(escapeCSV).join(','));
    lines.push(['Total Income', formatCurrency(totalIncome)].map(escapeCSV).join(','));
    lines.push(['Total Expenses', formatCurrency(totalExpenses)].map(escapeCSV).join(','));
    lines.push(['Net Balance', formatCurrency(netBalance)].map(escapeCSV).join(','));
  }

  downloadCSV(lines.join('\n'), 'carpool-report.csv');
}

export async function exportToPDF(state: LedgerState, filters: ExportFilters): Promise<void> {
  await generatePDFReport(state, filters);
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
