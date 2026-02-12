import { format, parseISO } from 'date-fns';
import { getDaysInRange, formatDateKey } from './dateRange';
import { isDateIncluded } from './weekendInclusion';
import type { Traveller, DateRange, DailyData, CashPayment, OtherPending, CarExpense } from '../hooks/useLedgerLocalState';

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
  const { travellers, dateRange, dailyData, ratePerTrip, cashPayments, otherPending, carExpenses, includeSaturday, includeSunday } = state;
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
      const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
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
    summaryData.push(['Traveller', 'Weekday Trips', 'Weekend Trips', 'Total Trips', 'Rate/Trip', 'Total Charge', 'Other Pending', 'Payments', 'Balance']);

    filteredTravellers.forEach((t) => {
      let weekdayTrips = 0;
      let weekendTrips = 0;

      days.forEach((day) => {
        const dateKey = formatDateKey(day);
        const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
        if (!isIncluded) return;

        const tripData = dailyData[dateKey]?.[t.id];
        if (tripData) {
          const dayOfWeek = day.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);

          if (isWeekend) {
            weekendTrips += tripCount;
          } else {
            weekdayTrips += tripCount;
          }
        }
      });

      const totalTrips = weekdayTrips + weekendTrips;
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

      summaryData.push([t.name, weekdayTrips, weekendTrips, totalTrips, ratePerTrip, totalCharge, otherPendingInRange, paymentsInRange, balance]);
    });

    sections.push('Summary\n' + arrayToCSV(summaryData));
  }

  // Payments
  if (filters.includePayments) {
    const paymentData: any[][] = [];
    paymentData.push(['Date', 'Traveller', 'Amount', 'Note']);

    const filteredPayments = cashPayments.filter((p) => filters.selectedTravellerIds.includes(p.travellerId));
    filteredPayments.forEach((p) => {
      const traveller = travellers.find((t) => t.id === p.travellerId);
      paymentData.push([p.date, traveller?.name || 'Unknown', p.amount, p.note || '']);
    });

    sections.push('Payment History\n' + arrayToCSV(paymentData));
  }

  // Car Expenses
  if (filters.includeCarExpenses) {
    const expenseData: any[][] = [];
    expenseData.push(['Date', 'Category', 'Amount', 'Note']);

    carExpenses.forEach((e) => {
      expenseData.push([e.date, e.category, e.amount, e.note || '']);
    });

    sections.push('Car Expenses\n' + arrayToCSV(expenseData));
  }

  // Overall Summary
  if (filters.includeOverallSummary) {
    let totalIncome = 0;
    days.forEach((day) => {
      const dateKey = formatDateKey(day);
      const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
      if (!isIncluded) return;

      filteredTravellers.forEach((t) => {
        const tripData = dailyData[dateKey]?.[t.id];
        if (tripData) {
          const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
          totalIncome += tripCount * ratePerTrip;
        }
      });
    });

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

  const combinedCSV = sections.join('\n\n\n');
  const filename = `Carpool_${format(dateRange.start, 'yyyy-MM-dd')}_to_${format(dateRange.end, 'yyyy-MM-dd')}.csv`;
  downloadFile(filename, combinedCSV, 'text/csv;charset=utf-8;');
}

