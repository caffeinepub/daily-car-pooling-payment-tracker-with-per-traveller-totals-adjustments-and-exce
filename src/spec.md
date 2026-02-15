# Specification

## Summary
**Goal:** Revamp the Export Report page so exports default to all travellers, improve the exported traveller summary table, and add standard financial statement report types with high-quality A4 PDF/print layouts—without impacting DataSync.

**Planned changes:**
- Update the Export Report UI so the default traveller filter is “All travellers”, while still supporting a “Selected travellers only” mode with validation (block export if none selected).
- Revise the exported traveller summary table (PDF/print and CSV) to use the exact columns: Traveller Name, Trip Count, Total Amount, Total Payment, Balance, State; ensure it lists all travellers by default and respects the traveller filter mode.
- Add selectable report types on the Export Report page: Monthly Report, Profit & Loss Statement, Income Statement, Expense Statement, generated from existing ledger data (income from trips + co-traveller income; expenses from car expenses).
- Implement/adjust PDF/print generation for the new report types with a clean A4 layout, consistent typography, and page-break behavior suitable for long tables (no overlapping text; clear headings; English text only).
- Ensure reporting/export/print remains read-only and does not change or interfere with existing DataSync behavior.

**User-visible outcome:** Users can open Export Report with “All travellers” selected by default, export consistent traveller summaries (CSV/PDF/print) with the new columns, and print/export Monthly and standard financial statements in a clean A4 layout—without affecting sync behavior.
