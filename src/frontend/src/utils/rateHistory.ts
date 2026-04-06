export interface RateHistoryEntry {
  id: string;
  rate: number;
  effectiveFrom: string; // YYYY-MM-DD local date string
}

/**
 * Returns the applicable rate for a given date.
 * Finds the entry with the latest effectiveFrom that is <= the date's YYYY-MM-DD key.
 * Falls back to fallbackRate if history is empty or no entry applies before the date.
 */
export function getRateForDate(
  date: Date,
  rateHistory: RateHistoryEntry[],
  fallbackRate: number,
): number {
  if (!rateHistory || rateHistory.length === 0) return fallbackRate;

  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  // Sort descending by effectiveFrom, find the first entry <= dateKey
  const sorted = [...rateHistory].sort((a, b) =>
    b.effectiveFrom.localeCompare(a.effectiveFrom),
  );
  const match = sorted.find((e) => e.effectiveFrom <= dateKey);

  // If no entry applies (all entries are in the future), use the oldest (earliest) entry
  return match ? match.rate : (sorted[sorted.length - 1]?.rate ?? fallbackRate);
}
