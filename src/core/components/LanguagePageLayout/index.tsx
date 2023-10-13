import React from "react";
import { Row, Container, Col, Navbar, Nav } from "react-bootstrap";
import { LanguagePageLayoutProps } from "./index.types";
import Layout from "../Layout";

function LanguagePageLayout({
  children,
}: LanguagePageLayoutProps): JSX.Element {
  const [left, center, right] = React.Children.map(children, (child) => child);

  return (
    <Layout>
      <Container>
        <Row>
          <Col>{left}</Col>
          <Col xs={6}>{center}</Col>
          <Col>{right}</Col>
        </Row>
      </Container>
    </Layout>
  );
}

export default LanguagePageLayout;
