import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

const heading: string[][] = [['SSN', 'OWNER', 'RESCODE', 'ADDRESS', 'CITY', 'DOB', 'DOD', 'SEX', 'AGE']]

const exportToExcel = (data: Record<string, any>[], fileName: string): void => {
  const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: true })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.sheet_add_aoa(worksheet, heading, { origin: 'A1' })
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

  const excelBuffer: ArrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8'
  })
  saveAs(blob, `${fileName}.xlsx`)
}

export default exportToExcel
