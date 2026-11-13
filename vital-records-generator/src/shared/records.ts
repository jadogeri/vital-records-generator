export const columns = ['ssn', 'owner', 'rescode', 'address', 'city', 'dob', 'dod', 'sex', 'age'] as const
export type Column = typeof columns[number]
export const labels: Record<Column, string> = {
  ssn: 'SSN', owner: 'Owner', rescode: 'RESCODE', address: 'Address',
  city: 'City', dob: 'DOB', dod: 'DOD', sex: 'Sex', age: 'Age'
}
export type VitalRow = Record<Column, string> & { id: string; source: string; line: number }
export type Issue = { source: string; line: number; message: string }
export type Layout = { name: string; mode: 'auto' | 'fixed' | 'comma' | 'tab' | 'pipe'; widths?: number[] }
export const defaultLayout: Layout = { name: 'Auto-detect', mode: 'auto' }
export type InputFile = { name: string; text: string; path?: string }
export type RecentFile = { name: string; path: string; importedAt: string }
export type Activity = { at: string; action: string; detail: string }
export type ExportFormat = 'xlsx' | 'csv' | 'json' | 'pdf'
export type DesktopAPI = {
  getAppVersion(): Promise<string>
  openFiles(): Promise<InputFile[]>
  openDroppedFiles(files: File[]): Promise<InputFile[]>
  recentFiles(): Promise<RecentFile[]>
  reloadFile(path: string): Promise<InputFile | null>
  removeRecentFile(path: string): Promise<RecentFile[]>
  clearRecentFiles(): Promise<RecentFile[]>
  saveFile(name: string, format: ExportFormat, bytes: number[]): Promise<boolean>
  activity(): Promise<Activity[]>
  logActivity(action: string, detail: string): Promise<void>
  onCommand(callback: (command: string) => void): () => void
}

