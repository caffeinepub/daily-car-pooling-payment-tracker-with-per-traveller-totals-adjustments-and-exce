# Specification

## Summary
**Goal:** Fix all frontend date calculations to use Indian Standard Time (IST, UTC+5:30) instead of UTC, so that "today's date" is always correct for users in India.

**Planned changes:**
- Create a shared `getTodayIST()` utility function that derives the current date in IST (UTC+5:30) using a hardcoded +5:30 offset, not the device timezone.
- Fix the "Mark all travellers for today (AM & PM)" checkbox in `DailyParticipationGrid.tsx` to use the IST date instead of UTC.
- Audit and update all other `new Date()` usages across the frontend where today's date is used as a default or display value (payment forms, expense forms, OtherPendingAmountForm, CashPaymentForm, DateRangePicker defaults, auto-toll date logic) to use `getTodayIST()`.

**User-visible outcome:** All date fields and the daily participation checkbox consistently show and use the correct current calendar date in India, with no more "one day ahead" issues.
