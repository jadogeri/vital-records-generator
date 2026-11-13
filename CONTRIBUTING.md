# Contributing

## Local workflow

1. Create a focused branch from the appropriate current base.
2. Install/run the nested application as described in the [quick start](vital-records-generator/README.md).
3. Make the change and add regression coverage for changed behavior.
4. Run the [verification checks](docs/TESTING.md) sequentially.
5. Open a pull request describing the behavior, tests run, and remaining limits.

Do not commit `node_modules/`, `out/`, `dist/`, test reports, local environment
files, or real imported/exported records. Commit intentional lockfile changes
with dependency changes. Use synthetic, obviously non-real data in fixtures.

## Design and engineering rules

- Preserve existing Electron window dimensions unless a change is explicitly
  requested. Fix overflow in content/table layout instead.
- Keep filesystem access and native dialogs in main; expose narrowly typed
  methods through preload. Update channel names, API types, main, and preload
  together when changing IPC.
- Keep parsing/validation in `src/shared/records.ts` so it can be unit-tested.
- Duplicate identity is owner + DOB + DOD, not SSN alone.
- Keep SSN masking consistent across preview and every export.
- Never log complete row values. Filenames and paths still require care.
- History removal must not delete source files or clear loaded records.
- Keep assets local; do not reintroduce CDN styling for the desktop UI.

## Documentation

Maintain the canonical root `README.md` and link detailed guidance from it.
Do not add another file differing only by filename case. Update the user guide,
format specification, architecture, and changelog when behavior changes.

Keep [TO_DELETE.txt](TO_DELETE.txt) evidence-based. An import from an abandoned
component is not evidence of active application use, but a test, build tool,
configuration convention, or type declaration can be essential without a
renderer import. List cleanup candidates; do not remove them without approval.

## Pull request checklist

- Explain what changed and why.
- Include regression tests and accurate verification results.
- Distinguish browser checks from native Electron/installer checks.
- Describe privacy/security impact and any destructive action.
- Confirm no secrets or real personal records were committed.
- Leave merges, publishing, signing, and production distribution to an approved
  release step.
