import { format } from 'date-fns';
import { getDaysInRange, formatDateKey } from './dateRange';
import { isDateIncludedForCalculation } from './weekendInclusion';
import { formatINR } from './money';
import type { Traveller, DateRange, DailyData, CashPayment, CarExpense, CoTravellerIncome } from '../hooks/useLedgerLocalState';

interface LedgerState {
  travellers: Traveller[];
  dateRange: DateRange;
  dailyData: DailyData;
  ratePerTrip: number;
  cashPayments: CashPayment[];
  carExpenses: CarExpense[];
  coTravellerIncomes: CoTravellerIncome[];
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

export async function exportToPDF(state: LedgerState, filters: ExportFilters): Promise<void> {
  const { travellers, dateRange, dailyData, ratePerTrip, cashPayments, carExpenses, coTravellerIncomes, includeSaturday, includeSunday } = state;
  const days = getDaysInRange(dateRange.start, dateRange.end);

  // Filter travellers based on selection
  const selectedTravellers = travellers.filter((t) => filters.selectedTravellerIds.includes(t.id));

  // Create a hidden container for print content
  const printContainer = document.createElement('div');
  printContainer.id = 'pdf-print-container';
  printContainer.style.display = 'none';
  
  let htmlContent = `
    <html>
      <head>
        <title>Carpool Ledger Report - ${format(dateRange.start, 'MMM dd, yyyy')} to ${format(dateRange.end, 'MMM dd, yyyy')}</title>
        <style>
          @media print {
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              margin: 20px;
            }
            h1 {
              font-size: 20px;
              margin-bottom: 10px;
              color: #333;
            }
            h2 {
              font-size: 16px;
              margin-top: 20px;
              margin-bottom: 10px;
              color: #555;
              border-bottom: 2px solid #ddd;
              padding-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              page-break-inside: auto;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 6px 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .font-bold {
              font-weight: bold;
            }
            .page-break {
              page-break-before: always;
            }
            .summary-info {
              margin-bottom: 15px;
            }
          }
          @page {
            margin: 1cm;
          }
        </style>
      </head>
      <body>
        <h1>Carpool Ledger Report</h1>
        <div class="summary-info">
          <p><strong>Date Range:</strong> ${format(dateRange.start, 'MMM dd, yyyy')} to ${format(dateRange.end, 'MMM dd, yyyy')}</p>
          <p><strong>Rate per Trip:</strong> ${formatINR(ratePerTrip)}</p>
          <p><strong>Generated:</strong> ${format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
        </div>
  `;

  // Daily Participation Grid
  if (filters.includeDailyGrid) {
    htmlContent += '<h2>Daily Participation Grid</h2>';
    htmlContent += '<table><thead><tr><th>Date</th><th>Day</th>';
    selectedTravellers.forEach((t) => {
      htmlContent += `<th colspan="2" class="text-center">${t.name}</th>`;
    });
    htmlContent += '</tr><tr><th></th><th></th>';
    selectedTravellers.forEach(() => {
      htmlContent += '<th class="text-center">AM</th><th class="text-center">PM</th>';
    });
    htmlContent += '</tr></thead><tbody>';

    days.forEach((day) => {
      const dateKey = formatDateKey(day);
      const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);
      htmlContent += `<tr><td>${format(day, 'dd-MM')}</td><td>${format(day, 'EEEE')}</td>`;
      
      selectedTravellers.forEach((t) => {
        const tripData = dailyData[dateKey]?.[t.id] || { morning: false, evening: false };
        if (isIncluded) {
          htmlContent += `<td class="text-center">${tripData.morning ? '✓' : ''}</td>`;
          htmlContent += `<td class="text-center">${tripData.evening ? '✓' : ''}</td>`;
        } else {
          htmlContent += '<td class="text-center">-</td><td class="text-center">-</td>';
        }
      });
      htmlContent += '</tr>';
    });

    // Total trips row
    htmlContent += '<tr class="font-bold"><td></td><td>Total Trips</td>';
    selectedTravellers.forEach((t) => {
      let morningCount = 0;
      let eveningCount = 0;
      days.forEach((day) => {
        const dateKey = formatDateKey(day);
        const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);
        if (!isIncluded) return;
        const tripData = dailyData[dateKey]?.[t.id];
        if (tripData) {
          if (tripData.morning) morningCount++;
          if (tripData.evening) eveningCount++;
        }
      });
      htmlContent += `<td class="text-center">${morningCount}</td><td class="text-center">${eveningCount}</td>`;
    });
    htmlContent += '</tr></tbody></table>';
  }

  // Trips & Payment Summary
  if (filters.includeSummary) {
    htmlContent += '<h2>Trips & Payment Summary</h2>';
    htmlContent += '<table><thead><tr><th>Traveller</th><th class="text-right">Trips</th><th class="text-right">Charge</th><th class="text-right">Payments</th><th class="text-right">Balance</th></tr></thead><tbody>';

    selectedTravellers.forEach((t) => {
      let totalTrips = 0;
      days.forEach((day) => {
        const dateKey = formatDateKey(day);
        const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);
        if (!isIncluded) return;
        const tripData = dailyData[dateKey]?.[t.id];
        if (tripData) {
          if (tripData.morning) totalTrips++;
          if (tripData.evening) totalTrips++;
        }
      });

      const totalCharge = totalTrips * ratePerTrip;
      const paymentsInRange = cashPayments
        .filter((p) => p.travellerId === t.id)
        .reduce((sum, p) => sum + p.amount, 0);
      const balance = totalCharge - paymentsInRange;

      htmlContent += `<tr>
        <td>${t.name}</td>
        <td class="text-right">${totalTrips}</td>
        <td class="text-right">${formatINR(totalCharge)}</td>
        <td class="text-right">${formatINR(paymentsInRange)}</td>
        <td class="text-right">${formatINR(balance)}</td>
      </tr>`;
    });
    htmlContent += '</tbody></table>';
  }

  // Payment History
  if (filters.includePayments && cashPayments.length > 0) {
    const filteredPayments = cashPayments.filter((p) => 
      selectedTravellers.some((t) => t.id === p.travellerId)
    );
    
    if (filteredPayments.length > 0) {
      htmlContent += '<h2>Payment History</h2>';
      htmlContent += '<table><thead><tr><th>Date</th><th>Traveller</th><th class="text-right">Amount</th><th>Note</th></tr></thead><tbody>';
      
      filteredPayments.forEach((payment) => {
        const traveller = travellers.find((t) => t.id === payment.travellerId);
        htmlContent += `<tr>
          <td>${format(new Date(payment.date), 'MMM dd, yyyy')}</td>
          <td>${traveller?.name || 'Unknown'}</td>
          <td class="text-right">${formatINR(payment.amount)}</td>
          <td>${payment.note || '-'}</td>
        </tr>`;
      });
      htmlContent += '</tbody></table>';
    }
  }

  // Car Expenses
  if (filters.includeCarExpenses && carExpenses.length > 0) {
    htmlContent += '<h2>Car Expenses</h2>';
    htmlContent += '<table><thead><tr><th>Date</th><th>Category</th><th class="text-right">Amount</th><th>Note</th></tr></thead><tbody>';
    
    carExpenses.forEach((expense) => {
      htmlContent += `<tr>
        <td>${format(new Date(expense.date), 'MMM dd, yyyy')}</td>
        <td>${expense.category}</td>
        <td class="text-right">${formatINR(expense.amount)}</td>
        <td>${expense.note || '-'}</td>
      </tr>`;
    });
    
    const totalExpenses = carExpenses.reduce((sum, e) => sum + e.amount, 0);
    htmlContent += `<tr class="font-bold">
      <td colspan="2">Total</td>
      <td class="text-right">${formatINR(totalExpenses)}</td>
      <td></td>
    </tr>`;
    htmlContent += '</tbody></table>';
  }

  // Overall Summary
  if (filters.includeOverallSummary) {
    let totalIncome = 0;
    selectedTravellers.forEach((t) => {
      let totalTrips = 0;
      days.forEach((day) => {
        const dateKey = formatDateKey(day);
        const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);
        if (!isIncluded) return;
        const tripData = dailyData[dateKey]?.[t.id];
        if (tripData) {
          if (tripData.morning) totalTrips++;
          if (tripData.evening) totalTrips++;
        }
      });
      totalIncome += totalTrips * ratePerTrip;
    });

    // Add co-traveller income
    const coTravellerTotal = coTravellerIncomes.reduce((sum, income) => sum + income.amount, 0);
    totalIncome += coTravellerTotal;

    const totalExpenses = carExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netBalance = totalIncome - totalExpenses;

    htmlContent += '<h2>Overall Summary</h2>';
    htmlContent += '<table><tbody>';
    htmlContent += `<tr><td class="font-bold">Total Income</td><td class="text-right">${formatINR(totalIncome)}</td></tr>`;
    htmlContent += `<tr><td class="font-bold">Total Expenses</td><td class="text-right">${formatINR(totalExpenses)}</td></tr>`;
    htmlContent += `<tr class="font-bold"><td>Net Balance</td><td class="text-right">${formatINR(netBalance)}</td></tr>`;
    htmlContent += '</tbody></table>';
  }

  htmlContent += '</body></html>';

  // Create iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    // Wait for content to load, then print
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      
      // Clean up after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  }
}
