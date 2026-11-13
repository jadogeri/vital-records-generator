import {HashRouter, Route, Routes } from "react-router-dom";
import Footer from "../layouts/Footer";
import NavBar from "../layouts/NavBar";
import Home from "../views/Home";
import Team from "../views/Team";

const ProjectRoutes = () => {

  return (

    <HashRouter >	
    <style
     dangerouslySetInnerHTML={{
        __html:
          '\nbody,h1,h2,h3,h4,h5,h6 {font-family: "Raleway", sans-serif}\n\nbody, html {\n  height: 100%;\n  line-height: 1.8;\n}\n\n/* Full height image header */\n.bgimg-1 {\n  background-position: center;\n  background-size: cover;\n  background-image: url("/w3images/mac.jpg");\n  min-height: 100%;\n}\n\n.w3-bar .w3-button {\n  padding: 16px;\n}\n'
      }}
    />
      <NavBar />
        <Routes >						
          <Route path="/" element={<Home />} index /> 
          <Route path="/team" element={<Team />} />         

        </Routes>
      <Footer />
    </HashRouter>

  )
}

export default ProjectRoutes