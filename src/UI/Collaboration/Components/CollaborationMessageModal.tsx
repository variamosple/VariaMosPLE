import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

interface Props {
  show: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function CollaborationMessageModal({
  show,
  title,
  message,
  onClose,
}: Props) {
  return (
    <Modal
      id="collaborationMessageModal"
      show={show}
      onHide={onClose}
      size="lg"
      centered
      backdrop={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>{message}</p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="primary" onClick={onClose}>
          Accept
        </Button>
      </Modal.Footer>
    </Modal>
  );
}