export function titleCase(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase().replace(/(^|[\s,'’-])\p{L}/gu, c => c.toLocaleUpperCase())
}

export function normalizeValue(column: Column, value: string): string {
  const clean = value.trim().replace(/\s+/g, ' ')
  if (['owner', 'address', 'city'].includes(column)) return titleCase(clean)
  if (column === 'ssn') {
    const digits = clean.replace(/[-\s]/g, '')
    return /^\d{9}$/.test(digits) ? `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}` : clean
  }
  if (column === 'sex' || column === 'rescode') return clean.toUpperCase()
  if (column === 'dob' || column === 'dod') return parseDate(clean) ?? clean
  return clean
}

// Unambiguous supported forms: MMDDYYYY, M/D/YYYY, YYYY-MM-DD, D-MMM-YYYY.
export function parseDate(input: string): string | null {
  let year: number, month: number, day: number
  let m: RegExpMatchArray | null
  if ((m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
    [, year, month, day] = m.map(Number)
  } else if ((m = input.match(/^(\d{2})(\d{2})(\d{4})$/)) || (m = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) {
    month = +m[1]; day = +m[2]; year = +m[3]
  } else if ((m = input.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/))) {
    day = +m[1]; month = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(m[2].toLowerCase()) + 1; year = +m[3]
  } else return null
  if (year < 1 || month < 1 || month > 12 || day < 1) return null
  const days = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31,30,31,30,31,31,30,31,30,31]
  if (day > days[month - 1]) return null
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function validateRow(row: VitalRow): Partial<Record<Column, string>> {
  const errors: Partial<Record<Column, string>> = {}
  if (!/^\d{3}-\d{2}-\d{4}$/.test(row.ssn)) errors.ssn = 'SSN must contain exactly nine digits'
  if (!row.owner) errors.owner = 'Owner is required'
  if (!parseDate(row.dob)) errors.dob = 'Invalid birth date'
  if (!parseDate(row.dod)) errors.dod = 'Invalid death date'
  if (!errors.dob && !errors.dod && row.dod < row.dob) errors.dod = 'Death date is before birth date'
  if (!/^\d{1,3}$/.test(row.age) || +row.age > 130) errors.age = 'Age must be between 0 and 130'
  return errors
}

export function makeRow(values: string[], source: string, line: number): VitalRow {
  return { ...Object.fromEntries(columns.map((key, i) => [key, normalizeValue(key, values[i] ?? '')])),
    id: crypto.randomUUID(), source, line } as VitalRow
}

type TextRow = { values: string[]; line: number }
// Stateful CSV reader handles escaped quotes, embedded delimiters/newlines, and physical line numbers.
export function readDelimited(text: string, delimiter: string): { rows: TextRow[]; errors: { line: number; message: string }[] } {
  const rows: TextRow[] = [], errors: { line: number; message: string }[] = []
  let values: string[] = [], value = '', quoted = false, afterQuote = false, invalid = false, line = 1, start = 1
  const finish = () => {
    values.push(value)
    if (invalid) errors.push({ line: start, message: 'Malformed quoted row; skipped' })
    else if (values.some(v => v.trim())) rows.push({ values, line: start })
    values = []; value = ''; afterQuote = false; invalid = false
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++ }
      else if (quoted) { quoted = false; afterQuote = true }
      else if (!value && !afterQuote) quoted = true
      else invalid = true
    } else if (c === delimiter && !quoted) {
      values.push(value); value = ''; afterQuote = false
    } else if (c === '\n') {
      if (quoted) value += '\n'
      else { finish(); start = line + 1 }
      line++
    } else {
      if (afterQuote && c.trim()) invalid = true
      if (!afterQuote) value += c
    }
  }
  if (quoted) errors.push({ line: start, message: 'Unclosed quoted field; skipped' })
  else if (value || values.length || invalid) finish()
  return { rows, errors }
}

export function parseFile(file: InputFile, layout: Layout = defaultLayout): { records: VitalRow[]; issues: Issue[] } {
  const text = file.text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  let mode = layout.mode
  if (mode === 'auto') {
    const first = text.split('\n').find(s => s.trim()) ?? ''
    // Fixed files start with a nine digit SSN followed by the owner field.
    mode = /^\d{9}[^,|\t]/.test(first) && first.length >= 98 ? 'fixed'
      : first.includes('\t') ? 'tab' : first.includes('|') ? 'pipe' : first.includes(',') ? 'comma' : 'fixed'
  }
  const records: VitalRow[] = [], issues: Issue[] = []
  const add = (values: string[], line: number) => {
    if (values.length !== columns.length) {
      issues.push({ source: file.name, line, message: `Expected 9 fields, received ${values.length}; skipped` }); return
    }
    const row = makeRow(values, file.name, line)
    records.push(row)
    const errors = Object.entries(validateRow(row))
    if (errors.length) issues.push({ source: file.name, line, message: errors.map(([key, error]) => `${labels[key as Column]}: ${error}`).join('; ') })
  }
  if (mode === 'fixed') {
    const widths = layout.widths
    if (widths && (widths.length !== 9 || widths.some(n => !Number.isInteger(n) || n < 1 || n > 1000))) throw new Error('A fixed-width profile needs nine positive widths (at most 1000 each).')
    text.split('\n').forEach((line, i) => {
      if (!line.trim()) return
      if (widths) {
        if (line.length !== widths.reduce((a, b) => a + b, 0)) { issues.push({ source: file.name, line: i + 1, message: 'Line length does not match profile; skipped' }); return }
        let offset = 0
        add(widths.map(width => { const v = line.slice(offset, offset + width); offset += width; return v }), i + 1)
      } else {
        if (line.length < 98) { issues.push({ source: file.name, line: i + 1, message: 'Fixed-width row is shorter than 98 characters; skipped' }); return }
        add([line.slice(0,9), line.slice(9,36), line.slice(36,39), line.slice(39,61), line.slice(61,78),
          line.slice(-20,-12), line.slice(-12,-4), line.slice(-4,-3), line.slice(-3)], i + 1)
      }
    })
  } else {
    const parsed = readDelimited(text, mode === 'comma' ? ',' : mode === 'tab' ? '\t' : '|')
    issues.push(...parsed.errors.map(error => ({ source: file.name, ...error })))
    let order: number[] | undefined
    parsed.rows.forEach(({ values, line }, i) => {
      const headers = values.map(v => v.trim().toLowerCase())
      if (i === 0 && columns.every(c => headers.includes(c))) {
        order = columns.map(c => headers.indexOf(c)); return
      }
      // Exports add source provenance. Header-based inputs accept it on re-import.
      add(order ? order.map(index => values[index] ?? '') : values, line)
    })
  }
  return { records, issues }
}

export function duplicateGroups(records: VitalRow[]): VitalRow[][] {
  const parent = records.map((_, i) => i), seen = new Map<string, number>()
  const root = (i: number): number => {
    while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i] }
    return i
  }
  records.forEach((r, i) => {
    const keys: string[] = []
    const owner = titleCase(r.owner).toLocaleLowerCase()
    const dob = parseDate(r.dob), dod = parseDate(r.dod)
    // All three identity fields must be present and valid. SSN alone is not a match.
    if (owner && dob && dod && dod >= dob) keys.push(JSON.stringify([owner, dob, dod]))
    keys.forEach(key => { const other = seen.get(key); if (other !== undefined) parent[root(i)] = root(other); else seen.set(key, i) })
  })
  const groups = new Map<number, VitalRow[]>()
  records.forEach((record, i) => {
    const key = root(i), group = groups.get(key)
    if (group) group.push(record)
    else groups.set(key, [record])
  })
  return [...groups.values()].filter(group => group.length > 1)
}

