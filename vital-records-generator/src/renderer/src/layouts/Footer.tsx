import React from 'react'
import CopyRightNotice from "../components/CopyRightNotice"

const Footer = () => {
    
  return (
  <footer className="w3-center w3-black w3-bottom"
  style={{padding : "0px", height: 50}}
  >
      <CopyRightNotice />
  </footer>
  )
}

export default Footer