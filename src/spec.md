# Specification

## Summary
**Goal:** Fix the black/blank screen on initial app load so the UI reliably renders, and provide a safe fallback UI for unexpected runtime errors.

**Planned changes:**
- Diagnose and fix the root cause of the black screen so initial rendering reliably shows AuthGate (login) when unauthenticated, and ProfileSetupModal or LedgerPage when authenticated.
- Add a top-level runtime error boundary that shows a user-facing fallback screen with an English error message, a “Reload” action, and logs error details to the browser console.
- Ensure the frontend `../config` module exists and is resilient: provide safe defaults and handle missing/invalid configuration values without crashing.
- Add an explicit, visible loading state during initialization phases that could otherwise render as blank.

**User-visible outcome:** On a fresh load, the app shows a visible loading state and then the correct screen (login/profile setup/ledger) instead of a black screen; if something fails at runtime, users see a readable error screen with a reload button (not a blank page).
