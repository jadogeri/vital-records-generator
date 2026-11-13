import { getDate } from "../utils/getDate";

class VitalRecord {
    private ssn : string = "";
    private owner: string = "";
    private rescode: string = "";
    private address: string = "";
    private city: string = "";
    private dob: string = "";
    private dod: string = "";
    private sex: string = "";
    private age: string = "";

    constructor(){ }
    setSSN = (ssn: string) => this.ssn = ssn;

    setOwner = (owner: string) => this.owner = owner;

    setResCode = (rescode: string) => this.rescode = rescode;

    setAddress = (address: string) => this.address = address;

    setCity = (city: string) => this.city = city;

    setDOB = (dob: string) => this.dob = dob;

    setDOD = (dod: string) => this.dod = dod;

    setSex = (sex: string) => this.sex = sex;

    setAge = (age: string) => this.age = age;

    getSSN = () : string => this.ssn;

    getOwner = () : string => this.owner;

    getResCode = () : string => this.rescode;

    getAddress = () : string => this.address;

    getCity = () : string => this.city;

    getDOB = () : string => this.dob;

    getDOD = () : string => this.dod;

    getSex = () : string => this.sex;

    getAge = () : string => this.age;

    instance =()=>{
        return {
            ssn: this.ssn,
            owner : this.owner,
            rescode: this.rescode,
            address: this.address,
            city: this.city,
            dob: this.dob,
            dod: this.dod,
            sex: this.sex,
            age: this.age
        }
    }

    populate = (line : string) =>{
        this.setSSN(line.substr(0, 9));
        this.setOwner(line.substr(9, 27));
        this.setResCode(line.substr(36, 3));
        this.setAddress(line.substr(39, 22));
        this.setCity(line.substr(61, 17));
        this.setDOB(getDate(line.substr(-20, 8)));
        this.setDOD(getDate(line.substr(-12, 8)));
        this.setSex(line.substr(-4, 1));
        this.setAge(line.substr(-3, 3));
    }
}

export default VitalRecord;