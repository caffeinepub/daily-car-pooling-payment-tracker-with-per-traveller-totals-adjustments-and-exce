import { format } from 'date-fns';
import { formatCurrency } from './money';
import { getDaysInRange, formatDateKey, formatDisplayDate } from './dateRange';
import { isDateIncludedForCalculation } from './weekendInclusion';
import { calculateTravellerBalance } from './ledgerBalances';
import type { Traveller, DailyData, DateRange, CashPayment, CarExpense, CoTravellerIncome } from '../hooks/useLedgerLocalState';
import type { ExportFilters } from './exportReport';
import {
  generateMonthlyReport,
  generateProfitLossStatement,
  generateIncomeStatement,
  generateExpenseStatement,
} from './accountingStatements';

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

export async function generatePDFReport(state: LedgerState, filters: ExportFilters): Promise<void> {
  // Route to appropriate report generator
  if (filters.reportType === 'monthly') {
    return generateMonthlyReportPDF(state);
  } else if (filters.reportType === 'profitLoss') {
    return generateProfitLossPDF(state);
  } else if (filters.reportType === 'income') {
    return generateIncomeStatementPDF(state);
  } else if (filters.reportType === 'expense') {
    return generateExpenseStatementPDF(state);
  } else {
    return generateStandardReportPDF(state, filters);
  }
}

