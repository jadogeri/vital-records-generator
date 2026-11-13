import React, { useState, FC } from 'react';
import { FileUploader } from "react-drag-drop-files";
import VitalRecord from '../models/VitalRecord';
import Table from '../components/table/Table';
import Button from '../components/button/Button';
import { CSVLink } from "react-csv";
import generateCSVData from '../utils/generateCSVData';
import { headers } from '../data/headers';
import exportToExcel from '../helpers/exportToExcel';
import getTimestamp from '../utils/getTimeStamp';
const formattedDate: string = getTimestamp();
console.log(formattedDate);

const Home: FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [isDisabled, setIsDisabled] = useState<boolean>(true);
  const fileTypes: string[] = ["TXT"];
  
  const handleChange = (e: File | File[]) => {
    try{

      const reader: FileReader = new FileReader();
      reader.readAsText(e as Blob);
      reader.onload = () => {
        const fileText: string | ArrayBuffer | null = reader.result;
        if (typeof fileText === 'string') {
          const lines: string[] = fileText.split('\r\n');
          let vitalrecords: any[] = [];
          for (let index: number = 0; index < lines.length -1; index++) {
            let vitalrecord: VitalRecord = new VitalRecord();
            vitalrecord.populate(lines[index]);
            vitalrecords.push(vitalrecord);
          }
          setData(vitalrecords);
          setFile(e as File);
          setIsDisabled(false);     
        }
      }
    }catch(e : any){
      alert(JSON.stringify("line 63" +e, null , 4));
    }
  };

  const unSelectFile = (): void => {
    setFile(null);
    setIsDisabled(true);
    setData([]);
  };

  return (
  <>
    <div className="w3-light-grey" style={{ padding: "60px 20px", height :"100vh"}} id="home" >
      <h3 className="w3-center">Vital Records Generator</h3>
      <p className="w3-center w3-large"><i>create vital record reports with ease:</i></p>
      <div style={{ marginTop: 40, alignItems: "center", justifyContent:"center",alignSelf:"center", justifyItems:"center" }}>
        <FileUploader 
          handleChange={handleChange}  classes="custom-file-uploader w3-center" name="file" types={fileTypes} 
          uploadedLabel={file && data.length > 0?"Uploaded Successfully! Upload another?" : "upload or drop a file right here"}
          onTypeError={(error : string)=>{
                        alert(error); setFile(null); setIsDisabled(true); setData([]);
                      }}
        />
        <br /> <br />
        Total Records: {data.length === 0 ?<span style={{color:"red"}}>0</span> : <span>{data.length}</span>}, FileName: {file ? `${file.name}` : <span style={{color:"red"}}>no files uploaded yet</span>}
        <div style={{position : "absolute", top: 400,left: "50%",   transform: "translate(-50%)"}}>
          <Button label="Clear File" onClick={unSelectFile} disabled={isDisabled}/>
          <Button label="Export Excel" onClick={()=>{exportToExcel(data, `${formattedDate}-vitalrecords`)}} disabled={isDisabled} className="my-custom-button" />
          <CSVLink data={generateCSVData(data)} headers={headers}  filename={`${formattedDate}-vitalrecords`}>
             <Button label="Export CSV" disabled={isDisabled}></Button>
          </CSVLink>
        </div> 
        <Table records={data} isData={file === null}/>
      </div>
    </div> 
  </>

  );
}

export default Home;