import React from "react";
import { Container, Navbar, Nav } from "react-bootstrap";
import VariaMosLogo from "../../../Addons/images/VariaMosLogo.png";
import NavDropdown from "react-bootstrap/NavDropdown";
import { useEffect, useState } from "react";
import { getUserProfile, logoutUser } from "../../../UI/SignUp/SignUp.utils";
import { REPOSITORY_URL } from "../../constants/constants";
import { UserTypes } from "../../../UI/SignUp/SignUp.constants";
import { Config } from "../../../Config";

function Layout({ children }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const userProfile = getUserProfile();
    setProfile(userProfile);
  }, []);

  const handleLogout = () => {
    logoutUser();
  };

  const handleReportProblem = () => {
    window.open(`${REPOSITORY_URL}issues/new`, `blank`);
  };

  const handleOpenIssues = () => {
    window.open(`${REPOSITORY_URL}issues/`, `blank`);
  };

  return (
    <>
      <Navbar bg="dark" variant="dark">
        <Container fluid>
          <Navbar.Brand href="/">
            <img
              src={VariaMosLogo}
              height="30"
              className="d-inline-block align-top"
              alt="React Bootstrap logo"
            />
          </Navbar.Brand>
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/">
                Home
              </Nav.Link>
              <Nav.Link
                href={Config.SERVICES.urlVariamosDocumentation}
                target="_blank"
              >
                Documentation
              </Nav.Link>
              <Nav.Link
                href="/variamos_languages/"
                target="_blank"
              >
                Languages
              </Nav.Link>
            </Nav>
            <Nav>
              <NavDropdown title={profile?.givenName} className="me-5 pe-5" id="nav-dropdown">
                {/* TODO: Add a Profile page */}
                <NavDropdown.Item onClick={handleReportProblem}>
                  Report a problem
                </NavDropdown.Item>
                {profile?.userType !== UserTypes.Guest && (
                  <NavDropdown.Item onClick={handleOpenIssues}>
                    Issues
                  </NavDropdown.Item>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item eventKey="4.3" onClick={handleLogout}>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
            <Nav />
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div className="bodyContent">{children}</div>
      <footer>
        {/* <div className="row">
          <div className="col-md-3">
            <h3>Help</h3>
            <div><a href="#">Link 1</a></div>
            <div><a href="#">Link 2</a></div>
            <div><a href="#">Link 3</a></div>
            <div><a href="#">Link 4</a></div>
            <div><a href="#">Link 5</a></div>
          </div>
          <div className="col-md-3">
            <h3>Help</h3>
            <div><a href="#">Link 1</a></div>
            <div><a href="#">Link 2</a></div>
            <div><a href="#">Link 3</a></div>
            <div><a href="#">Link 4</a></div>
            <div><a href="#">Link 5</a></div>
          </div>
          <div className="col-md-3">
            <h3>Help</h3>
            <div><a href="#">Link 1</a></div>
            <div><a href="#">Link 2</a></div>
            <div><a href="#">Link 3</a></div>
            <div><a href="#">Link 4</a></div>
            <div><a href="#">Link 5</a></div>
          </div>
          <div className="col-md-3">
            <h3>Help</h3>
            <div><a href="#">Link 1</a></div>
            <div><a href="#">Link 2</a></div>
            <div><a href="#">Link 3</a></div>
            <div><a href="#">Link 4</a></div>
            <div><a href="#">Link 5</a></div>
          </div>
        </div> */}
        <div className="row copyright">
          <p>© Copyright 2023 VariaMos.</p>
        </div>
      </footer>
    </>
  );
}

export default Layout;
