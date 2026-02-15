# Specification

## Summary
**Goal:** Restore reliable multi-device sync, improve responsive navigation/layout, and enable working PDF/Excel exports.

**Planned changes:**
- Add a clearly labeled “Log out” action to the mobile hamburger/sidebar menu that performs the same logout behavior as the existing header logout (clear Internet Identity session, React Query cache, and local storage key `carpool-ledger-state`).
- Fix and restore polling/merge-based multi-device synchronization so changes made on one device appear on another within ~2–5 seconds while logged in to the same account; ensure sync status updates correctly and stops/reset on logout.
- Make the Date Range UI responsive on small screens so controls don’t overlap with the title/hamburger button and remain usable at narrow widths.
- Adjust desktop navigation so “Payment History”, “Expense History”, and “Export Report” are visible on laptop/large screens (while remaining in the hamburger menu on small screens).
- Enable functional Export PDF and Export Excel options (remove “Not available” behavior), with clear success/error feedback; allow PDF via a print-to-PDF workflow and Excel via a downloadable file (CSV-compatible acceptable).

**User-visible outcome:** Users can log out from the mobile menu, see ledger changes sync across devices within a few seconds, use a properly aligned Date Range on small screens, access key sections directly from desktop navigation, and successfully export reports to PDF and Excel with clear completion/failure feedback.
