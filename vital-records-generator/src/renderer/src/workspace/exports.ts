import { columns, labels, projectRows, safeSpreadsheetValue, toCSV } from '../../../shared/records'
import type { VitalRow, Column, ExportFormat } from '../../../shared/records'

export async function buildExport(records: VitalRow[], selected: Column[], mask: boolean, format: ExportFormat): Promise<Uint8Array> {
  const rows = projectRows(records, selected, mask)
  const headers = [...selected.map(c => labels[c]), 'Source']
  const timestamp = new Date().toISOString()
  if (format === 'csv') return new TextEncoder().encode(toCSV(rows, headers))
  if (format === 'json') return new TextEncoder().encode(JSON.stringify({
    report: 'Vital Records', version: 2, generatedAt: timestamp, totalRecords: rows.length, ssnMasked: mask, columns: headers, records: rows
  }, null, 2))
  if (format === 'xlsx') {
    const { default: ExcelJS } = await import('exceljs')
    const { Workbook } = ExcelJS
    const book = new Workbook()
    book.creator = 'Vital Records Generator'
    book.created = new Date()
    const sheet = book.addWorksheet('Vital Records', { views: [{ state: 'frozen', ySplit: 1 }] })
    sheet.columns = headers.map(header => ({
      header, key: header,
      width: Math.min(48, Math.max(header.length + 3, ...rows.slice(0, 1000).map(r => (r[header]?.length ?? 0) + 2)))
    }))
    rows.forEach((row, index) => {
      const excelRow = sheet.addRow(Object.fromEntries(headers.map(header => {
        const value = row[header]
        if (['DOB','DOD'].includes(header) && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return [header, new Date(`${value}T00:00:00Z`)]
        }
        return [header, safeSpreadsheetValue(value)]
      })))
      excelRow.eachCell(cell => {
        cell.alignment = { vertical: 'middle' }
        if (cell.value instanceof Date) cell.numFmt = 'yyyy-mm-dd'
        if (index % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F6F4' } }
      })
    })
    sheet.getRow(1).height = 26
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF146C54' } }
    })
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, rows.length + 1), column: headers.length } }
    return new Uint8Array(await book.xlsx.writeBuffer())
  }
  const { jsPDF } = await import('jspdf')
  const { autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF({ orientation: 'landscape' })
  autoTable(doc, {
    head: [headers], body: rows.map(r => headers.map(h => r[h])),
    margin: { top: 30, bottom: 18 }, styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [20,108,84] }, alternateRowStyles: { fillColor: [240,246,244] },
    didDrawPage: () => {
      doc.setFontSize(16); doc.setTextColor(20,60,50); doc.text('Vital Records Report', 14, 14)
      doc.setFontSize(8); doc.text(`Generated ${timestamp}  |  ${rows.length} records  |  SSNs ${mask ? 'masked' : 'visible'}`, 14, 22)
    }
  })
  const count = doc.getNumberOfPages()
  for (let page = 1; page <= count; page++) {
    doc.setPage(page); doc.setFontSize(8)
    doc.text(`Page ${page} of ${count}`, doc.internal.pageSize.getWidth() - 35, doc.internal.pageSize.getHeight() - 9)
  }
  return new Uint8Array(doc.output('arraybuffer'))
}

export async function saveBytes(bytes: Uint8Array, name: string, format: ExportFormat): Promise<boolean> {
  if (window.api) return window.api.saveFile(name, format, Array.from(bytes))
  // Browser development preview only; packaged Electron always uses a native save dialog.
  const blob = new Blob([bytes as BlobPart], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = `${name}.${format}`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
export function allColumns(): Column[] { return [...columns] }