export function mergeDuplicates(records: VitalRow[]): VitalRow[] {
  const groups = duplicateGroups(records), removed = new Set<string>(), replacements = new Map<string, VitalRow>()
  groups.forEach(group => {
    const merged = { ...group[0] }
    columns.forEach(key => { merged[key] = group.find(r => r[key])?.[key] ?? '' })
    merged.source = [...new Set(group.map(r => r.source))].join('; ')
    group.slice(1).forEach(r => removed.add(r.id))
    replacements.set(merged.id, merged)
  })
  return records.filter(r => !removed.has(r.id)).map(r => replacements.get(r.id) ?? r)
}

export type Filters = { search: string; city: string; rescode: string; sex: string; age: string; month: string }
export const emptyFilters: Filters = { search: '', city: '', rescode: '', sex: '', age: '', month: '' }
export function filterRecords(records: VitalRow[], filters: Filters): VitalRow[] {
  const search = filters.search.trim().toLowerCase()
  return records.filter(r => (!search || columns.some(c => r[c].toLowerCase().includes(search) ||
    (c === 'ssn' && r[c].replace(/-/g, '').includes(search.replace(/-/g, '')))))
    && (!filters.city || r.city === filters.city) && (!filters.rescode || r.rescode === filters.rescode)
    && (!filters.sex || r.sex === filters.sex)
    && (!filters.age || (/^\d+$/.test(r.age) && (filters.age === '65+' ? +r.age >= 65 : filters.age === 'under18' ? +r.age < 18 : +r.age >= 18 && +r.age < 65)))
    && (!filters.month || r.dod.slice(5, 7) === filters.month))
}

export function projectRows(records: VitalRow[], selected: Column[], mask: boolean): Record<string, string>[] {
  return records.map(r => ({
    ...Object.fromEntries(selected.map(key => [labels[key], key === 'ssn' && mask ? maskSSN(r.ssn) : r[key]])),
    Source: r.source
  }))
}
export function maskSSN(value: string): string { return `***-**-${value.replace(/\D/g, '').slice(-4).padStart(4, '*')}` }
export function safeSpreadsheetValue(value: string): string {
  return /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value
}
export function toCSV(rows: Record<string, string>[], headers: string[]): string {
  const quote = (s: string) => `"${safeSpreadsheetValue(s).replace(/"/g, '""')}"`
  return '\uFEFF' + [headers.map(quote).join(','), ...rows.map(r => headers.map(h => quote(r[h] ?? '')).join(','))].join('\r\n')
}
