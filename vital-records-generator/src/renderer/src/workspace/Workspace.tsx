import { useEffect, useMemo, useRef, useState } from 'react'
import { columns, labels, defaultLayout, parseFile, validateRow, duplicateGroups, mergeDuplicates,
  filterRecords, emptyFilters, normalizeValue, makeRow, maskSSN, toCSV } from '../../../shared/records'
import type { Activity, Column, ExportFormat, Filters, InputFile, Issue, Layout, RecentFile, VitalRow } from '../../../shared/records'
import { allColumns, buildExport, saveBytes } from './exports'
import Team from '../views/Team'
import CopyrightNotice from '../components/CopyRightNotice'

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
    upload:'M12 16V3m-5 5 5-5 5 5M4 16v4h16v-4',
    download:'M12 3v13m-5-5 5 5 5-5M4 16v4h16v-4',
    search:'M21 21l-6-6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
    shield:'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7zM8 12l3 3 5-6',
    clock:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    settings:'M4 7h16M4 17h16M9 4v6M15 14v6',
    eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    plus:'M12 5v14M5 12h14', trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
    sun:'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2',
    check:'M5 12l4 4L19 6', alert:'M12 3 2 21h20zM12 9v5M12 17v1',
    people:'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3M13 5a4 4 0 1 1-8 0 4 4 0 0 1 8 0M22 21v-3a4 4 0 0 0-4-4M17 2a4 4 0 0 1 0 8',
    spark:'M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z'
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] ?? paths.file}/></svg>
}
function readPreference<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(`vital-v2:${key}`) ?? 'null') ?? fallback } catch { return fallback }
}
function usePreference<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readPreference(key, initial))
  useEffect(() => { try { localStorage.setItem(`vital-v2:${key}`, JSON.stringify(value)) } catch { /* Storage can be disabled. */ } }, [key, value])
  return [value, setValue] as const
}
const delay = () => new Promise(resolve => setTimeout(resolve, 25))
const formatTime = (value: string) => new Date(value).toLocaleString()

function EditableCell({ row, column, mask, onEdit, duplicate }: {
  row: VitalRow; column: Column; mask: boolean; onEdit: (id: string, column: Column, value: string) => void; duplicate: boolean
}) {
  const [editing, setEditing] = useState(false), [draft, setDraft] = useState('')
  const cancelled = useRef(false)
  const error = validateRow(row)[column]
  const locked = mask && column === 'ssn'
  const edit = () => { if (!locked) { cancelled.current = false; setDraft(row[column]); setEditing(true) } }
  const commit = () => { if (!cancelled.current) onEdit(row.id, column, draft); setEditing(false) }
  return <td className={`${column === 'owner' ? 'owner' : ''} ${error ? 'invalid' : duplicate && ['owner','dob','dod'].includes(column) ? 'duplicate' : ''}`}
    title={error ?? (locked ? 'Unmask SSNs to edit this field' : 'Double-click or press Enter to edit')}
    onDoubleClick={edit} tabIndex={0} onKeyDown={event => { if (!editing && event.key === 'Enter') edit() }}>
    {editing ? <input autoFocus aria-label={`Edit ${labels[column]}`} value={draft} onChange={e => setDraft(e.target.value)}
      onBlur={commit} onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') { cancelled.current = true; setEditing(false) }
      }}/> : locked ? maskSSN(row.ssn) : row[column] || '—'}
  </td>
}

