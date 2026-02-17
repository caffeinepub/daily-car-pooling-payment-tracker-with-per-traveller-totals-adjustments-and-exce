# Specification

## Summary
**Goal:** Default Trips & Payment-related tabs to a full-year date range with a selectable year, without affecting other tabs’ date range behavior.

**Planned changes:**
- Update the default date range on the "Trip History" and "Trips & Payment" tabs to Jan 1–Dec 31 of the current year (unless a different range was already set for those tabs in the current session).
- Add a year selector on "Trip History" and "Trips & Payment" that defaults to the current year and, when changed, sets the date range to Jan 1–Dec 31 of the selected year.
- Keep the existing start/end date pickers on those tabs so users can manually adjust dates after the default/year selection is applied.
- Ensure non-Trips/Payment tabs (e.g., Daily, Summary, Expense, Overall) keep their current default date range behavior and maintain their own last-used range separately from Trips/Payment tabs within the session.

**User-visible outcome:** When opening Trip History or Trips & Payment, users see the full current year by default and can pick another year to jump to that year’s full range, while still being able to fine-tune dates; other tabs continue behaving as before.
