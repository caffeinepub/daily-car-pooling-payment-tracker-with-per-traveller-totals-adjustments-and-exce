# Specification

## Summary
**Goal:** Default the shared date range to the current calendar month (outside Trips & Payment) and add synchronized Month/Year selectors on the Overall tab to quickly switch ranges.

**Planned changes:**
- Update the default date range for non–Trips & Payment tabs (including Overall) to the current month (1st through last day) on fresh load and after “Clear Data”.
- Preserve existing Trips & Payment tab behavior (default to full-year range when first entering those tabs unless the user changes it).
- Add Month and Year dropdown selectors on the Overall tab that immediately set the shared date range (month = full selected month; year = full year when no month selected; changing year preserves selected month if set).
- Keep Month/Year dropdowns in sync with manual DateRangePicker changes, showing the matching month/year when the range exactly equals a full month or full year, otherwise showing a “Custom” state (and Year becomes “Custom” only when spanning multiple years).

**User-visible outcome:** On the Overall tab, the app starts with the current month selected by default, and users can switch the date range via Month/Year dropdowns or manual date picking with the controls staying synchronized (including a clear “Custom” state for non-standard ranges).
