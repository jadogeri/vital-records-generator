import React from 'react'

type TeamProps = {
    name : string;
    title : string;
    phone : string;
    email : string;
}
const TeamCard : React.FC<TeamProps> = ({
    name,
    title,
    phone,
    email
}) => {
  return (
    <>
    <b >  
       {name}
    </b>    
    <br />
    <i  style={{width:3}}>  
        {title}
    </i>    
    <br/>
    <i className="fa fa-phone" style={{width:30}}></i> Phone: {phone}<br/>
    <i className="fa fa-envelope" style={{width:30}}> </i> Email: {email}<br/>
    <hr  style={{ width: "100%", color: "black", border: "1px solid black"}} />
    </>
  )
}

export default TeamCard