export default function Workspace() {
  const [records, setRecords] = useState<VitalRow[]>([])
  const [skipped, setSkipped] = useState<Issue[]>([])
  const [files, setFiles] = useState<string[]>([])
  const [recent, setRecent] = useState<RecentFile[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [tab, setTab] = useState('records')
  const [theme, setTheme] = usePreference<'light'|'dark'|'contrast'>('theme', 'light')
  const [mask, setMask] = usePreference('mask', true)
  const [filename, setFilename] = usePreference('filename', 'vital-records')
  const [profiles, setProfiles] = usePreference<Layout[]>('profiles', [])
  const [layout, setLayout] = useState<Layout>(defaultLayout)
  const [profileName, setProfileName] = useState('')
  const [widths, setWidths] = useState('9,27,3,22,17,8,8,1,3')
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [sort, setSort] = useState<{ column: Column; direction: 1|-1 }>({ column: 'owner', direction: 1 })
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(25)
  const [selected, setSelected] = useState<Column[]>(allColumns)
  const [scope, setScope] = useState('filtered'), [format, setFormat] = useState<ExportFormat>('xlsx')
  const [showExport, setShowExport] = useState(false), [showFilters, setShowFilters] = useState(false)
  const [busy, setBusy] = useState(''), [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const [dragging, setDragging] = useState(false), [manual, setManual] = useState(false)
  const [manualValues, setManualValues] = useState<Record<Column,string>>(() => Object.fromEntries(columns.map(c => [c,''])) as Record<Column,string>)
  const input = useRef<HTMLInputElement>(null), search = useRef<HTMLInputElement>(null)
  const tableScroll = useRef<HTMLDivElement>(null)
  const busyRef = useRef(false), commands = useRef({ open: () => {}, export: () => {} })
  const filtered = useMemo(() => filterRecords(records, filters).sort((a,b) =>
    (sort.column === 'age' ? Number(a.age) - Number(b.age) : a[sort.column].localeCompare(b[sort.column], undefined, { numeric: true })) * sort.direction
  ), [records, filters, sort])
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize)), currentPage = Math.min(page, pages)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const groups = useMemo(() => duplicateGroups(records), [records])
  const duplicateIds = useMemo(() => new Set(groups.flat().map(r => r.id)), [groups])
  const issues = useMemo(() => [...skipped, ...records.flatMap(row => {
    const errors = Object.entries(validateRow(row))
    return errors.length ? [{ source: row.source, line: row.line, message: errors.map(([c, e]) => `${labels[c as Column]}: ${e}`).join('; ') }] : []
  })], [records, skipped])
  const valid = useMemo(() => records.filter(r => Object.keys(validateRow(r)).length === 0).length, [records])
  const stats = useMemo(() => {
    const city: Record<string,number> = {}, rescode: Record<string,number> = {}, sex: Record<string,number> = {}
    const ages: number[] = []
    records.forEach(r => {
      if (r.city) city[r.city] = (city[r.city] ?? 0) + 1
      if (r.rescode) rescode[r.rescode] = (rescode[r.rescode] ?? 0) + 1
      if (r.sex) sex[r.sex] = (sex[r.sex] ?? 0) + 1
      if (/^\d+$/.test(r.age) && +r.age <= 130) ages.push(+r.age)
    })
    return { city, rescode, sex, average: ages.length ? (ages.reduce((a,b) => a+b,0) / ages.length).toFixed(1) : '—' }
  }, [records])
  useEffect(() => { setPage(1) }, [filters, pageSize])
  useEffect(() => { setPage(current => Math.min(current, pages)) }, [pages])
  useEffect(() => { if (tableScroll.current) tableScroll.current.scrollTop = 0 }, [currentPage, pageSize, sort])
  async function log(action: string, detail: string) {
    const entry = { at: new Date().toISOString(), action, detail }
    setActivity(previous => [entry, ...previous].slice(0,200))
    try { await window.api?.logActivity(action, detail) } catch { setMessage({ text: 'Activity could not be saved to local history.', error: true }) }
  }
  async function refreshRecent() { if (window.api) setRecent(await window.api.recentFiles()) }
  async function forgetHistory(file?: RecentFile) {
    if (busyRef.current || !window.api) return
    const prompt = file
      ? `Remove ${file.name} from recent-file history? Your source file and loaded records will not be changed.`
      : 'Clear all recent-file history (TXT and CSV)? Your source files, loaded records, and activity log will not be changed.'
    if (!window.confirm(prompt)) return
    busyRef.current = true; setBusy('Updating file history')
    try {
      setRecent(file ? await window.api.removeRecentFile(file.path) : await window.api.clearRecentFiles())
      setMessage({ text: file ? `${file.name} removed from history. Source file unchanged.` : 'Recent-file history cleared. Source files unchanged.' })
    } catch { setMessage({ text: 'File history could not be updated. Please try again.', error: true }) }
    finally { busyRef.current = false; setBusy('') }
  }
  useEffect(() => {
    if (window.api) Promise.all([window.api.recentFiles(), window.api.activity()]).then(([r,a]) => {
      setRecent(r); setActivity(a)
    }).catch(() => setMessage({ text: 'Local history could not be loaded.', error: true }))
  }, [])
  async function importFiles(inputs: InputFile[]) {
    if (!inputs.length || busyRef.current) return
    busyRef.current = true; setBusy('Processing records'); setMessage(null)
    try {
      await delay()
      const incoming: VitalRow[] = [], errors: Issue[] = []
      for (const file of inputs) {
        setBusy(`Processing ${file.name}`); await delay()
        const parsed = parseFile(file, layout)
        for (const record of parsed.records) incoming.push(record)
        for (const issue of parsed.issues) if (issue.message.includes('skipped')) errors.push(issue)
        await log('File imported', `${file.name} · ${parsed.records.length} records · ${parsed.issues.length} issues`)
      }
      setRecords(previous => [...previous, ...incoming]); setSkipped(previous => [...previous, ...errors])
      setFiles(previous => [...previous, ...inputs.map(f => f.name)])
      setTab('records'); setPage(1)
      setMessage({ text: `Added ${incoming.length.toLocaleString()} records from ${inputs.length} file(s). ${errors.length} lines skipped.` })
      await refreshRecent()
    } catch (error) { setMessage({ text: error instanceof Error ? error.message : 'Import failed.', error: true }) }
    finally { busyRef.current = false; setBusy('') }
  }
  async function openFiles() {
    if (busyRef.current) return
    try {
      if (window.api) await importFiles(await window.api.openFiles())
      else input.current?.click()
    } catch (error) { setMessage({ text: String(error), error: true }) }
  }
  async function browserFiles(selectedFiles: File[]) {
    if (busyRef.current) return
    try {
      if (selectedFiles.some(f => !/\.(txt|csv)$/i.test(f.name))) throw new Error('Choose only .txt or .csv files.')
      if (selectedFiles.some(f => f.size > 25 * 1024 * 1024)) throw new Error('Each file must be smaller than 25 MB.')
      await importFiles(window.api
        ? await window.api.openDroppedFiles(selectedFiles)
        : await Promise.all(selectedFiles.map(async file => ({ name: file.name, text: await file.text() }))))
    } catch (error) { setMessage({ text: String(error), error: true }) }
    finally { if (input.current) input.current.value = '' }
  }
  async function exportRecords(exportFormat: ExportFormat = format) {
    const rows = scope === 'all' ? records : filtered
    if (busyRef.current || !rows.length || !selected.length) return
    if ((issues.length || groups.length) && !window.confirm(`This workspace has ${issues.length} validation/skipped-line issues and ${groups.length} duplicate groups. Export the selected records anyway?`)) return
    if (!mask && selected.includes('ssn') && !window.confirm('This export will contain full SSNs. Continue only if the destination is trusted.')) return
    busyRef.current = true; setBusy('Preparing export')
    try {
      await delay()
      const bytes = await buildExport(rows, selected, mask, exportFormat)
      const saved = await saveBytes(bytes, filename.trim() || 'vital-records', exportFormat)
      if (saved) {
        await log('Report exported', `${exportFormat.toUpperCase()} · ${rows.length} records · ${mask ? 'SSNs masked' : 'SSNs visible'}`)
        setMessage({ text: `${rows.length.toLocaleString()} records exported as ${exportFormat.toUpperCase()}.` })
      }
    } catch (error) { setMessage({ text: String(error), error: true }) }
    finally { busyRef.current = false; setBusy('') }
  }
  commands.current = { open: openFiles, export: () => { void exportRecords('xlsx') } }
  useEffect(() => {
    const command = (value: string) => {
      if (value === 'open') commands.current.open()
      if (value === 'export') commands.current.export()
      if (value === 'search') { setTab('records'); setTimeout(() => search.current?.focus(), 0) }
    }
    if (window.api) return window.api.onCommand(command)
    const keyboard = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      const key = event.key.toLowerCase(), action = { o: 'open', s: 'export', f: 'search' }[key]
      if (action) { event.preventDefault(); command(action) }
    }
    document.addEventListener('keydown', keyboard)
    return () => document.removeEventListener('keydown', keyboard)
  }, [])
  function updateCell(id: string, column: Column, value: string) {
    const normalized = normalizeValue(column, value)
    if (records.find(r => r.id === id)?.[column] === normalized) return
    setRecords(previous => previous.map(r => r.id === id ? { ...r, [column]: normalized } : r))
    void log('Cell edited', `${labels[column]} field updated`)
  }
  function changeFilter(key: keyof Filters, value: string) { setFilters(previous => ({ ...previous, [key]: value })) }
  function clear() {
    if (!window.confirm('Clear all loaded records and import issues? Your source files will not be changed.')) return
    setRecords([]); setSkipped([]); setFiles([]); setFilters(emptyFilters); setPage(1)
    void log('Workspace cleared', 'Loaded records removed from memory')
  }
  function saveProfile() {
    const parsedWidths = widths.split(',').map(Number)
    if (!profileName.trim()) { setMessage({ text: 'Enter a profile name.', error: true }); return }
    if (layout.mode === 'auto') { setMessage({ text: 'Select a specific input format before saving a profile.', error: true }); return }
    if (layout.mode === 'fixed' && (parsedWidths.length !== 9 || parsedWidths.some(n => !Number.isInteger(n) || n <= 0 || n > 1000))) {
      setMessage({ text: 'Enter nine positive field widths, each at most 1000.', error: true }); return
    }
    const profile: Layout = { name: profileName.trim(), mode: layout.mode, ...(layout.mode === 'fixed' ? { widths: parsedWidths } : {}) }
    setProfiles(previous => [...previous.filter(p => p.name !== profile.name), profile]); setLayout(profile)
    setMessage({ text: `Saved layout profile “${profile.name}”.` })
  }
  async function exportIssues() {
    const csv = toCSV(issues.map(issue => ({ File: issue.source, Line: String(issue.line), Issue: issue.message })), ['File','Line','Issue'])
    try { if (await saveBytes(new TextEncoder().encode(csv), `${filename || 'vital-records'}-issues`, 'csv')) await log('Issue log exported', `${issues.length} issues`) }
    catch (error) { setMessage({ text: String(error), error: true }) }
  }
  return <div className="workspace" data-theme={theme}>
    <aside className="rail" aria-label="Navigation">
      <div className="brand-mark"><Icon name="spark"/></div>
      {[['records','grid','Records'],['history','clock','Recent files & activity'],['issues','shield','Validation issues'],['settings','settings','Layout profiles'],['team','people','Team']].map(([value,icon,label]) =>
        <button key={value} title={label} aria-label={label} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}><Icon name={icon}/></button>)}
      <small>v2.0</small>
    </aside>
    <div className="main">
      <header className="topbar"><div><div className="eyebrow">Orleans Parish Assessor’s Office</div><h1>Vital Records Generator</h1></div>
        <div className="top-actions"><span className="local-badge">Local & private</span>
          <button title={`Theme: ${theme}. Switch theme`} aria-label={`Theme: ${theme}`} onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'contrast' : 'light')}><Icon name="sun"/></button>
          <button className="primary" disabled={!!busy} onClick={openFiles}><Icon name="plus"/>Import files</button>
        </div>
      </header>
      <main className="content">
        <input className="sr-only" ref={input} type="file" accept=".txt,.csv" multiple onChange={e => void browserFiles(Array.from(e.target.files ?? []))}/>
        {message && <div className={`notice ${message.error ? 'error' : ''}`} role={message.error ? 'alert' : 'status'}><Icon name={message.error ? 'alert' : 'check'}/>{message.text}<button aria-label="Dismiss message" onClick={() => setMessage(null)}>×</button></div>}
        {busy && <div role="status" aria-live="polite"><p className="subtle">{busy}…</p><div className="progress"/></div>}
        {tab === 'team' && <Team/>}
        {tab === 'records' && <>
          <div className="intro"><div><h2>Your records, organized.</h2><p className="subtle">Import, review, and export with confidence.</p></div>
            <button onClick={() => setMask(!mask)} title="Mask SSNs in preview and all exports" aria-pressed={mask}><Icon name={mask ? 'shield' : 'eye'}/>{mask ? 'SSNs masked' : 'SSNs visible'}</button></div>
          <section className="stats" aria-label="Record summary">
            {[['Total records',records.length.toLocaleString(),`${files.length} source file${files.length === 1 ? '' : 's'}`,'file'],
              ['Valid records',String(valid),'All required checks passed','check'],
              ['Duplicates',String(duplicateIds.size),`${groups.length} groups to review`,'people'],
              ['Average age',stats.average,'Across loaded records','clock']].map(([label,value,hint,icon],i) =>
              <div className={`stat ${i === 0 ? 'featured' : ''}`} key={label}><div className="stat-head">{label}<Icon name={icon}/></div><strong>{value}</strong><small>{hint}</small></div>)}
          </section>
          <section className={`dropzone ${dragging ? 'dragging' : ''}`} aria-label="File drop area"
            onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); void browserFiles(Array.from(e.dataTransfer.files)) }}>
            <div className="drop-icon"><Icon name="upload"/></div><div className="drop-copy"><strong>Drop your files here</strong><p>TXT or CSV · multiple files · up to 25 MB each</p>
              <div className="import-meta"><label className="sr-only" htmlFor="layout">Input layout</label><select id="layout" value={JSON.stringify(layout)} onChange={e => setLayout(JSON.parse(e.target.value))}>
                {[defaultLayout,{ name:'Legacy fixed-width', mode:'fixed' },{ name:'Comma-separated',mode:'comma' },{ name:'Tab-separated',mode:'tab' },{ name:'Pipe-separated',mode:'pipe' },...profiles].map((p,i) =>
                  <option key={i} value={JSON.stringify(p)}>{p.name}</option>)}</select><button className="text-button" onClick={() => setTab('settings')}>Manage profiles</button></div></div>
            <button onClick={openFiles} disabled={!!busy}>Browse files</button>
          </section>
          <section className="panel">
            <div className="panel-head"><h2>Record preview<span className="badge">{filtered.length.toLocaleString()}</span></h2>
              <div><button className="text-button" onClick={() => setTab('issues')}>{issues.length} issues</button><button className="text-button" onClick={clear} disabled={!records.length && !skipped.length}>Clear</button></div></div>
            <div className="toolbar"><div className="search"><Icon name="search"/><input ref={search} value={filters.search} onChange={e => changeFilter('search', e.target.value)} aria-label="Search records" placeholder="Search name, SSN, city, address…"/></div>
              <button aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}><Icon name="settings"/>Filters</button>
              <button onClick={() => { setManual(true); setManualValues(Object.fromEntries(columns.map(c => [c,''])) as Record<Column,string>) }}><Icon name="plus"/>Add row</button>
              <button className="primary" disabled={!filtered.length || !!busy} onClick={() => setShowExport(!showExport)}><Icon name="download"/>Export</button></div>
            {showFilters && <div className="filters">
              {(['city','rescode','sex'] as const).map(key => <select key={key} aria-label={`Filter ${labels[key]}`} value={filters[key]} onChange={e => changeFilter(key,e.target.value)}>
                <option value="">All {labels[key]}</option>{Object.keys(stats[key]).sort().map(v => <option key={v}>{v}</option>)}</select>)}
              <select aria-label="Filter age" value={filters.age} onChange={e => changeFilter('age',e.target.value)}><option value="">All ages</option><option value="under18">Under 18</option><option value="18-64">18–64</option><option value="65+">65+</option></select>
              <select aria-label="Death month" value={filters.month} onChange={e => changeFilter('month',e.target.value)}><option value="">All death months</option>{Array.from({length:12},(_,i) => <option key={i} value={String(i+1).padStart(2,'0')}>{new Date(2000,i,1).toLocaleString('en',{month:'long'})}</option>)}</select>
              <button className="text-button" onClick={() => setFilters(emptyFilters)}>Reset</button>
            </div>}
            {showExport && <div className="export-settings">
              <label>Filename<input aria-label="Output filename" type="text" value={filename} onChange={e => setFilename(e.target.value)}/></label>
              <label>Rows<select aria-label="Export scope" value={scope} onChange={e => setScope(e.target.value)}><option value="filtered">Filtered ({filtered.length})</option><option value="all">All ({records.length})</option></select></label>
              <label>Format<select aria-label="Export format" value={format} onChange={e => setFormat(e.target.value as ExportFormat)}>{['xlsx','csv','json','pdf'].map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}</select></label>
              <button className="primary" disabled={!!busy || !selected.length || !(scope === 'all' ? records.length : filtered.length)} onClick={() => void exportRecords()}>Save report</button>
              <div className="export-columns" role="group" aria-label="Export columns">{columns.map(c => <label key={c}><input type="checkbox" checked={selected.includes(c)}
                onChange={e => setSelected(previous => e.target.checked ? columns.filter(key => key === c || previous.includes(key)) : previous.filter(key => key !== c))}/>{labels[c]}</label>)}<span className="subtle">Source always included · {mask ? 'SSNs masked' : 'Full SSNs'}</span></div>
            </div>}
            {!!groups.length && <div className="notice"><Icon name="alert"/>{groups.length} duplicate groups found by Owner + DOB + DOD. Merging keeps the first non-empty value per field.
              <button onClick={() => { if (window.confirm('Merge duplicate groups? Conflicting fields keep the first imported value. This cannot be undone.')) { setRecords(mergeDuplicates(records)); void log('Duplicates merged', `${groups.length} groups merged`) } }}>Merge duplicates</button></div>}
            <div className="table-hint" id="table-help">Scroll horizontally for all columns and vertically for more rows. Double-click a cell to edit.</div>
            <div className="table-scroll" ref={tableScroll} role="region" aria-label="Scrollable record data" aria-describedby="table-help" tabIndex={0}><table aria-label="Vital records preview"><thead><tr><th>#</th>{columns.map(c => <th key={c}><button onClick={() => setSort({ column:c, direction: sort.column === c && sort.direction === 1 ? -1 : 1 })}>{labels[c]}{sort.column === c ? sort.direction === 1 ? ' ↑' : ' ↓' : ''}</button></th>)}<th>Source</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{visible.map((row,i) => <tr key={row.id}><td className="subtle">{(currentPage-1)*pageSize+i+1}</td>{columns.map(c => <EditableCell key={c} row={row} column={c} mask={mask} duplicate={duplicateIds.has(row.id)} onEdit={updateCell}/>)}
                <td title={`${row.source} · line ${row.line}`}>{row.source}</td><td><button className="delete" aria-label={`Delete row ${i+1}`} onClick={() => {
                  if (window.confirm('Delete this row from the workspace? The original file will not change.')) { setRecords(previous => previous.filter(r => r.id !== row.id)); void log('Row deleted','One record removed') }
                }}><Icon name="trash"/></button></td></tr>)}
                {!visible.length && <tr><td colSpan={12}><div className="table-empty"><Icon name="file"/><strong>{records.length ? 'No matching records' : 'A clean start for your next report'}</strong>{records.length ? 'Try adjusting your search or filters.' : 'Import a file to review records here. Nothing leaves this device.'}</div></td></tr>}
              </tbody></table></div>
            <nav className="pagination" aria-label="Record pagination"><span aria-live="polite">{filtered.length ? (currentPage-1)*pageSize+1 : 0}–{Math.min(currentPage*pageSize,filtered.length)} of {filtered.length} records</span>
              <div className="pages"><select aria-label="Rows per page" value={pageSize} onChange={e => setPageSize(+e.target.value)}>{[25,50,100].map(n => <option key={n} value={n}>{n} / page</option>)}</select>
                <button aria-label="First page" disabled={currentPage <= 1} onClick={() => setPage(1)}>«</button>
                <button aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage(currentPage-1)}>‹</button>
                <span aria-current="page">Page {currentPage} of {pages}</span>
                <button aria-label="Next page" disabled={currentPage >= pages} onClick={() => setPage(currentPage+1)}>›</button>
                <button aria-label="Last page" disabled={currentPage >= pages} onClick={() => setPage(pages)}>»</button></div></nav>
            {!!records.length && <div className="analytics" aria-label="Record breakdown">
              {Object.entries(stats.sex).map(([name,count]) => <span key={`sex${name}`}>Sex {name}: {count}</span>)}
              {Object.entries(stats.city).sort((a,b) => b[1]-a[1]).slice(0,4).map(([name,count]) => <span key={`city${name}`}>{name}: {count}</span>)}
              {Object.entries(stats.rescode).sort((a,b) => b[1]-a[1]).slice(0,4).map(([name,count]) => <span key={`code${name}`}>RES {name}: {count}</span>)}
            </div>}
          </section>
        </>}
        {tab === 'issues' && <section className="panel"><div className="panel-head"><h2>Validation & skipped lines<span className="badge">{issues.length}</span></h2><button disabled={!issues.length || !!busy} onClick={() => void exportIssues()}><Icon name="download"/>Download log</button></div>
          <div className="history"><p className="subtle">Correct invalid cells in Records. Skipped lines retain the original file line number. No raw record data is stored in the log.</p>
            {issues.slice(0,500).map((issue,i) => <div className="history-row" key={i}><div><strong>{issue.source} · line {issue.line}</strong><small>{issue.message}</small></div><Icon name="alert"/></div>)}
            {!issues.length && <div className="table-empty">No validation issues.</div>}{issues.length > 500 && <p className="subtle">Showing the first 500 issues. Download the log for all {issues.length}.</p>}
          </div></section>}
        {tab === 'history' && <>
          <section className="panel"><div className="panel-head"><h2>Recent files</h2><button disabled={!recent.length || !!busy} onClick={() => void forgetHistory()}><Icon name="trash"/>Clear all file history</button></div><div className="history">
            <p className="subtle">Last 10 TXT/CSV files · stored on this device. Remove or clear history without deleting source files or loaded records. Browser preview files must be imported again.</p>
            {recent.map(file => <div className="history-row" key={file.path}><div className="history-file"><strong title={file.name}>{file.name}</strong><small>{formatTime(file.importedAt)}</small></div><div className="history-actions"><button disabled={!!busy} onClick={async () => {
              try { const result = await window.api.reloadFile(file.path); if (result) await importFiles([result]) }
              catch { setMessage({ text: `Could not reload ${file.name}. It may have moved or been deleted.`, error: true }) }
            }}>Reload</button><button disabled={!!busy} aria-label={`Remove ${file.name} from history`} onClick={() => void forgetHistory(file)}><Icon name="trash"/>Remove</button></div></div>)}{!recent.length && <div className="table-empty">No recent files yet.</div>}</div></section>
          <section className="panel"><div className="panel-head"><h2>Activity log</h2><span className="subtle">Latest 200 events · no record values</span></div><div className="history">{activity.map((item,i) =>
            <div className="history-row" key={i}><div><strong>{item.action}</strong><small>{item.detail}</small></div><small>{formatTime(item.at)}</small></div>)}{!activity.length && <div className="table-empty">Imports, edits, and exports will appear here.</div>}</div></section>
        </>}
        {tab === 'settings' && <section className="panel"><div className="panel-head"><h2>Input layout profiles</h2></div><div className="layout-settings">
          <p>Legacy fixed-width uses SSN 9, owner 27, RESCODE 3, address 22, city 17, then the final 20 characters for DOB, DOD, sex, age. Dates accept MMDDYYYY, M/D/YYYY, YYYY-MM-DD, or D-MMM-YYYY. Delimited files can include named column headers.</p>
          <label>Format<select value={layout.mode} onChange={e => setLayout({ name: 'Custom', mode:e.target.value as Layout['mode'] })}>{['auto','fixed','comma','tab','pipe'].map(mode => <option key={mode} value={mode}>{mode}</option>)}</select></label>
          <label>Profile name<input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="e.g. County monthly file"/></label>
          {layout.mode === 'fixed' && <label>9 field widths (comma separated)<input value={widths} onChange={e => setWidths(e.target.value)}/></label>}
          <button onClick={saveProfile}>Save profile</button><p>Custom widths are sequential, in table-column order, with no gaps. Choose the saved profile before importing. Profiles, theme, privacy toggle, and output filename persist locally; record contents do not.</p>
          {profiles.map(p => <div className="notice" key={p.name}>{p.name} · {p.mode}<button aria-label={`Delete profile ${p.name}`} onClick={() => { setProfiles(previous => previous.filter(v => v.name !== p.name)); if (layout.name === p.name) setLayout(defaultLayout) }}>×</button></div>)}
        </div></section>}
      </main>
      <footer className="statusbar"><div className="footer-status"><span><span style={{color:'var(--accent)'}}>●</span> {busy ? 'Processing' : 'Ready'} · Your files stay on this device</span><span>Ctrl/⌘ O import · S export · F search</span></div><CopyrightNotice/></footer>
    </div>
    {manual && <div className="modal-shade" onKeyDown={e => { if (e.key === 'Escape') setManual(false) }}><form className="modal" role="dialog" aria-modal="true" aria-labelledby="manual-title" onSubmit={e => {
      e.preventDefault()
      const row = makeRow(columns.map(c => manualValues[c]), 'Manual entry', 0)
      setRecords(previous => [...previous,row]); setManual(false); void log('Row added','One record entered manually')
    }}><h2 id="manual-title">Add a record</h2><p className="subtle">Invalid fields will be flagged for review. Dates: MMDDYYYY or YYYY-MM-DD.</p><div className="form-grid">
      {columns.map((c,i) => <label key={c}>{labels[c]}<input autoFocus={i === 0} value={manualValues[c]} onChange={e => setManualValues(previous => ({ ...previous,[c]:e.target.value }))}/></label>)}
      </div><div className="modal-actions"><button type="button" onClick={() => setManual(false)}>Cancel</button><button type="submit" className="primary">Add record</button></div></form></div>}
  </div>
}
