# Specification

## Summary
**Goal:** Allow recording per-traveller cash payments and have them reduce the traveller’s pending balance in Summary and CSV export for the selected date range.

**Planned changes:**
- Add a per-traveller cash payment entry in the ledger UI (amount required; date defaults to today; optional note if already supported) and validate amount is numeric and > 0 with English validation messages.
- Update Summary calculations to show Payments per traveller (sum of cash payments in the selected date range) and recalculate Balance as (tripCount × ratePerTrip) − payments, updating immediately when trips/rate change.
- Persist per-traveller cash payments to localStorage and load safely on startup (handle missing/old data), including cleanup/ignore behavior for payments tied to removed travellers.
- Update CSV export “Summary” rows to include per-traveller Payments (cash payment sum in date range) and Balance (Total Charge − Payments), without changing the Daily Grid export format.

**User-visible outcome:** Users can record cash payments for each traveller, immediately see Payments and reduced Balance in the Summary for the selected date range, and export a CSV where Summary includes those payments and updated balances that persist after reload.
