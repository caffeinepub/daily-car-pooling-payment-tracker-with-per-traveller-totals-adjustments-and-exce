import { format, parseISO } from 'date-fns';
import { getDaysInRange, formatDateKey } from './dateRange';
import { isDateIncludedForCalculation } from './weekendInclusion';
import type { Traveller, DateRange, DailyData, CashPayment } from '../hooks/useLedgerLocalState';

interface LedgerState {
  travellers: Traveller[];
  dateRange: DateRange;
  dailyData: DailyData;
  ratePerTrip: number;
  cashPayments: CashPayment[];
  includeSaturday: boolean;
  includeSunday: boolean;
}

function arrayToCSV(data: any[][]): string {
  return data
    .map((row) =>
      row
        .map((cell) => {
          // Handle cells that contain commas or quotes
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

function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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

export async function exportToExcel(state: LedgerState): Promise<void> {
  const { travellers, dateRange, dailyData, ratePerTrip, cashPayments, includeSaturday, includeSunday } = state;
  const days = getDaysInRange(dateRange.start, dateRange.end);

  // Sheet 1: Daily Grid with AM/PM columns
  const gridData: any[][] = [];
  
  // Header row with AM/PM for each traveller
  const headerRow = ['Date', 'Day'];
  travellers.forEach((t) => {
    headerRow.push(`${t.name} (AM)`, `${t.name} (PM)`);
  });
  gridData.push(headerRow);

  // Data rows
  days.forEach((day) => {
    const dateKey = formatDateKey(day);
    const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);
    const row: any[] = [
      format(day, 'dd-MM'),
      format(day, 'EEEE'),
    ];
    
    travellers.forEach((t) => {
      const tripData = dailyData[dateKey]?.[t.id] || { morning: false, evening: false };
      if (isIncluded) {
        row.push(tripData.morning ? 1 : 0, tripData.evening ? 1 : 0);
      } else {
        row.push('-', '-');
      }
    });
    
    gridData.push(row);
  });

  // Total trips row
  const totalTripsRow: any[] = ['', 'Total Trips'];
  travellers.forEach((t) => {
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
    totalTripsRow.push(morningCount, eveningCount);
  });
  gridData.push(totalTripsRow);

  // Sheet 2: Summary with trip-based calculations and payments
  const summaryData: any[][] = [];
  summaryData.push(['Traveller', 'Trips Travelled', 'Rate/Trip', 'Total Charge', 'Payments', 'Balance']);

  travellers.forEach((t) => {
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
    
    // Calculate payments within the selected date range
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
    
    const balance = totalCharge - paymentsInRange;

    summaryData.push([t.name, totalTrips, ratePerTrip, totalCharge, paymentsInRange, balance]);
  });

  // Generate CSV content with both sheets
  const dailyGridCSV = arrayToCSV(gridData);
  const summaryCSV = arrayToCSV(summaryData);
  
  // Combine both sheets with a separator
  const combinedCSV = `Daily Grid\n${dailyGridCSV}\n\n\nSummary\n${summaryCSV}`;

  // Generate filename
  const filename = `Carpool_${format(dateRange.start, 'yyyy-MM-dd')}_to_${format(dateRange.end, 'yyyy-MM-dd')}.csv`;

  // Download
  downloadCSV(filename, combinedCSV);
}
