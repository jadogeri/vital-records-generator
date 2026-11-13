import { getMonth } from "./getMonth";

export const getDate = (text: string) : string => {
    let day = text.substr(2,2);
    let month = getMonth(text.substr(0,2));
    let year = text.substr(4,4);   
  
    return `${day}-${month}-${year}`;
}