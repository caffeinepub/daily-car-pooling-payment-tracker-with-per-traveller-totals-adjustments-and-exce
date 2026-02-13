# Specification

## Summary
**Goal:** Fix ledger backup/export so it includes the caller’s full stored ledger data by persisting LedgerState in the canister and wiring frontend backup/restore to real backend APIs.

**Planned changes:**
- Add canister-backed persistence for the full LedgerState per authenticated caller (Internet Identity principal) so ledger data survives refresh/sign-out/sign-in.
- Implement backend methods to load/save/export/restore/clear the caller’s ledger data, with export returning the full raw LedgerState exactly as stored.
- Replace placeholder frontend ledger query/mutation hooks in `frontend/src/hooks/useLedgerQueries.ts` with actor calls to the new backend methods (load, save, export, restore).
- Update “Clear Data” actions to clear canister-backed data (full clear and targeted clears) so subsequent exports reflect the cleared datasets correctly.

**User-visible outcome:** Ledger entries and settings persist across sessions for the same identity, backups export complete non-empty raw records when data exists, restores correctly overwrite stored data, and clearing data is reflected in exports.
