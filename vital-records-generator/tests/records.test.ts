import { test } from 'node:test'
import assert from 'node:assert/strict'
import { columns, parseFile, parseDate, validateRow, normalizeValue, duplicateGroups, mergeDuplicates,
  filterRecords, emptyFilters, makeRow, maskSSN, projectRows, toCSV, readDelimited } from '../src/shared/records'

const values = ['123456789','  JANE   DOE  ','001','10 MAIN ST','NEW ORLEANS','01021940','03042020','f','080']
const row = () => makeRow(values,'test.txt',1)
const fixed = () => values.map((v,i) => v.trim().padEnd([9,27,3,22,17,8,8,1,3][i])).join('')
test('legacy fixed-width layout preserves the final record without a trailing newline', () => {
  const parsed = parseFile({ name:'legacy.txt',text:fixed() })
  assert.equal(parsed.records.length,1)
  assert.equal(parsed.records[0].dob,'1940-01-02')
  assert.equal(parsed.records[0].ssn,'123-45-6789')
  assert.equal(parsed.records[0].owner,'Jane Doe')
  assert.deepEqual(parsed.issues,[])
})
test('legacy extra middle padding keeps the tail-based date layout', () => {
  const text = fixed()
  assert.equal(parseFile({name:'x.txt',text:text.slice(0,78)+'    '+text.slice(78)}).records[0].dod,'2020-03-04')
})
for (const ending of ['\n','\r\n','\r']) test(`line ending ${JSON.stringify(ending)} and exact skipped line`, () => {
  const result = parseFile({name:'input.txt',text:[fixed(),'corrupt',fixed(),''].join(ending)})
  assert.equal(result.records.length,2)
  assert.equal(result.issues[0].line,2)
  assert.equal(result.records[1].line,3)
})
for (const [mode,delimiter] of [['comma',','],['tab','\t'],['pipe','|']] as const) test(`${mode} headers, reordered columns, and BOM`, () => {
  const keys = [...columns].reverse()
  const result = parseFile({name:'input.csv',text:'\uFEFF'+keys.join(delimiter)+'\n'+[...values].reverse().join(delimiter)}, {name:mode,mode})
  assert.equal(result.records.length,1); assert.equal(result.records[0].owner,'Jane Doe')
})
test('CSV handles embedded delimiters, doubled quotes, newlines, and physical line numbers', () => {
  const parsed = readDelimited('a,"b,c","d""e"\n"multi\nline",x,y\nbad"x,y,z\nlast,row,ok',',')
  assert.deepEqual(parsed.rows[0],{values:['a','b,c','d"e'],line:1})
  assert.deepEqual(parsed.rows[1],{values:['multi\nline','x','y'],line:2})
  assert.equal(parsed.errors[0].line,4)
  assert.equal(parsed.rows[2].line,5)
})
test('unterminated CSV reports the starting physical line', () => {
  assert.deepEqual(readDelimited('ok,line\n"bad\nrow',',').errors,[{line:2,message:'Unclosed quoted field; skipped'}])
})
test('wrong delimited field counts are skipped, not silently truncated', () => {
  const result = parseFile({name:'x.csv',text:'one,two\n'+values.join(',')})
  assert.equal(result.records.length,1); assert.equal(result.issues[0].line,1)
})
test('custom fixed-width profiles enforce their widths', () => {
  const profile = {name:'County',mode:'fixed' as const,widths:[9,27,3,22,17,8,8,1,3]}
  assert.equal(parseFile({name:'x.txt',text:fixed()},profile).records.length,1)
  assert.equal(parseFile({name:'x.txt',text:fixed()+'x'},profile).records.length,0)
  assert.throws(() => parseFile({name:'x',text:'x'},{...profile,widths:[1]}))
})
test('strict dates support leap years and reject impossible calendar dates', () => {
  assert.equal(parseDate('02292000'),'2000-02-29')
  assert.equal(parseDate('02291900'),null)
  assert.equal(parseDate('02312020'),null)
  assert.equal(parseDate('2020-13-01'),null)
  assert.equal(parseDate('4-Mar-2020'),'2020-03-04')
  assert.equal(parseDate('3/4/2020'),'2020-03-04')
})
test('SSNs normalize only valid digit sequences and names trim/title case', () => {
  assert.equal(normalizeValue('ssn',' 123-45-6789 '),'123-45-6789')
  assert.equal(normalizeValue('ssn','123x456789'),'123x456789')
  assert.equal(normalizeValue('owner',"  O'NEIL   JANE "),"O'Neil Jane")
})
test('validation flags missing SSNs, malformed dates and death before birth', () => {
  const r = {...row(),ssn:'123',dob:'2020-01-02',dod:'2019-01-01'}
  assert.ok(validateRow(r).ssn); assert.ok(validateRow(r).dod)
  assert.ok(validateRow({...r,dob:'bad'}).dob)
})
test('duplicate detection requires owner, DOB, and DOD together regardless of SSN', () => {
  const a = row(), b = {...row(),ssn:'987-65-4321'}, c = {...row(),ssn:''}
  assert.equal(duplicateGroups([a,b,c]).length,1)
  assert.equal(duplicateGroups([a,b,c])[0].length,3)
  assert.equal(mergeDuplicates([a,b,c]).length,1)
})
test('blank and malformed identifiers do not create false duplicate groups', () => {
  const a = {...row(),ssn:'',owner:'',dob:''}, b = {...a,id:'other'}
  assert.equal(duplicateGroups([a,b]).length,0)
})
test('same SSN or owner+DOB alone does not flag unrelated records', () => {
  const a = row()
  for (const change of [{owner:'Someone Else'}, {dob:'1941-01-02'}, {dod:'2021-03-04'}]) {
    assert.equal(duplicateGroups([a,{...row(),...change}]).length,0)
  }
})
test('duplicate identity normalizes owner spacing/case and supported date forms', () => {
  const a = row(), b = {...row(),owner:'  JANE   DOE ',dob:'1/2/1940',dod:'4-Mar-2020',ssn:'987-65-4321'}
  assert.equal(duplicateGroups([a,b]).length,1)
})
test('missing, invalid, and reversed dates never create duplicate identities', () => {
  for (const change of [{owner:''},{dob:''},{dod:''},{dod:'2020-02-31'},{dob:'bad'},{dod:'1900-01-01'}]) {
    const a = {...row(),...change}, b = {...a,id:'other'}
    assert.equal(duplicateGroups([a,b]).length,0)
  }
})
test('merging fills empty fields, retains first conflicting value, and tracks sources', () => {
  const a = {...row(),city:'',source:'a.txt'}, b = {...row(),ssn:'987-65-4321',source:'b.txt'}
  const merged = mergeDuplicates([a,b])
  assert.equal(merged[0].city,'New Orleans'); assert.equal(merged[0].owner,'Jane Doe')
  assert.equal(merged[0].source,'a.txt; b.txt')
})
test('global search and combined column filters do not mutate loaded records', () => {
  const a = row(), b = {...row(),city:'Baton Rouge',sex:'M',age:'030'}
  assert.equal(filterRecords([a,b],{...emptyFilters,city:'New Orleans',sex:'F',age:'65+',month:'03'}).length,1)
  assert.equal(filterRecords([a],{...emptyFilters,search:'123456789'}).length,1)
  assert.equal(filterRecords([a],{...emptyFilters,search:'main'}).length,1)
  assert.equal(a.owner,'Jane Doe')
})
test('masked projection applies to every export and excludes unchecked columns', () => {
  const projected = projectRows([row()],['owner','ssn'],true)
  assert.deepEqual(Object.keys(projected[0]),['Owner','SSN','Source'])
  assert.equal(projected[0].SSN,'***-**-6789')
  assert.equal(maskSSN(''),'***-**-****')
  assert.ok(!JSON.stringify(projected).includes('123-45'))
})
test('CSV escapes quotes and prevents spreadsheet formula injection', () => {
  const csv = toCSV([{Owner:'=HYPERLINK("bad")',City:'New, Orleans'}],['Owner','City'])
  assert.ok(csv.includes(`"'=HYPERLINK(""bad"")"`)); assert.ok(csv.includes('"New, Orleans"'))
})
test('duplicate detection remains bounded for thousands of identical records', () => {
  const records = Array.from({length:10000},(_,i) => ({...row(),id:String(i)}))
  assert.equal(duplicateGroups(records)[0].length,10000)
})
