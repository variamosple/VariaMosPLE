import { Badge, Form, InputGroup } from "react-bootstrap";

export default function Comment() {
  return (
    <div className="media">
      <div className="media-body">
        <h5>Jessie Pinkman</h5>
        <Badge bg="secondary" className="ml-3">
          2012-12-12
        </Badge>
        <p>
          Phasellus lacinia, turpis pellentesque aliquam consectetur, nunc felis
          aliquam quam, eget maximus risus risus id diam. Suspendisse interdum
          condimentum aliquet.
        </p>
        <InputGroup className="mb-3">
          <InputGroup.Text id="inputGroup-sizing-default">
            Status
          </InputGroup.Text>
          <Form.Select
            aria-label="Default"
            aria-describedby="inputGroup-sizing-default"
          >
            <option>Open</option>
            <option>Solved</option>
          </Form.Select>
        </InputGroup>
      </div>
    </div>
  );
}
