# Application quick start

This directory contains the Electron + Vite application. For project features,
requirements coverage, and documentation links, see the [root README](../README.md).

## Requirements

- Node.js 22 or newer is recommended, with npm.
- A graphical desktop for Electron development and native-dialog testing.
- Playwright's compatible Chromium for browser tests.
- A Windows build/test machine for validating the Windows installer.

## Install and run

From the repository root:

```sh
cd vital-records-generator
npm ci
npm run dev
```

Keep `package-lock.json`: `npm ci` uses it for reproducible dependency resolution.
The app does not require an account, backend, API key, or environment secret.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Electron/Vite development app. |
| `npm run typecheck` | Check main/preload/shared and renderer/test TypeScript. |
| `npm test` | Run parser, validation, export, and local-storage unit tests. |
| `npx playwright install chromium` | Install the matching browser test runtime. |
| `npm run test:ui` | Run the browser-based renderer regression suite. |
| `npm run build` | Build main, preload, and renderer into `out/`. |
| `npm run preview` | Preview the built Electron app. |
| `npm run build:win` | Build the application and Windows packages in `dist/`. |

On memory-constrained machines, run browser tests and production builds
sequentially rather than at the same time.

## Important paths

- `src/main/`: native windows, menus, file dialogs, and metadata persistence.
- `src/preload/`: typed, narrow IPC bridge.
- `src/shared/`: record parsing, normalization, validation, and shared contracts.
- `src/renderer/src/workspace/`: active records interface and report exports.
- `tests/`: unit and browser tests.

The active HTML entry is `src/renderer/index.html`, not `assets/index.html`.
Legacy files awaiting review are listed in [TO_DELETE.txt](../TO_DELETE.txt);
their presence does not make them part of the running application.

See [testing](../docs/TESTING.md), [input formats](../docs/DATA_FORMATS.md),
and [privacy guidance](../SECURITY.md) before using real records.
