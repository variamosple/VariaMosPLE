import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

interface Props {
  show: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteAnnotationConfirmationModal({
  show,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      id="deleteAnnotationConfirmationModal"
      show={show}
      onHide={onCancel}
      size="lg"
      centered
      backdrop={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          Delete thread
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>Are you sure you wish to delete this comment thread?</p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>

        <Button variant="danger" onClick={onConfirm}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
}