# Specification

## Summary
**Goal:** Update Auto Toll so it only auto-adds a single weekday toll entry per day, and add a Trip History screen that summarizes trips and totals over the currently selected date range.

**Planned changes:**
- Change Auto Toll behavior to stop bulk-creating toll expenses across the selected date range/week, and instead auto-create at most one Toll car-expense entry for the current date on weekdays only (no duplicates; none on weekends).
- Add a Trip History screen accessible from the in-app menu that uses the existing global date range selection and lists trip history rows by traveller/date with morning+evening trip counting (0–2) plus separate co-traveller income rows counted as 1 each.
- Show a “Total trips” value at the bottom of Trip History equal to the sum of all trip counts in the selected date range, with all user-facing text in English.

**User-visible outcome:** With Auto Toll enabled, the app only adds a single toll entry for the current weekday (if missing), and users can open Trip History from the menu to see per-day trip counts by traveller (including co-traveller income entries) and a total trips count for the selected date range.
