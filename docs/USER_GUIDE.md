# User guide

## Import records

1. Select **Import files**, **Browse files**, or drop multiple TXT/CSV files.
2. Use Auto-detect, an explicit comma/tab/pipe layout, or legacy fixed-width.
3. For a different fixed-width layout, create a named profile under
   **Layout profiles**, then select it before importing.

Each file is limited to 25 MB. Imports append to the current workspace, rather
than replacing it. Source filename and physical line numbers are retained for
review. See [data formats](DATA_FORMATS.md) for exact fields and layouts.

## Review and edit

- Search across record fields; combine city, RESCODE, sex, age, and death-month
  filters. SSN search also accepts digits without hyphens.
- Click a column header to sort. Select 25, 50, or 100 rows per page and use
  first/previous/next/last controls below the table.
- Scroll inside the table horizontally to reach all columns and row actions,
  or vertically for more rows. Focus the scroll region to use keyboard scrolling.
  The surrounding workspace also scrolls when the window is small.
- Double-click a cell, or focus it and press Enter, to edit. Enter/blur commits;
  Escape cancels the edit. SSN editing is locked while SSNs are masked.
- **Add row** creates a manual record. Missing or invalid fields remain flagged.
- Delete removes a row from memory after confirmation. **Clear** removes all
  loaded rows and import issues; neither action changes the original files.

**Validation issues** lists invalid fields and skipped lines. Download the full
issue log when needed; the on-screen issue list is capped at 500 entries.
The log omits raw row contents but includes filenames and validation messages.

## Duplicate records

A duplicate requires matching **Owner + DOB + DOD together**. Owner comparison
ignores case and repeated whitespace; supported date formats are normalized.
All three fields must be present, both dates valid, and death not before birth.
SSN alone does not identify a duplicate.

Review highlighted owner/date cells before choosing **Merge duplicates**.
Merging requires confirmation, keeps the first nonempty value per field, keeps
the first imported value on conflicts, and combines source filenames. There is
no undo; re-import original files if you need to reconstruct the workspace.

## Export a report

1. Open **Export** from the Records toolbar.
2. Set the filename, filtered/all loaded rows, format, and included columns.
3. Choose **Save report**, then select a destination in the native save dialog.

Excel, CSV, JSON, and PDF are supported. Source filename is always included.
Excel includes styled/frozen headers and date cells. PDF includes report
metadata and page numbers. JSON includes report/version/timestamp/count/masking
metadata as well as records.

SSNs are masked by default in the preview and every export. Exporting full SSNs
requires confirmation; exporting with validation issues or duplicates also asks
for confirmation. A masked report still contains other personal information.
Save reports only to destinations approved for this data.

## Recent files and activity

**Recent files & activity** remembers the latest 10 files opened or dropped in
Electron. **Reload** reads the file's current contents and appends the records.
It does not replace previously loaded copies.

- **Remove**, beside Reload, forgets one recent-file entry after confirmation.
- **Clear all file history** forgets every remembered TXT/CSV entry after
  confirmation.
- Both preserve source files, loaded records, and the separate activity log.
- Importing a forgotten file adds it to history again.

Activity retains the latest 200 events locally. Neither recent-file removal nor
workspace clearing erases those events. There is currently no activity-log
clear button. Browser-only previews do not remember native file paths and
require files to be selected again.

## Preferences and shortcuts

The theme button cycles light, dark, and high contrast. Theme, SSN masking,
output filename, and layout profiles persist locally. Loaded records do not
survive an app reload or restart; export work before closing.

| Shortcut | Action |
| --- | --- |
| Ctrl/Command + O | Import files. |
| Ctrl/Command + S | Export Excel using current scope/columns and privacy settings. |
| Ctrl/Command + F | Open Records and focus search. |

The footer displays processing state, shortcuts, and the office copyright.
The [security guide](../SECURITY.md) describes local-storage limitations.
