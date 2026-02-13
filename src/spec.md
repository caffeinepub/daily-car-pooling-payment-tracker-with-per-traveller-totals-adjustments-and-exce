# Specification

## Summary
**Goal:** Add a “Backup & Restore” tab that lets users export all app data to JSON and restore it later by merging (non-destructively) into existing data.

**Planned changes:**
- Add a new Ledger tab labeled “Backup & Restore” placed immediately before “Clear Data”, with a dedicated panel.
- Implement “Backup” export to download a JSON file containing the full local ledger state from localStorage key `carpool-ledger-state` plus the authenticated caller’s backend user profile (if present).
- Implement “Restore” import from a user-selected `.json` file, validating JSON/schema and merging into existing local data without clearing it; update UI immediately after restore.
- Apply deterministic, idempotent merge rules for local ledger data (merge by ids for lists; merge `dailyData` by dateKey+travellerId with boolean OR behavior).
- During restore, merge backend user profile non-destructively: only save the backup profile if the caller has no existing profile; surface backend errors without blocking local restore.
- Add clear English error/toast messaging for backup/restore failures and invalid inputs, without crashing the app.
- Document in the Backup & Restore panel how settings fields (e.g., dateRange, ratePerTrip, includeSaturday/includeSunday) are handled during restore and handle draft-vs-saved consistency with confirmation if there are unsaved draft changes.

**User-visible outcome:** Users can open “Backup & Restore” to download a JSON backup of their ledger data (and profile when available) and later restore from a JSON file to merge data into their current ledger without losing existing entries.
