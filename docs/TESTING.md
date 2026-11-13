# Testing and release checks

Run commands from the nested `vital-records-generator/` application directory.
Install dependencies with `npm ci` first.

## Automated checks

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:ui
npm run build
```

Run the browser tests and build sequentially on limited-memory machines.
`CHROMIUM_PATH` may point to a compatible local Chromium executable; otherwise
Playwright uses its managed browser. Linux machines may also need browser OS
dependencies. The renderer test server uses port 4173 through
`vite.preview.config.ts`; it is not the native Electron app.

| Layer | Coverage |
| --- | --- |
| TypeScript | Main/preload/shared modules; renderer and tests. |
| Unit tests | Fixed/delimited parsing, line endings/line numbers, dates, normalization, duplicates, filters, masking, spreadsheet safety, export structures, and local history. |
| Browser tests | Import/edit/filter/add/export/theme; minimum-window containment; horizontal/vertical scrolling and pagination; footer; history removal/clear/cancellation/error handling; duplicate merge. |
| Production build | Bundles main, preload, and renderer. Does not launch the packaged app. |

History UI tests use a desktop-API double. Storage unit tests use temporary
files to check persistence and preservation of source files/activity. Neither
alone proves native IPC behavior in a packaged Electron process.

At the documentation update, 32 unit tests, five browser tests, TypeScript checks,
and the production build passed on the follow-up branch. These are recorded
local results, not a claim of configured GitHub CI or a permanent guarantee.

## Native desktop smoke test

Use synthetic records, never real SSNs in test fixtures or screenshots.

- Launch the native app and confirm the existing default and 600×500 layout.
- Open several TXT/CSV files with the native picker and through drag/drop.
- Check malformed inputs, skipped-line logs, and the 25 MB per-file limit.
- Scroll to the last column and last row of a full page; navigate all page controls.
- Check editing, deletion, manual rows, and owner+DOB+DOD duplicate merging.
- Save Excel/CSV/JSON/PDF with native dialogs, including cancellation.
- Confirm SSN masking applies to each format and full-SSN export asks permission.
- Reload a remembered file; remove one entry; restart to verify it stays removed.
- Clear all file history; verify original files, loaded records, and activity remain.
- Check import/export/find menu shortcuts and theme/preference persistence.
- Confirm footer copyright is visible and app restart does not restore loaded rows.

## Windows distribution

```sh
npm run build:win
```

Review output in `dist/` on the target Windows machine. Check install, launch,
native dialogs, file permissions, and uninstall. Code-signing and release
publication are separate distribution decisions; the current scripts do not
establish that a signed installer has been produced.

## Before removing cleanup candidates

Re-check references against the current branch before applying
[TO_DELETE.txt](../TO_DELETE.txt). Some candidates depend on other candidates:
remove an orphaned component chain consistently, not just its imported helper.
Then rerun type checks, unit/browser tests, production build, and a native smoke
test. Do not delete configuration, declaration files, dependencies, or lockfiles
merely because they do not appear in a renderer import graph.
