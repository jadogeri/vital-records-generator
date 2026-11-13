const generateCSVData = (vitalRecords: any[]) => {
  let csvData = [];
  for (let i = 0 ; i < vitalRecords.length; i++){
    csvData.push(vitalRecords[i].instance())
  }
  return csvData;
}

export default generateCSVData