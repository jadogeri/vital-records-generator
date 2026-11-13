# Architecture

## Repository layout

```text
README.md / VERSION2.txt / TO_DELETE.txt
docs/                         User and engineering documentation
vital-records-generator/       Application package root
  electron.vite.config.ts      Electron build configuration
  src/main/                   Native process and local metadata store
  src/preload/                Context-isolated renderer bridge
  src/shared/                 Types, channels, parser, validation
  src/renderer/index.html     Active renderer HTML entry
  src/renderer/src/
    main.tsx -> App.tsx -> workspace/Workspace.tsx
    workspace/exports.ts      Report builders and save adapter
    views/Team.tsx            Existing team view
    components/CopyRightNotice.tsx
  tests/                      Unit tests and Playwright tests
```

Some legacy components and static assets remain tracked but are outside the
active entry-point graph. [TO_DELETE.txt](../TO_DELETE.txt) documents candidates;
it is a review list, not permission to remove files automatically.

## Process responsibilities

**Main** (`src/main/index.ts`) creates the window, native menus and dialogs.
It checks file extensions/size, reads UTF-8 input, writes exports, and dispatches
history operations. `storage.ts` serializes metadata updates and writes a
temporary file before renaming it to `activity-v2.json`.

**Preload** exposes only the `DesktopAPI` methods through `contextBridge`.
`contextIsolation` and the renderer sandbox are enabled; Node integration is
disabled. Dropped browser `File` objects are converted to native paths here,
not by arbitrary renderer filesystem access.

**Renderer** holds imported records in React state. Shared pure functions parse,
normalize, validate, filter, group duplicates, and create masked projections.
The workspace owns table editing, pagination, filters, preferences, and
confirmation prompts. A separate CSS override file prevents flex shrinking
from clipping the preview panel's table or pagination.

## IPC contract

Channel names live in `src/shared/channels.ts`; method signatures live in
`DesktopAPI` in `src/shared/records.ts`.

| API area | Behavior |
| --- | --- |
| `openFiles`, `openDroppedFiles` | Read allowed TXT/CSV files; remember paths. |
| `recentFiles`, `reloadFile` | List metadata; reload only a remembered path. |
| `removeRecentFile`, `clearRecentFiles` | Forget metadata without touching source files. |
| `saveFile` | Validate format/byte payload and use the native save dialog. |
| `activity`, `logActivity` | Read/write bounded local event metadata. |
| `onCommand` | Subscribe to native menu commands, returning an unsubscribe function. |
| `getAppVersion` | Read the packaged app version. |

Limits are 25 MB per imported file and 100 MB per export IPC payload. Dropped-file
batches are limited to 100 paths. Recent files retain 10 entries; activity retains
200 entries. Updates share a serialized queue to prevent lost metadata writes.

## State and privacy

- Records and skipped-line issues: renderer memory only.
- Theme, masking, filename, and input profiles: renderer local storage.
- Recent paths and activity metadata: Electron user-data directory.
- Inputs and saved reports: files chosen by the user.

History does not contain complete rows, but filenames and paths can still be
sensitive. Local metadata is not encrypted. See [SECURITY.md](../SECURITY.md).

## Export pipeline

`exports.ts` projects selected columns and masking, always includes source,
and emits CSV/JSON or dynamically imports ExcelJS/jsPDF for workbook/PDF output.
Spreadsheet text is protected against formula prefixes. Native Electron uses
the save IPC method; browser development previews use a download fallback.

## Window and build invariants

Default dimensions remain `min(1000, screenWidth)` by `min(800, screenHeight)`;
minimum dimensions remain 600×500. Maximum dimensions remain screen width / 1.5
and screen height. Centering and resizability are unchanged.

Do not alter window sizing to fix content overflow. Keep scrolling inside the
workspace/table and verify at the minimum size.

Electron/Vite emits `out/main`, `out/preload`, and `out/renderer`.
electron-builder packages `out/**/*` and `package.json`; Windows packages go to
`dist/`. The separate Vite preview config serves only the renderer for tests.
