# Changelog

This file records implemented changes, not a promise that an installer has been
released or signed. Package version is currently `2.0.0`.

## Unreleased

### Interface and records follow-up

- Restored office copyright in a persistent footer.
- Prevented preview panel clipping; added bounded horizontal/vertical table
  scrolling, sticky headers, a keyboard-focusable region, and a scroll hint.
- Added reachable first/previous/next/last pagination with 25/50/100 row sizes.
- Changed duplicate matching to normalized owner + DOB + DOD together.
- Added confirmed per-file history removal and clear-all file history without
  deleting source files, loaded records, or activity.
- Added unit/browser regression coverage for the follow-up behavior.

### Documentation

- Expanded the root README and added an application-directory quick start.
- Added user, data-format, architecture, testing, contribution, and security guides.
- Added `TO_DELETE.txt`, an evidence-based review list of legacy unused files.
- No cleanup candidates were deleted by the documentation update.

## Version 2 baseline

- Rebuilt the compact local-first Electron workspace while preserving window sizing.
- Added batch fixed-width/delimited import, validation, normalization, issue logs,
  duplicate review/merge, and SSN masking.
- Added search, filters, editable rows, manual entries, sorting, and pagination.
- Added Excel/CSV/JSON/PDF exports, selected columns/scopes, and native save dialogs.
- Added summaries, themes, recent-file reload, local activity, and menu shortcuts.
- Added sandboxed renderer boundaries and parser/export/storage/browser tests.

The initial baseline matched duplicates by SSN or owner+DOB. The unreleased
follow-up intentionally replaces that rule with owner+DOB+DOD.
