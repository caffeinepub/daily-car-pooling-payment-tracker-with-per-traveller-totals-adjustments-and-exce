import { format, parseISO } from "date-fns";
import type {
  CashPayment,
  DailyData,
  DateRange,
  Traveller,
} from "../hooks/useLedgerLocalState";
import { formatDateKey, getDaysInRange } from "./dateRange";
import { isDateIncludedForCalculation } from "./weekendInclusion";

interface LedgerState {
  travellers: Traveller[];
  dateRange: DateRange;
  dailyData: DailyData;
  ratePerTrip: number;
  cashPayments: CashPayment[];
  includeSaturday: boolean;
  includeSunday: boolean;
}

function arrayToCSV(data: unknown[][]): string {
  return data
    .map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell ?? "");
          if (
            cellStr.includes(",") ||
            cellStr.includes('"') ||
            cellStr.includes("\n")
          ) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(","),
    )
    .join("\n");
}

function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToExcel(state: LedgerState): Promise<void> {
  const {
    travellers,
    dateRange,
    dailyData,
    ratePerTrip,
    cashPayments,
    includeSaturday,
    includeSunday,
  } = state;
  const days = getDaysInRange(dateRange.start, dateRange.end);

  // Sheet 1: Daily Grid
  const gridData: unknown[][] = [];
  const headerRow = ["Date", "Day"];
  for (const t of travellers) {
    headerRow.push(`${t.name} (AM)`, `${t.name} (PM)`);
  }
  gridData.push(headerRow);

  for (const day of days) {
    const dateKey = formatDateKey(day);
    const isIncluded = isDateIncludedForCalculation(
      day,
      includeSaturday,
      includeSunday,
      dateKey,
      dailyData,
    );
    const row: unknown[] = [format(day, "dd-MM"), format(day, "EEEE")];
    for (const t of travellers) {
      const tripData = dailyData[dateKey]?.[t.id] || {
        morning: false,
        evening: false,
      };
      if (isIncluded) {
        row.push(tripData.morning ? 1 : 0, tripData.evening ? 1 : 0);
      } else {
        row.push("-", "-");
      }
    }
    gridData.push(row);
  }

  // Total trips row
  const totalTripsRow: unknown[] = ["", "Total Trips"];
  for (const t of travellers) {
    let morningCount = 0;
    let eveningCount = 0;
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
      const tripData = dailyData[dateKey]?.[t.id];
      if (tripData) {
        if (tripData.morning) morningCount++;
        if (tripData.evening) eveningCount++;
      }
    }
    totalTripsRow.push(morningCount, eveningCount);
  }
  gridData.push(totalTripsRow);

  // Sheet 2: Summary
  const summaryData: unknown[][] = [];
  summaryData.push([
    "Traveller",
    "Trips Travelled",
    "Rate/Trip",
    "Total Charge",
    "Payments",
    "Balance",
  ]);

  for (const t of travellers) {
    let totalTrips = 0;
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
      const tripData = dailyData[dateKey]?.[t.id];
      if (tripData) {
        if (tripData.morning) totalTrips++;
        if (tripData.evening) totalTrips++;
      }
    }

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

    summaryData.push([
      t.name,
      totalTrips,
      ratePerTrip,
      totalCharge,
      paymentsInRange,
      totalCharge - paymentsInRange,
    ]);
  }

  const combinedCSV = `Daily Grid\n${arrayToCSV(gridData)}\n\n\nSummary\n${arrayToCSV(summaryData)}`;
  downloadCSV(
    `Carpool_${format(dateRange.start, "yyyy-MM-dd")}_to_${format(dateRange.end, "yyyy-MM-dd")}.csv`,
    combinedCSV,
  );
}