export async function exportToPDF(state: LedgerState, filters: ExportFilters): Promise<void> {
  // For PDF, we'll generate an HTML document and use the browser's print functionality
  const { travellers, dateRange, dailyData, ratePerTrip, cashPayments, otherPending, carExpenses, includeSaturday, includeSunday } = state;
  const filteredTravellers = filterTravellers(travellers, filters.selectedTravellerIds);
  const days = getDaysInRange(dateRange.start, dateRange.end);

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Carpool Ledger Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
    h2 { color: #555; font-size: 18px; margin-top: 30px; margin-bottom: 10px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 20px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 30px; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #c89664; color: white; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .summary-box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .summary-item { display: flex; justify-content: space-between; margin: 5px 0; }
    @media print {
      body { margin: 0; }
      h2 { page-break-before: always; }
      h2:first-of-type { page-break-before: avoid; }
    }
  </style>
</head>
<body>
  <h1>Carpool Ledger Report</h1>
  <div class="subtitle">Period: ${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}</div>
`;

  // Daily Grid
  if (filters.includeDailyGrid) {
    html += '<h2>Daily Participation Grid</h2><table><thead><tr><th>Date</th><th>Day</th>';
    filteredTravellers.forEach((t) => {
      html += `<th>${t.name} AM</th><th>${t.name} PM</th>`;
    });
    html += '</tr></thead><tbody>';

    days.forEach((day) => {
      const dateKey = formatDateKey(day);
      const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
      html += `<tr><td>${format(day, 'dd-MM')}</td><td>${format(day, 'EEE')}</td>`;

      filteredTravellers.forEach((t) => {
        const tripData = dailyData[dateKey]?.[t.id] || { morning: false, evening: false };
        if (isIncluded) {
          html += `<td>${tripData.morning ? '✓' : ''}</td><td>${tripData.evening ? '✓' : ''}</td>`;
        } else {
          html += '<td>-</td><td>-</td>';
        }
      });

      html += '</tr>';
    });

    html += '</tbody></table>';
  }

  // Summary
  if (filters.includeSummary) {
    html += '<h2>Per-Traveller Summary</h2><table><thead><tr><th>Traveller</th><th>Weekday</th><th>Weekend</th><th>Total</th><th>Charge</th><th>Other</th><th>Payments</th><th>Balance</th></tr></thead><tbody>';

    filteredTravellers.forEach((t) => {
      let weekdayTrips = 0;
      let weekendTrips = 0;

      days.forEach((day) => {
        const dateKey = formatDateKey(day);
        const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
        if (!isIncluded) return;

        const tripData = dailyData[dateKey]?.[t.id];
        if (tripData) {
          const dayOfWeek = day.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);

          if (isWeekend) {
            weekendTrips += tripCount;
          } else {
            weekdayTrips += tripCount;
          }
        }
      });

      const totalTrips = weekdayTrips + weekendTrips;
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

      html += `<tr><td>${t.name}</td><td>${weekdayTrips}</td><td>${weekendTrips}</td><td>${totalTrips}</td><td>₹${totalCharge}</td><td>₹${otherPendingInRange}</td><td>₹${paymentsInRange}</td><td>₹${balance}</td></tr>`;
    });

    html += '</tbody></table>';
  }

  // Overall Summary
  if (filters.includeOverallSummary) {
    let totalIncome = 0;
    days.forEach((day) => {
      const dateKey = formatDateKey(day);
      const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
      if (!isIncluded) return;

      filteredTravellers.forEach((t) => {
        const tripData = dailyData[dateKey]?.[t.id];
        if (tripData) {
          const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
          totalIncome += tripCount * ratePerTrip;
        }
      });
    });

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

    html += '<h2>Overall Summary</h2><div class="summary-box">';
    html += `<div class="summary-item"><strong>Total Income:</strong><span>₹${totalIncome}</span></div>`;
    html += `<div class="summary-item"><strong>Total Expense:</strong><span>₹${totalExpense}</span></div>`;
    html += `<div class="summary-item"><strong>Profit/Loss:</strong><span>₹${profitLoss}</span></div>`;
    html += '</div>';
  }

  html += '</body></html>';

  // Open in new window and trigger print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

export async function exportToXLSX(state: LedgerState, filters: ExportFilters): Promise<void> {
  // For XLSX, we'll generate an HTML table and download as .xls (Excel-compatible HTML format)
  const { travellers, dateRange, dailyData, ratePerTrip, cashPayments, otherPending, carExpenses, includeSaturday, includeSunday } = state;
  const filteredTravellers = filterTravellers(travellers, filters.selectedTravellerIds);
  const days = getDaysInRange(dateRange.start, dateRange.end);

  let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <style>
    table { border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 5px; }
    th { background-color: #c89664; font-weight: bold; }
  </style>
</head>
<body>
`;

  // Daily Grid
  if (filters.includeDailyGrid) {
    html += '<h2>Daily Grid</h2><table><thead><tr><th>Date</th><th>Day</th>';
    filteredTravellers.forEach((t) => {
      html += `<th>${t.name} (AM)</th><th>${t.name} (PM)</th>`;
    });
    html += '</tr></thead><tbody>';

    days.forEach((day) => {
      const dateKey = formatDateKey(day);
      const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
      html += `<tr><td>${format(day, 'dd-MM')}</td><td>${format(day, 'EEEE')}</td>`;

      filteredTravellers.forEach((t) => {
        const tripData = dailyData[dateKey]?.[t.id] || { morning: false, evening: false };
        if (isIncluded) {
          html += `<td>${tripData.morning ? 1 : 0}</td><td>${tripData.evening ? 1 : 0}</td>`;
        } else {
          html += '<td>-</td><td>-</td>';
        }
      });

      html += '</tr>';
    });

    html += '</tbody></table><br/><br/>';
  }

  // Summary
  if (filters.includeSummary) {
    html += '<h2>Summary</h2><table><thead><tr><th>Traveller</th><th>Weekday Trips</th><th>Weekend Trips</th><th>Total Trips</th><th>Rate/Trip</th><th>Total Charge</th><th>Other Pending</th><th>Payments</th><th>Balance</th></tr></thead><tbody>';

    filteredTravellers.forEach((t) => {
      let weekdayTrips = 0;
      let weekendTrips = 0;

      days.forEach((day) => {
        const dateKey = formatDateKey(day);
        const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
        if (!isIncluded) return;

        const tripData = dailyData[dateKey]?.[t.id];
        if (tripData) {
          const dayOfWeek = day.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);

          if (isWeekend) {
            weekendTrips += tripCount;
          } else {
            weekdayTrips += tripCount;
          }
        }
      });

      const totalTrips = weekdayTrips + weekendTrips;
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

      html += `<tr><td>${t.name}</td><td>${weekdayTrips}</td><td>${weekendTrips}</td><td>${totalTrips}</td><td>${ratePerTrip}</td><td>${totalCharge}</td><td>${otherPendingInRange}</td><td>${paymentsInRange}</td><td>${balance}</td></tr>`;
    });

    html += '</tbody></table><br/><br/>';
  }

  // Payments
  if (filters.includePayments) {
    html += '<h2>Payments</h2><table><thead><tr><th>Date</th><th>Traveller</th><th>Amount</th><th>Note</th></tr></thead><tbody>';

    const filteredPayments = cashPayments.filter((p) => filters.selectedTravellerIds.includes(p.travellerId));
    filteredPayments.forEach((p) => {
      const traveller = travellers.find((t) => t.id === p.travellerId);
      html += `<tr><td>${p.date}</td><td>${traveller?.name || 'Unknown'}</td><td>${p.amount}</td><td>${p.note || ''}</td></tr>`;
    });

    html += '</tbody></table><br/><br/>';
  }

  // Car Expenses
  if (filters.includeCarExpenses) {
    html += '<h2>Car Expenses</h2><table><thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Note</th></tr></thead><tbody>';

    carExpenses.forEach((e) => {
      html += `<tr><td>${e.date}</td><td>${e.category}</td><td>${e.amount}</td><td>${e.note || ''}</td></tr>`;
    });

    html += '</tbody></table><br/><br/>';
  }

  // Overall Summary
  if (filters.includeOverallSummary) {
    let totalIncome = 0;
    days.forEach((day) => {
      const dateKey = formatDateKey(day);
      const isIncluded = isDateIncluded(day, includeSaturday, includeSunday);
      if (!isIncluded) return;

      filteredTravellers.forEach((t) => {
        const tripData = dailyData[dateKey]?.[t.id];
        if (tripData) {
          const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
          totalIncome += tripCount * ratePerTrip;
        }
      });
    });

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

    html += '<h2>Overall Summary</h2><table><thead><tr><th>Metric</th><th>Amount</th></tr></thead><tbody>';
    html += `<tr><td>Total Income</td><td>${totalIncome}</td></tr>`;
    html += `<tr><td>Total Expense</td><td>${totalExpense}</td></tr>`;
    html += `<tr><td>Profit/Loss</td><td>${profitLoss}</td></tr>`;
    html += '</tbody></table>';
  }

  html += '</body></html>';

  const filename = `Carpool_${format(dateRange.start, 'yyyy-MM-dd')}_to_${format(dateRange.end, 'yyyy-MM-dd')}.xls`;
  downloadFile(filename, html, 'application/vnd.ms-excel');
}
