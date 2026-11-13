import React from 'react'
import TeamCard from '../components/TeamCard'

const Team = () => {
  return (
    <div className="w3-light-grey" style={{ padding: "60px 20px", height :"100vh"}} >

          {/* <!-- Contact --> */}
  <div className="w3-container" id="team">
    <h2>Team</h2>
    <TeamCard 
        name='Jun Bause' title='IT Manager' phone='504-754-8846' email='jbausa@orleansassessors.com'
    />
    <TeamCard 
        name='Joseph Adogeri' title='Software Developer' phone='504-754-8862' email='joseph.adogeri@orleansassessors.com'
    />
    <TeamCard 
        name='Jason Lee' title='Computer Programmer' phone='504-754-8851' email='jason.lee@orleansassessors.com'
    />

  </div>
    </div>
  )
}

export default Team