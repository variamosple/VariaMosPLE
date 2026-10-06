import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

interface Props {
  show: boolean;
  collaboratorName?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function RemoveCollaboratorConfirmationModal({
  show,
  collaboratorName,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      id="removeCollaboratorConfirmationModal"
      show={show}
      onHide={onCancel}
      size="lg"
      centered
      backdrop={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>Remove collaborator</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>Are you sure you want to remove{" "}<strong>{collaboratorName || "this collaborator"}</strong> from this project?</p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>

        <Button variant="danger" onClick={onConfirm}>
          Remove
        </Button>
      </Modal.Footer>
    </Modal>
  );
}