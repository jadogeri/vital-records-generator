# Security and privacy

This app processes personal data locally. Local processing and masking reduce
exposure but do not constitute encryption, identity verification, or a regulatory
compliance guarantee.

## Data handling

- Raw record contents are held in renderer memory, not deliberately persisted as
  a record database. Operating-system memory, swap, crash dumps, and backups are
  outside this guarantee.
- Source files and exported reports remain on disk under the user's control.
  Deleting workspace rows or forgetting history does not erase those files.
- Theme, masking, output filename, and input profiles persist in local storage.
- Recent paths and activity persist unencrypted in `activity-v2.json` inside
  Electron's user-data directory. Paths, names, and event metadata may be sensitive.
- Activity avoids complete record values. The issue log includes filename, line
  number, and validation messages, not the raw row.
- The app uses no application backend or CDN assets. Dependency installation and
  browser-runtime downloads may still use the network during development.

SSNs are masked by default in preview and exports. Full-SSN exports ask for
confirmation. Names, addresses, dates, and source filenames remain personal data
even in masked reports. Use approved storage, access controls, backup policies,
and retention procedures for both inputs and outputs.

## Implemented protections

The renderer is sandboxed and context-isolated, with Node integration disabled.
A narrow preload API handles native operations. External navigation/window
opening is blocked, and the renderer has a Content Security Policy.
Import extensions/size and export payloads are checked in main. History reload
is restricted to remembered paths. Spreadsheet formula prefixes are neutralized
in CSV/Excel text fields.

These controls do not replace dependency review, endpoint security, encryption,
or testing on the operating systems where the app will be used. Developer tools
are available through the native menu; someone with access to the running app
and device must be treated as having access to its data.

## Reporting a vulnerability

Contact the repository maintainer privately using an approved organizational
channel. If private vulnerability reporting is enabled for the repository,
use GitHub's private reporting flow. Do not put real records, SSNs, sensitive
filenames, credentials, or full exports in public issues or pull requests.

Provide a minimal synthetic reproduction, affected version/commit, operating
system, and impact. There is no published response-time or support-version
commitment in this repository.

## Distribution and policy

Keep Electron and dependencies reviewed and up to date; review native package
signing and installer behavior before distributing. The repository currently
has no license file granting reuse rights. The in-app copyright notice is not
an open-source license; licensing must be decided by the rights holder.
