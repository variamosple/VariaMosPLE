import { useEffect, useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import NavDropdown from "react-bootstrap/NavDropdown";
import VariaMosLogo from "../../../Addons/images/VariaMosLogo.png";
import { Config } from "../../../Config";
import { UserTypes } from "../../../UI/SignUp/SignUp.constants";
import { getUserProfile, logoutUser } from "../../../UI/SignUp/SignUp.utils";
import { REPOSITORY_URL } from "../../constants/constants";

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
    <div className="d-flex flex-column vh-100 overflow-hidden">
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
              <Nav.Link href="/">Home</Nav.Link>
              <Nav.Link
                href={Config.SERVICES.urlVariamosDocumentation}
                target="_blank"
              >
                Documentation
              </Nav.Link>
              <Nav.Link href="/variamos_languages/" target="_blank">
                Languages
              </Nav.Link>
            </Nav>
            <Nav>
              <NavDropdown
                title={profile?.givenName}
                className="me-5 pe-5"
                id="nav-dropdown"
              >
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
      <div className="bodyContent flex-grow-1 overflow-hidden">{children}</div>
      <footer
        className="d-flex justify-content-center align-items-center p-0"
        style={{ height: "50px" }}
      >
        <p className="m-0">© Copyright 2023 VariaMos.</p>
      </footer>
    </div>
  );
}

export default Layout;
