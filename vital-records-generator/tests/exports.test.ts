import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Workbook } from 'exceljs'
import { makeRow } from '../src/shared/records'
import { buildExport } from '../src/renderer/src/workspace/exports'
const row = () => makeRow(['123456789','JANE DOE','001','10 MAIN','NEW ORLEANS','01021940','03042020','F','080'],'test.txt',1)
test('JSON includes report metadata, selected columns, sources, and masked SSNs', async () => {
  const json = JSON.parse(new TextDecoder().decode(await buildExport([row()],['ssn','owner'],true,'json')))
  assert.equal(json.version,2); assert.equal(json.totalRecords,1); assert.equal(json.ssnMasked,true)
  assert.equal(json.records[0].SSN,'***-**-6789'); assert.equal(json.records[0].Source,'test.txt')
  assert.equal(json.records[0].DOB,undefined)
})
test('Excel has styled headers, frozen top row, correct dates and privacy masking', async () => {
  const bytes = await buildExport([row()],['ssn','dob'],true,'xlsx')
  const book = new Workbook()
  await book.xlsx.load(Buffer.from(bytes) as never)
  const sheet = book.worksheets[0]
  assert.equal(sheet.getCell('A2').value,'***-**-6789')
  assert.equal(sheet.getRow(1).getCell(1).font.bold,true)
  assert.equal(sheet.views[0].state,'frozen')
  assert.ok(sheet.getCell('B2').value instanceof Date)
  assert.equal(sheet.getCell('B2').numFmt,'yyyy-mm-dd')
})
test('PDF is generated with a print-ready PDF signature', async () => {
  const bytes = await buildExport([row()],['owner','ssn'],true,'pdf')
  assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'%PDF')
  assert.ok(!new TextDecoder().decode(bytes).includes('123-45-6789'))
})
test('CSV respects selected rows and the SSN masking toggle', async () => {
  const csv = new TextDecoder().decode(await buildExport([row()],['ssn'],false,'csv'))
  assert.ok(csv.includes('123-45-6789')); assert.ok(!csv.includes('Jane Doe'))
})