function generateStandardReportPDF(state: LedgerState, filters: ExportFilters): void {
  // Filter travellers
  const filteredTravellers =
    filters.travellerFilterMode === 'selected'
      ? state.travellers.filter((t) => filters.selectedTravellerIds.includes(t.id))
      : state.travellers;

  const days = getDaysInRange(state.dateRange.start, state.dateRange.end);

  // Build HTML report
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Carpool Ledger Report</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #333;
          max-width: 100%;
        }
        h1 {
          font-size: 20pt;
          margin-bottom: 8px;
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 8px;
        }
        h2 {
          font-size: 14pt;
          margin-top: 24px;
          margin-bottom: 12px;
          color: #34495e;
          border-bottom: 1px solid #bdc3c7;
          padding-bottom: 4px;
          page-break-after: avoid;
        }
        .header-info {
          margin-bottom: 20px;
          font-size: 10pt;
          color: #7f8c8d;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 10pt;
          page-break-inside: avoid;
        }
        thead {
          display: table-header-group;
        }
        tbody {
          display: table-row-group;
        }
        th {
          background-color: #ecf0f1;
          padding: 8px;
          text-align: left;
          font-weight: 600;
          border: 1px solid #bdc3c7;
        }
        td {
          padding: 6px 8px;
          border: 1px solid #ddd;
        }
        tr {
          page-break-inside: avoid;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .no-data {
          padding: 20px;
          text-align: center;
          color: #95a5a6;
          font-style: italic;
        }
        .summary-box {
          background-color: #ecf0f1;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
        }
        .summary-label {
          font-weight: 600;
        }
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          h2 {
            page-break-before: auto;
            page-break-after: avoid;
          }
          table {
            page-break-inside: avoid;
          }
          thead {
            display: table-header-group;
          }
        }
      </style>
    </head>
    <body>
      <h1>Carpool Ledger Report</h1>
      <div class="header-info">
        <div><strong>Date Range:</strong> ${format(state.dateRange.start, 'MMM dd, yyyy')} - ${format(state.dateRange.end, 'MMM dd, yyyy')}</div>
        <div><strong>Generated:</strong> ${format(new Date(), 'MMM dd, yyyy HH:mm')}</div>
      </div>
  `;

  // Daily Participation Grid
  if (filters.includeDailyGrid) {
    html += '<h2>Daily Participation Grid</h2>';
    if (filteredTravellers.length === 0) {
      html += '<div class="no-data">No data available</div>';
    } else {
      html += '<table><thead><tr><th>Date</th>';
      filteredTravellers.forEach((t) => {
        html += `<th>${t.name} AM</th><th>${t.name} PM</th>`;
      });
      html += '</tr></thead><tbody>';

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
          html += `<tr><td>${formatDisplayDate(day)}</td>`;
          filteredTravellers.forEach((t) => {
            const tripData = state.dailyData[dateKey]?.[t.id] || { morning: false, evening: false };
            html += `<td>${tripData.morning ? 'Yes' : 'No'}</td><td>${tripData.evening ? 'Yes' : 'No'}</td>`;
          });
          html += '</tr>';
        }
      });

      html += '</tbody></table>';
    }
  }

  // Per-Traveller Summary with updated column headers
  if (filters.includeSummary) {
    html += '<h2>Per-Traveller Summary</h2>';
    if (filteredTravellers.length === 0) {
      html += '<div class="no-data">No data available</div>';
    } else {
      html += '<table><thead><tr><th>Traveller Name</th><th>Trip Count</th><th>Total Amount</th><th>Total Payment</th><th>Balance</th><th>State</th></tr></thead><tbody>';

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

        html += `<tr>
          <td>${t.name}</td>
          <td>${balance.totalTrips}</td>
          <td>${formatCurrency(balance.totalCharge)}</td>
          <td>${formatCurrency(balance.totalPayments)}</td>
          <td>${formatCurrency(Math.abs(balance.balance))}</td>
          <td>${state_status}</td>
        </tr>`;
      });

      html += '</tbody></table>';
    }
  }

  // Payment History
  if (filters.includePayments) {
    html += '<h2>Payment History</h2>';

    let filteredPayments = state.cashPayments.filter((p) => {
      const paymentDate = new Date(p.date);
      return paymentDate >= state.dateRange.start && paymentDate <= state.dateRange.end;
    });

    if (filters.travellerFilterMode === 'selected') {
      filteredPayments = filteredPayments.filter((p) => filters.selectedTravellerIds.includes(p.travellerId));
    }

    if (filters.paymentTravellerId !== 'all') {
      filteredPayments = filteredPayments.filter((p) => p.travellerId === filters.paymentTravellerId);
    }

    if (filteredPayments.length === 0) {
      html += '<div class="no-data">No data available</div>';
    } else {
      html += '<table><thead><tr><th>Date</th><th>Traveller</th><th>Amount</th><th>Note</th></tr></thead><tbody>';

      filteredPayments
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((p) => {
          const traveller = state.travellers.find((t) => t.id === p.travellerId);
          html += `<tr>
            <td>${format(new Date(p.date), 'MMM dd, yyyy')}</td>
            <td>${traveller?.name || 'Unknown'}</td>
            <td>${formatCurrency(p.amount)}</td>
            <td>${p.note || ''}</td>
          </tr>`;
        });

      html += '</tbody></table>';
    }
  }

  // Car Expenses
  if (filters.includeCarExpenses) {
    html += '<h2>Car Expenses</h2>';

    let filteredExpenses = state.carExpenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return expenseDate >= state.dateRange.start && expenseDate <= state.dateRange.end;
    });

    if (filters.expenseCategory !== 'all') {
      filteredExpenses = filteredExpenses.filter((e) => e.category === filters.expenseCategory);
    }

    if (filters.expenseSearchQuery.trim()) {
      const query = filters.expenseSearchQuery.toLowerCase();
      filteredExpenses = filteredExpenses.filter(
        (e) =>
          e.category.toLowerCase().includes(query) ||
          (e.note && e.note.toLowerCase().includes(query))
      );
    }

    if (filteredExpenses.length === 0) {
      html += '<div class="no-data">No data available</div>';
    } else {
      html += '<table><thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Note</th></tr></thead><tbody>';

      filteredExpenses
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((e) => {
          html += `<tr>
            <td>${format(new Date(e.date), 'MMM dd, yyyy')}</td>
            <td>${e.category}</td>
            <td>${formatCurrency(e.amount)}</td>
            <td>${e.note || ''}</td>
          </tr>`;
        });

      html += '</tbody></table>';
    }
  }

  // Overall Summary
  if (filters.includeOverallSummary) {
    html += '<h2>Overall Summary</h2>';

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

    html += `
      <div class="summary-box">
        <div class="summary-row">
          <span class="summary-label">Total Income:</span>
          <span>${formatCurrency(totalIncome)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Total Expenses:</span>
          <span>${formatCurrency(totalExpenses)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Net Balance:</span>
          <span><strong>${formatCurrency(netBalance)}</strong></span>
        </div>
      </div>
    `;
  }

  html += '</body></html>';

  openPrintWindow(html);
}

function generateMonthlyReportPDF(state: LedgerState): void {
  const monthlyData = generateMonthlyReport(
    state.dailyData,
    state.dateRange,
    state.ratePerTrip,
    state.includeSaturday,
    state.includeSunday,
    state.carExpenses,
    state.coTravellerIncomes
  );

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Monthly Report</title>
      <style>
        ${getCommonStyles()}
      </style>
    </head>
    <body>
      <h1>Monthly Report</h1>
      <div class="header-info">
        <div><strong>Date Range:</strong> ${format(state.dateRange.start, 'MMM dd, yyyy')} - ${format(state.dateRange.end, 'MMM dd, yyyy')}</div>
        <div><strong>Generated:</strong> ${format(new Date(), 'MMM dd, yyyy HH:mm')}</div>
      </div>

      <h2>Month-by-Month Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Income</th>
            <th>Expenses</th>
            <th>Net Income</th>
          </tr>
        </thead>
        <tbody>
  `;

  monthlyData.months.forEach((month) => {
    html += `
      <tr>
        <td>${month.monthLabel}</td>
        <td>${formatCurrency(month.income)}</td>
        <td>${formatCurrency(month.expenses)}</td>
        <td><strong>${formatCurrency(month.netIncome)}</strong></td>
      </tr>
    `;
  });

  html += `
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; background-color: #ecf0f1;">
            <td>Total</td>
            <td>${formatCurrency(monthlyData.totalIncome)}</td>
            <td>${formatCurrency(monthlyData.totalExpenses)}</td>
            <td>${formatCurrency(monthlyData.totalNetIncome)}</td>
          </tr>
        </tfoot>
      </table>
    </body>
    </html>
  `;

  openPrintWindow(html);
}

function generateProfitLossPDF(state: LedgerState): void {
  const plStatement = generateProfitLossStatement(
    state.dailyData,
    state.dateRange,
    state.ratePerTrip,
    state.includeSaturday,
    state.includeSunday,
    state.carExpenses,
    state.coTravellerIncomes
  );

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Profit & Loss Statement</title>
      <style>
        ${getCommonStyles()}
      </style>
    </head>
    <body>
      <h1>Profit & Loss Statement</h1>
      <div class="header-info">
        <div><strong>Date Range:</strong> ${format(state.dateRange.start, 'MMM dd, yyyy')} - ${format(state.dateRange.end, 'MMM dd, yyyy')}</div>
        <div><strong>Generated:</strong> ${format(new Date(), 'MMM dd, yyyy HH:mm')}</div>
      </div>

      <h2>Revenue</h2>
      <table>
        <tbody>
          <tr>
            <td>Trip Income</td>
            <td style="text-align: right;">${formatCurrency(plStatement.revenue.tripIncome)}</td>
          </tr>
          <tr>
            <td>Co-Traveller Income</td>
            <td style="text-align: right;">${formatCurrency(plStatement.revenue.coTravellerIncome)}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #ecf0f1;">
            <td>Total Revenue</td>
            <td style="text-align: right;">${formatCurrency(plStatement.revenue.totalRevenue)}</td>
          </tr>
        </tbody>
      </table>

      <h2>Expenses</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
  `;

  plStatement.expenses.byCategory.forEach((expense) => {
    html += `
      <tr>
        <td>${expense.category}</td>
        <td style="text-align: right;">${formatCurrency(expense.amount)}</td>
      </tr>
    `;
  });

  html += `
          <tr style="font-weight: bold; background-color: #ecf0f1;">
            <td>Total Expenses</td>
            <td style="text-align: right;">${formatCurrency(plStatement.expenses.totalExpenses)}</td>
          </tr>
        </tbody>
      </table>

      <div class="summary-box" style="margin-top: 24px;">
        <div class="summary-row">
          <span class="summary-label" style="font-size: 14pt;">Net Profit/Loss:</span>
          <span style="font-size: 14pt;"><strong>${formatCurrency(plStatement.netProfitLoss)}</strong></span>
        </div>
      </div>
    </body>
    </html>
  `;

  openPrintWindow(html);
}

function generateIncomeStatementPDF(state: LedgerState): void {
  const incomeStatement = generateIncomeStatement(
    state.dailyData,
    state.dateRange,
    state.ratePerTrip,
    state.includeSaturday,
    state.includeSunday,
    state.coTravellerIncomes
  );

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Income Statement</title>
      <style>
        ${getCommonStyles()}
      </style>
    </head>
    <body>
      <h1>Income Statement</h1>
      <div class="header-info">
        <div><strong>Date Range:</strong> ${format(state.dateRange.start, 'MMM dd, yyyy')} - ${format(state.dateRange.end, 'MMM dd, yyyy')}</div>
        <div><strong>Generated:</strong> ${format(new Date(), 'MMM dd, yyyy HH:mm')}</div>
      </div>

      <h2>Operating Income</h2>
      <table>
        <tbody>
          <tr>
            <td>Trip Income</td>
            <td style="text-align: right;">${formatCurrency(incomeStatement.operatingIncome.tripIncome)}</td>
          </tr>
          <tr>
            <td>Co-Traveller Income</td>
            <td style="text-align: right;">${formatCurrency(incomeStatement.operatingIncome.coTravellerIncome)}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #ecf0f1;">
            <td>Total Operating Income</td>
            <td style="text-align: right;">${formatCurrency(incomeStatement.operatingIncome.totalOperatingIncome)}</td>
          </tr>
        </tbody>
      </table>

      <div class="summary-box" style="margin-top: 24px;">
        <div class="summary-row">
          <span class="summary-label" style="font-size: 14pt;">Total Income:</span>
          <span style="font-size: 14pt;"><strong>${formatCurrency(incomeStatement.totalIncome)}</strong></span>
        </div>
      </div>
    </body>
    </html>
  `;

  openPrintWindow(html);
}

function generateExpenseStatementPDF(state: LedgerState): void {
  const expenseStatement = generateExpenseStatement(state.dateRange, state.carExpenses);

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Expense Statement</title>
      <style>
        ${getCommonStyles()}
      </style>
    </head>
    <body>
      <h1>Expense Statement</h1>
      <div class="header-info">
        <div><strong>Date Range:</strong> ${format(state.dateRange.start, 'MMM dd, yyyy')} - ${format(state.dateRange.end, 'MMM dd, yyyy')}</div>
        <div><strong>Generated:</strong> ${format(new Date(), 'MMM dd, yyyy HH:mm')}</div>
      </div>

      <h2>Expenses by Category</h2>
  `;

  if (expenseStatement.expensesByCategory.length === 0) {
    html += '<div class="no-data">No expenses recorded for this period</div>';
  } else {
    html += `
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
    `;

    expenseStatement.expensesByCategory.forEach((expense) => {
      html += `
        <tr>
          <td>${expense.category}</td>
          <td style="text-align: right;">${formatCurrency(expense.amount)}</td>
        </tr>
      `;
    });

    html += `
          <tr style="font-weight: bold; background-color: #ecf0f1;">
            <td>Total Expenses</td>
            <td style="text-align: right;">${formatCurrency(expenseStatement.totalExpenses)}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  html += `
      <div class="summary-box" style="margin-top: 24px;">
        <div class="summary-row">
          <span class="summary-label" style="font-size: 14pt;">Total Expenses:</span>
          <span style="font-size: 14pt;"><strong>${formatCurrency(expenseStatement.totalExpenses)}</strong></span>
        </div>
      </div>
    </body>
    </html>
  `;

  openPrintWindow(html);
}

function getCommonStyles(): string {
  return `
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #333;
      max-width: 100%;
    }
    h1 {
      font-size: 20pt;
      margin-bottom: 8px;
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 8px;
    }
    h2 {
      font-size: 14pt;
      margin-top: 24px;
      margin-bottom: 12px;
      color: #34495e;
      border-bottom: 1px solid #bdc3c7;
      padding-bottom: 4px;
      page-break-after: avoid;
    }
    .header-info {
      margin-bottom: 20px;
      font-size: 10pt;
      color: #7f8c8d;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    thead {
      display: table-header-group;
    }
    tbody {
      display: table-row-group;
    }
    tfoot {
      display: table-footer-group;
    }
    th {
      background-color: #ecf0f1;
      padding: 8px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #bdc3c7;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #ddd;
    }
    tr {
      page-break-inside: avoid;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .no-data {
      padding: 20px;
      text-align: center;
      color: #95a5a6;
      font-style: italic;
    }
    .summary-box {
      background-color: #ecf0f1;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .summary-label {
      font-weight: 600;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      h2 {
        page-break-before: auto;
        page-break-after: avoid;
      }
      table {
        page-break-inside: avoid;
      }
      thead {
        display: table-header-group;
      }
    }
  `;
}

function openPrintWindow(html: string): void {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    // Trigger print dialog after content loads
    printWindow.onload = () => {
      printWindow.print();
    };
  } else {
    throw new Error('Failed to open print window. Please allow popups for this site.');
  }
}
