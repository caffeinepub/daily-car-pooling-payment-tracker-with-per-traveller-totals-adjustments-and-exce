# Specification

## Summary
**Goal:** Extend the Trip History page to display, edit, and delete Other Pending Amount entries using a unified shared data model.

**Planned changes:**
- Add an `otherPendingAmounts` array to the ledger state data model, with fields: id, name, date, amount, and optional comment
- Migrate existing Other Pending Amount entries from the Summary/SummaryPanel flow to use this shared data structure
- Ensure CRUD operations on `otherPendingAmounts` persist to localStorage and sync to the backend
- Add an "Other Pending Amounts" section to the Trip History page showing a flat list filtered by the selected date range, with columns: Name, Date, Amount, Comment, and Edit/Delete actions per row
- Implement an Edit dialog (pre-filled with all four fields) that updates the shared state and reflects changes immediately on the Trip History page, Summary page, and balance calculations
- Implement a Delete confirmation dialog that removes the entry from the shared state and updates the Trip History page, Summary page, and balance calculations accordingly

**User-visible outcome:** Users can view all Other Pending Amounts in Trip History, and edit or delete any entry directly from that page, with changes reflected everywhere in the app including the Summary page and balance totals.
