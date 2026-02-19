# Specification

## Summary
**Goal:** Make the Daily Participation view load and render using the currently selected week (Mon–Fri) date range on initial app load, and ensure date range changes immediately update the grid.

**Planned changes:**
- Align the Daily Participation grid’s initial data fetch/render to the app’s currently selected week date range (Mon–Fri) on fresh page load, avoiding any default full-month load unless the user selects a month range.
- Ensure the Daily Participation grid reacts immediately to date range picker changes (including switching between weeks) and displays rows for the newly selected start/end dates.
- Preserve and restore the Daily tab’s saved date range when navigating away from and back to the Daily tab, with the grid matching that restored range.

**User-visible outcome:** On page load, the Daily Participation grid shows only the current week (Mon–Fri) when the week range is selected, and changing the date range updates the grid immediately without extra actions.
