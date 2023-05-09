import React from "react";
import { Container, Col, Row } from "react-bootstrap";

function LanguageManagerLayout({ children }) {
  return (
    <Container>
      {React.Children.map(children, (child) => (
        <Row className="mt-2">
          <Col>{child}</Col>
        </Row>
      ))}
    </Container>
  );
}

export default LanguageManagerLayout;
