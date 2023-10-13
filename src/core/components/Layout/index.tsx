import { Row, Container, Col, Navbar, Nav } from "react-bootstrap";
import VariaMosLogo from "../../../Addons/images/VariaMosLogo.png";
import NavDropdown from "react-bootstrap/NavDropdown";
import { useEffect, useState } from "react";
import { getUserProfile, logoutUser } from "../../../UI/SignUp/SignUp.utils";

function Layout({ children }) {
  const [userName, setUserName] = useState();

  useEffect(() => {
    const userProfile = getUserProfile();
    setUserName(userProfile.givenName);
  }, []);

  const handleLogout = () => {
    logoutUser();
  }

  return (
    <>
      <Navbar bg="dark" variant="dark">
        <Container fluid>
          <Navbar.Brand href="/dashboard">
            <img
              src={VariaMosLogo}
              height="30"
              className="d-inline-block align-top"
              alt="React Bootstrap logo"
            />
          </Navbar.Brand>
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="https://variamos.com/home/" target="_blank">
                Home
              </Nav.Link>
              <Nav.Link
                href="https://github.com/variamosple/VariaMosPLE/wiki"
                target="_blank"
              >
                Wiki
              </Nav.Link>
              <Nav.Link href="/languages">Languages</Nav.Link>
            </Nav>
            <Nav>
              <NavDropdown title={userName} id="nav-dropdown">
                {/* TODO: Add a Profile page */}
                {/* <NavDropdown.Item eventKey="4.2">Profile</NavDropdown.Item>
                <NavDropdown.Divider /> */}
                <NavDropdown.Item eventKey="4.3" onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div className="bodyContent">
        {children}
      </div>
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
