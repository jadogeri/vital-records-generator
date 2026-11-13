# Vital Records Generator · Version 2

A local-first Electron + Vite records workspace for the Orleans Parish Assessor’s Office.
The implementation follows [`VERSION2.txt`](VERSION2.txt).

## Documentation

The repository root contains this guide and the requirements. The application
and its `package.json` live in the nested `vital-records-generator/` directory.
Use this canonical `README.md` spelling; do not create a second case-only
`READMe.md` file on Windows or other case-insensitive filesystems.

- [Application quick start](vital-records-generator/README.md)
- [User guide](docs/USER_GUIDE.md): importing, reviewing, exporting, and file history.
- [Input formats](docs/DATA_FORMATS.md): field order, dates, layouts, and validation.
- [Architecture](docs/ARCHITECTURE.md): Electron processes, IPC, state, and exports.
- [Testing and desktop checklist](docs/TESTING.md)
- [Contributing](CONTRIBUTING.md) and [security/privacy guidance](SECURITY.md)
- [Changelog](CHANGELOG.md)
- [Cleanup review](TO_DELETE.txt): unused-file candidates; nothing is deleted.

## Run and verify

```sh
cd vital-records-generator
npm ci
npm run dev
```

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:ui
npm run build
npm run build:win
```

Run these commands from the application directory, not the repository root.
`npm run build:win` builds Windows packages using electron-builder; use a Windows
machine for the target-OS smoke test. Native toolchain or signing configuration
may be required for your distribution environment. Build artifacts go to `out/`;
installer output goes to `dist/`. Neither belongs in source control.

Node 22+ is recommended. Browser tests use Playwright's Chromium; `CHROMIUM_PATH`
can point to a compatible existing Chromium executable. `vite.preview.config.ts`
serves the renderer for tests only. Electron uses the existing `electron.vite.config.ts`.

## Version 2 coverage

| Requirements | Implementation |
| --- | --- |
| 1–5 · validation | Duplicate groups require normalized owner+DOB+DOD together, with valid birth/death dates; SSN alone does not match; explicit merge confirmation; invalid-cell highlighting; whitespace, title case, dates, SSN normalization; privacy masking in preview and every report; downloadable issues with physical source line numbers. |
| 6–10 · table | Global search; combined CITY, RESCODE, SEX, age and death-month filters; double-click/Enter editing; delete and add rows; sortable columns; 25/50/100-row pagination. |
| 11–14 · imports | Multiple dropped/opened TXT/CSV files; source tracking; auto or explicit comma/tab/pipe/legacy fixed-width layouts; saved sequential custom-width profiles; BOM, CRLF/LF/CR support; last 10 native files with reload. |
| 15–19 · exports | Paginated PDF with header/timestamp/count; selectable columns; all/filtered scope; styled Excel with frozen header, auto-width, actual date cells, zebra stripes and filters; native save dialog for every format. |
| 20–23 · desktop | Summary cards plus sex/city/RESCODE counts; persistent local activity; light/dark/high-contrast themes; native application menu and Cmd/Ctrl+O/S/F. |
| 24–28 · polish/tests | Persisted theme, filename, profiles and privacy setting; reduced-motion-aware processing indicator; JSON export with generation metadata, selected columns, masking flag and sources; designated `tests` directory with parser, export, storage and UI tests. |

## Input and review behavior

- Default fixed-width retains the original parser's offsets: SSN `[0,9)`, owner
  `[9,36)`, RESCODE `[36,39)`, address `[39,61)`, city `[61,78)`; the final 20
  characters contain DOB (8), DOD (8), sex (1), age (3). Extra middle padding
  remains supported. Rows shorter than 98 characters are skipped.
- Custom profiles specify **nine sequential widths**, in the displayed column
  order, without gaps. Profile widths must exactly match each line length.
- Delimited inputs without headers use `ssn,owner,rescode,address,city,dob,dod,sex,age`.
  Named headers can be reordered; a source column from exports is accepted.
  Dates support MMDDYYYY, M/D/YYYY, YYYY-MM-DD and D-MMM-YYYY.
- Quoted CSV supports delimiters, doubled quotes and embedded newlines. Logs
  report the record's starting physical line, not its preview row number.
- Malformed row structure is skipped; invalid field values remain editable and
  flagged. Fixing a cell updates validation. SSN editing is disabled while masked.
- Import appends to the workspace. Clear removes in-memory rows, not original
  files. Reload reads the current source file and appends it; duplicates are flagged.
- Duplicate merge keeps the first nonempty value per field, retains first values
  on conflicts, combines source filenames, and requires confirmation. It has no undo.
- Duplicate matching requires all three fields: owner, DOB, and DOD. Owner matching
  ignores case and repeated spaces; supported dates are normalized before comparison.
  Missing/invalid dates and death before birth do not produce matches. SSN alone
  (or owner+DOB without a matching DOD) is no longer considered a duplicate.
- Recent files has a Remove button beside Reload and a confirmed Clear all file
  history action for all remembered TXT/CSV entries. These forget history only:
  source files, loaded records, and activity events remain unchanged. Re-importing
  a removed file adds it to history again.
- City/RESCODE summaries show the top four of each to keep the compact UI usable;
  all cities and codes remain available in filters.

## Privacy and storage

SSNs default to masked. A full-SSN export requires confirmation. Masking applies
to Excel, CSV, PDF and JSON; source filename is always included. Exporting with
remaining issues or duplicate groups also requires confirmation.

Record contents exist only in memory. Theme, privacy toggle, output filename and
layout profiles persist in renderer local storage. Recent file paths and up to
200 activity events persist atomically in `activity-v2.json` inside Electron's
user-data directory; activity contains counts/metadata, not record field values.
No cloud connection or CDN assets are used. CSV text is escaped and spreadsheet
formula prefixes are neutralized. The renderer is sandboxed with context isolation,
no Node integration, a limited preload bridge, and blocked external navigation.
Local history is not encrypted; source files and exported reports remain the user's
responsibility. Imports are limited to 25 MB per file, and export IPC to 100 MB.

## Window dimensions and layout

The existing `BrowserWindow` sizing rules are unchanged: default width
`Math.min(1000, screenWidth)`, height `Math.min(800, screenHeight)`, minimum
600×500, existing screen-based maximums, centered and resizable. The preview
table scrolls horizontally and vertically inside a bounded, keyboard-focusable
region, with sticky column headers and visible scrollbars. Its panel cannot shrink
and clip the controls. First/previous/next/last pagination supports 25/50/100 rows
per page and resets appropriately when filtering or changing page size. The
workspace scrolls vertically inside the original window rather than increasing
its dimensions. A persistent footer includes the existing office copyright notice.

## Verification boundary

Unit tests verify parsing, normalization, strict dates, duplicate merging,
filters, masking, formula-safe CSV, actual Excel structure, JSON metadata, PDF
generation, and concurrent local-history writes. Browser tests cover the renderer.
Native Electron dialogs, operating-system menus, and the Windows installer
still require a desktop smoke test on the target OS; a browser preview does not
prove those operating-system interactions.
