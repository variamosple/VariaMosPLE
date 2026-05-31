import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

interface Props {
  show: boolean;
  historyItem: any;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function RevertConfirmationModal({
  show,
  historyItem,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      id="revertConfirmationModal"
      show={show}
      onHide={onCancel}
      size="lg"
      centered
      backdrop={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          Revert change
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>Are you sure you wish to revert this change?</p>

        {historyItem?.description && (
          <div className="border rounded p-2 bg-light small">
            {historyItem.description}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>

        <Button variant="primary" onClick={onConfirm}>
          Accept
        </Button>
      </Modal.Footer>
    </Modal>
  );
}