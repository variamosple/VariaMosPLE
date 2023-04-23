import React from "react";
import { Row, Container, Col, Navbar, Nav } from "react-bootstrap";
import { LanguagePageLayoutProps } from "./index.types";
import VariaMosLogo from "../../../Addons/images/VariaMosLogo.png";

function LanguagePageLayout({
  children,
}: LanguagePageLayoutProps): JSX.Element {
  const [left, center, right] = React.Children.map(children, (child) => child);

  return (
    <>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand href="#home">
            <img
              src={VariaMosLogo}
              height="30"
              className="d-inline-block align-top"
              alt="React Bootstrap logo"
            />
          </Navbar.Brand>
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/dashboard">Dashboard</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container>
        <Row>
          <Col>{left}</Col>
          <Col xs={6}>{center}</Col>
          <Col>{right}</Col>
        </Row>
      </Container>
    </>
  );
}

export default LanguagePageLayout;
