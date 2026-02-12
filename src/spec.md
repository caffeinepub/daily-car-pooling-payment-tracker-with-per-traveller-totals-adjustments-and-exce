# Specification

## Summary
**Goal:** Make the Ledger page use consistent tab navigation on all screen sizes, add weekend inclusion controls that affect editing and calculations, and enable filtered exports to PDF and Excel-compatible formats with a cohesive non-blue/purple theme.

**Planned changes:**
- Update the Ledger page layout so Travellers, Daily, Summary, Car, and Overall are always shown as clearly clickable tabs on all viewport sizes (including desktop), replacing the prior large-screen multi-column layout as the primary navigation.
- Ensure existing unsaved-changes protection for the Daily tab still prompts when navigating away with draft changes.
- Add two user controls: “Include Saturday” and “Include Sunday”, persisted per user, that determine whether weekend dates are editable in the Daily Participation grid.
- Make “Mark all travellers for today” respect weekend inclusion (disabled only when today is an excluded weekend day).
- Update Summary and Overall calculations to include weekend trips only when the corresponding weekend days are included; display a weekday vs weekend trip breakdown (and associated charges) in the Summary.
- Expand/replace the existing export action with an export UI that supports PDF and Excel-compatible export (preferably XLSX), with filters for date range, traveller selection (all vs subset), and which sections to include (Daily Grid, Per-traveller Summary, Payments, Car Expenses, Overall Summary).
- Apply a cohesive visual theme (consistent spacing/typography/styling) across tabs, weekend toggles, and export/filter UI using a distinct palette that is not primarily blue/purple, keeping all user-facing text in English.

**User-visible outcome:** Users can navigate Ledger sections via tabs on any device size, control whether Saturdays and Sundays are included (affecting editability and totals), see weekday vs weekend breakdowns in summaries, and export filtered reports to PDF and Excel-compatible files with a consistent updated UI theme.
