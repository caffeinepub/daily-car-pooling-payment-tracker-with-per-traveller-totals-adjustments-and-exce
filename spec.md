# Carpool Ledger — Rate Per Trip History

## Current State
- A single `ratePerTrip: number` is stored in `useLedgerLocalState` and `LocalLedgerState`.
- `RatePerTripControl.tsx` is in the header area of `LedgerPage.tsx`. Changing the rate immediately updates all trip calculations everywhere.
- `calculateTravellerBalance` in `ledgerBalances.ts` and `calculateIncomeFromDailyData` in `tripCalculations.ts` both accept `ratePerTrip: number` — a single flat value used for every trip regardless of date.
- Backup/restore in `backupRestore.ts` persists `ratePerTrip` as a single number.

## Requested Changes (Diff)

### Add
- `RateHistoryEntry` type: `{ id: string; rate: number; effectiveFrom: string }` (date string `YYYY-MM-DD`)
- `rateHistory: RateHistoryEntry[]` field to `StoredState`, `LocalLedgerState`, and the ledger context.
- `setRateHistory` / `addRateHistoryEntry` actions in `useLedgerLocalState`.
- Helper `getRateForDate(date: Date, rateHistory: RateHistoryEntry[]): number` in a new or existing utils file — returns the rate whose `effectiveFrom` is on or before the given date, falling back to the oldest entry or the current `ratePerTrip`.
- Updated `RatePerTripControl.tsx`: when the admin changes the rate, show a small dialog/popover asking for an "Effective From" date (defaults to today). On confirm, append to `rateHistory` and update `ratePerTrip` to the new value.
- Rate history log UI in `RatePerTripControl.tsx` (or a small expandable panel beside it): shows each entry as "₹X/trip from DD MMM YYYY" with a delete option (admin only). Sorted descending by effective date.
- Read-only lock: shared/read-only users see the current rate and history but cannot change it (existing `isReadOnly` check).
- Merge logic in `mergeLocalStates`: merge `rateHistory` arrays by `id` union (same as payments).
- `clearAllLedgerData` resets `rateHistory` to `[]`.

### Modify
- `calculateTravellerBalance` — accept `rateHistory: RateHistoryEntry[]` alongside `ratePerTrip` (fallback). For each day, call `getRateForDate(day, rateHistory)` instead of using flat `ratePerTrip`.
- `calculateIncomeFromDailyData` — same change: resolve rate per day from history.
- `calculateMonthlyIncomeFromDailyData` — same.
- All call sites that pass `ratePerTrip` to these functions — also pass `rateHistory` from context.
- `getPersistedState` and `buildSnapshot` in `useLedgerLocalState` — include `rateHistory`.
- `loadState` — deserialize `rateHistory` with fallback to `[]`.
- `backupRestore.ts` `LocalLedgerState` — add optional `rateHistory?: RateHistoryEntry[]`.
- `mergeLocalStates` — merge `rateHistory` by ID union.

### Remove
- Nothing removed. `ratePerTrip` scalar is kept as the "current" display value for backwards compatibility and as a fallback when history is empty.

## Implementation Plan
1. Add `RateHistoryEntry` type and update `LocalLedgerState` / `StoredState` in `backupRestore.ts` and `useLedgerLocalState.ts`.
2. Add `rateHistory` state + `addRateHistoryEntry` / `setRateHistory` actions to `useLedgerLocalState`.
3. Add `getRateForDate` helper to `utils/rateHistory.ts` (new file).
4. Update `calculateTravellerBalance`, `calculateIncomeFromDailyData`, `calculateMonthlyIncomeFromDailyData` to resolve per-day rates from history.
5. Update all call sites that pass `ratePerTrip` to also pass `rateHistory`.
6. Update `LedgerStateContext` to expose `rateHistory`, `addRateHistoryEntry`.
7. Rewrite `RatePerTripControl.tsx`: clicking to change rate opens a small popover/dialog with new rate input + effective-from date picker. On save, appends to history. Shows collapsible history log below.
8. Update `mergeLocalStates` and `clearAllLedgerData`.
9. No UI changes outside `RatePerTripControl.tsx` and the calculation utilities.
