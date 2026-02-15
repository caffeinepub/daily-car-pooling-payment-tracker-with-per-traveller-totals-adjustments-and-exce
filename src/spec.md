# Specification

## Summary
**Goal:** Make the app default to a Monday–Friday current-week date range everywhere, and add an Auto Toll Add feature in the Car Expense panel with a persisted toggle and toll amount that can auto-create weekday toll entries without duplicates.

**Planned changes:**
- Change the app-wide default date range (on fresh load) to the current week from Monday through Friday (inclusive), replacing the current-month default, and ensure all date-range consumers use this same default.
- Add an "Auto Toll Add" toggle to the Car Expense panel and persist its state locally across reloads.
- Add a toll amount input beside the toggle; persist the amount locally; allow editing only when Auto Toll is OFF and make it read-only/disabled when Auto Toll is ON while still displaying the configured value.
- When Auto Toll is ON, automatically create a Toll car expense entry for each weekday (Mon–Fri) using the configured amount, ensuring no duplicate auto-added Toll entry is created for the same date (including across reloads or repeated toggles).

**User-visible outcome:** On first load, the app shows the current week (Mon–Fri) in the date range everywhere. In Car Expense, users can enable/disable Auto Toll Add, set a toll amount, and (when enabled) see Toll expenses auto-added for weekdays without duplicates.
