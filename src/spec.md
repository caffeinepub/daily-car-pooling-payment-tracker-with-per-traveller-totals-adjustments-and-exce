# Specification

## Summary
**Goal:** Fix auto-toll feature to add toll once per weekday on app launch and enable multi-category expense entry.

**Planned changes:**
- Modify auto-toll to check if a toll expense already exists for the current date on app launch
- Auto-add one toll expense only on weekdays (Monday-Friday) if no toll exists for today
- Ensure toll is added only once per day regardless of app reopens
- Add functionality to create 3 expense entries simultaneously in the add expense popup
- Pre-select categories as 'Toll', 'CNG BRD', and 'CNG AHM' for the 3 expense forms
- Allow independent amount and date input for each of the 3 expense entries

**User-visible outcome:** Users will see automatic toll expenses added once per weekday when launching the app (if not already added that day), and can add 3 expenses at once with pre-filled categories for Toll, CNG BRD, and CNG AHM.
