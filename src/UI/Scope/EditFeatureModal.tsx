// src/components/EditFeatureModal.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Element } from '../../Domain/ProductLineEngineering/Entities/Element';

interface EditFeatureModalProps {
  show: boolean;
  feature: Element;
  onClose: () => void;
  onSave: (updatedFeature: Element) => void;
}

const EditFeatureModal: React.FC<EditFeatureModalProps> = ({
  show,
  feature,
  onClose,
  onSave
}) => {
  const [localFeature, setLocalFeature] = useState(feature);

  useEffect(() => {
    setLocalFeature(feature);
  }, [feature]);

  const handlePropertyChange = (index: number, value: string) => {
    const updated = [...localFeature.properties];
    updated[index] = { ...updated[index], value };
    setLocalFeature({ ...localFeature, properties: updated });
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar Funcionalidad: {localFeature.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={e => e.preventDefault()}>
          {localFeature.properties.map((prop, i) => (
            <Form.Group key={prop.id} controlId={`prop-${prop.id}`} className="mb-3">
              <Form.Label>{prop.name}</Form.Label>
              {prop.possibleValues ? (
                <Form.Control
                  as="select"
                  value={prop.value}
                  onChange={e => handlePropertyChange(i, (e.target as unknown as HTMLSelectElement).value)}
                >
                  {prop.possibleValues.split(',').map(v => (
                    <option key={v.trim()} value={v.trim()}>
                      {v.trim()}
                    </option>
                  ))}
                </Form.Control>
              ) : (
                <Form.Control
                  type="text"
                  value={prop.value}
                  onChange={e => handlePropertyChange(i, e.target.value)}
                />
              )}
            </Form.Group>
          ))}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} type="button">
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={() => onSave(localFeature)}
          type="button"
        >
          Guardar Cambios
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditFeatureModal;
