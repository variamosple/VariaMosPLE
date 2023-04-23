import { Button, Form, Modal } from "react-bootstrap";
import { CreateLanguageModalProps } from "./CreateLanguageModal.types";
import config from "./CreateLanguageModal.json"

export default function CreateLanguageModal({
  show,
  handleClose,
}: CreateLanguageModalProps) {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{config.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
            <Form.Label>{config.inputLabel}</Form.Label>
            <Form.Control
              type="text"
              placeholder={config.inputPlaceHolder}
              autoFocus
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          {config.closeButtonLabel}
        </Button>
        <Button variant="primary" onClick={handleClose}>
          {config.primaryButtonLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
