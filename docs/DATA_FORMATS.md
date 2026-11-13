# Record formats and validation

## Fields

Inputs without named headers use this exact order:

| Field | Normalization and checks |
| --- | --- |
| `ssn` | Nine digits become `123-45-6789`; validation requires that structure. |
| `owner` | Trimmed, repeated whitespace collapsed, title-cased; required. |
| `rescode` | Trimmed and uppercased; preserve leading zeros as text. |
| `address` | Trimmed, whitespace collapsed, title-cased. |
| `city` | Trimmed, whitespace collapsed, title-cased. |
| `dob` | Supported calendar date; normalized to `YYYY-MM-DD`. |
| `dod` | Supported calendar date, not before DOB; normalized to `YYYY-MM-DD`. |
| `sex` | Trimmed and uppercased; no code-vocabulary validation. |
| `age` | One to three digits, from 0 through 130. |

The checks validate structure, not government-issued SSN status or a person's
identity. Age is not recomputed from DOB/DOD or checked for consistency with them.

## Delimited inputs

Comma, tab, and pipe separators are supported. Named headers are case-insensitive,
can be reordered, and must include all nine field names above. Additional columns
are ignored in header-based inputs; headerless rows require exactly nine fields.

Synthetic example, not a real person's record:

```csv
ssn,owner,rescode,address,city,dob,dod,sex,age
000000001,EXAMPLE PERSON,001,10 EXAMPLE ST,EXAMPLE CITY,01021940,03042020,F,080
```

Quoted fields support embedded delimiters, doubled quotes, and embedded
newlines. The issue log uses the starting physical line number of each record.
UTF-8 BOM and CRLF, LF, or CR line endings are accepted.

Auto-detection examines the first nonblank line. Choose an explicit format for
ambiguous input, especially when delimiter characters occur inside values.

## Legacy fixed-width

Offsets are zero-based and end-exclusive:

| Field | Slice or tail location | Width |
| --- | --- | --- |
| SSN | `[0, 9)` | 9 |
| Owner | `[9, 36)` | 27 |
| RESCODE | `[36, 39)` | 3 |
| Address | `[39, 61)` | 22 |
| City | `[61, 78)` | 17 |
| DOB | First 8 of final 20 characters | 8 |
| DOD | Next 8 of final 20 characters | 8 |
| Sex | Next character | 1 |
| Age | Final 3 characters | 3 |

Rows shorter than 98 characters are skipped. Legacy parsing allows extra
padding between city and the final 20 characters.

A custom fixed-width profile instead defines **nine sequential positive
integer widths**, each no greater than 1000, in field order. The line length
must equal their sum exactly. A custom profile does not use tail offsets or
allow gaps. The standard sequential widths are `9,27,3,22,17,8,8,1,3`.

## Dates

Accepted unambiguous formats:

- `MMDDYYYY`, for example `01021940`.
- `M/D/YYYY`, for example `1/2/1940`.
- `YYYY-MM-DD`, for example `1940-01-02`.
- `D-MMM-YYYY`, for example `2-Jan-1940`.

Leap years and actual month lengths are checked. Invalid field values remain
editable in the preview; malformed row structure is skipped and logged.

## Duplicates and exports

Duplicate identity is normalized owner plus valid DOB and DOD; matching SSNs
alone do not merge records. See the [user guide](USER_GUIDE.md) for merge behavior.

Exports use display headers (`SSN`, `Owner`, `RESCODE`, `Address`, `City`, `DOB`,
`DOD`, `Sex`, `Age`) and always add `Source`. Selected columns can be omitted,
so not every export can be re-imported as a complete nine-field input. A full
header-based delimited export is structurally accepted on re-import, but masked
SSNs are intentionally not recoverable and will be flagged as invalid SSNs.
Exporting and re-importing also treats the new file as the source.
