import React from 'react'
import "./Table.css"
import VitalRecord from '../../models/VitalRecord';

type TableProps={
    records? : VitalRecord[]
    isData? : boolean;
}
const Table : React.FC<TableProps>= ({records }) => {
  return (
          <div className="table-container">
        <table>
            <thead >
                <tr>
                    <th>#</th>
                    <th>SSN</th>
                    <th>Ownername</th>
                    <th>Rescode</th>
                    <th>Address</th>
                    <th>City</th>
                    <th>DOB</th>
                    <th>DOD</th>
                    <th>Sex</th>
                    <th>Age</th>
                </tr>
            </thead>
            <tbody>
                {records && records.length > 0?
                    records?.map((record,index)=>{
                        return (
                        <tr>
                            <td>{index + 1}</td>
                            <td>{record.getSSN()}</td>
                            <td>{record.getOwner()}</td>
                            <td>{record.getResCode()}</td>
                            <td>{record.getAddress()}</td>
                            <td>{record.getCity()}</td>
                            <td>{record.getDOB()}</td>
                            <td>{record.getDOD()}</td>
                            <td>{record.getSex()}</td>
                            <td>{record.getAge()}</td>
                        </tr>
                        )
                    }) :
                <tr>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                </tr>
                }
            </tbody>
        </table>
</div>
  )
}

export default Table