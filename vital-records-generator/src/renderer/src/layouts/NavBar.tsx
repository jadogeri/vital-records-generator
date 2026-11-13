import React from 'react'
import Company from "../components/Company"
import Logo from "../components/Logo"

const NavBar = () => {
  return (
    <nav>
          <div className="w3-top">
    <div className="w3-bar w3-white w3-card" id="myNavbar" style={{height:50}}>
      <a href="#home" className="w3-button w3-wide"
         style={{ pointerEvents :"none"}}
      >
        <Logo />

        <Company />
      </a>
      {/* Right-sided navbar links */}
      <div className="w3-right w3-hide-small">
        <a href="#" className="w3-bar-item w3-button">
          <i className="fa fa-home" /> HOME
        </a>
         <a href="#team" className="w3-bar-item w3-button">
          <i className="fa fa-user" /> TEAM
        </a>
      </div>
      {/* Hide right-floated links on small screens and replace them with a menu icon */}
      <a
        href="javascript:void(0)"
        className="w3-bar-item w3-button w3-right w3-hide-large w3-hide-medium"
         onClick={()=>{}}
      >
        <i className="fa fa-bars" />
      </a>
    </div>
  </div>

    </nav>
  )
}

export default NavBar