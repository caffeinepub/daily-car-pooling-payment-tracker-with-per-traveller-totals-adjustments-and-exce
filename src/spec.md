# Specification

## Summary
**Goal:** Enable private, per-Internet-Identity multi-device syncing of all user-entered ledger data via backend persistence and 2–5s polling, with a clear sync status indicator and a consistent visual theme.

**Planned changes:**
- Extend backend storage to persist the authenticated caller’s complete app data (user profile + full ledger/local state currently saved under `localStorage` key `carpool-ledger-state`), scoped per Internet Identity principal.
- Add backend fetch/save APIs for per-user app data, including metadata (e.g., lastUpdated/version) to support polling and basic conflict handling.
- Persist the new per-user data across canister upgrades, with a conditional migration to preserve existing saved user profile data for current users.
- Implement frontend sync: load backend-saved data on login, deterministically merge with existing local state, and poll backend every 2–5 seconds while authenticated to pull updates from other devices.
- Implement outbound frontend sync: debounce/batch local changes, merge safely with newer remote data, and surface sync failures without blocking UI.
- Add an authenticated-only UI sync status indicator (English) showing states like “Synced”, “Syncing…”, and “Offline / Sync failed”.
- Apply a coherent, distinctive visual theme across authentication, profile setup, and ledger pages, avoiding a blue/purple-dominant palette.

**User-visible outcome:** After logging in with Internet Identity on multiple devices, a user’s profile and all ledger inputs automatically sync privately across devices within ~5 seconds, with a visible sync status and a refreshed, consistent app theme.
