import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { ScopeSPL, Prioridad } from "../../Domain/ProductLineEngineering/Entities/ScopeSPL";

interface ScopeModalProps {
  show: boolean;
  initialScope: ScopeSPL;
  domain: string; // Valor del atributo domain del product line
  onHide: () => void;
  onSave: (updatedScope: ScopeSPL) => void;
}

const ScopeModal: React.FC<ScopeModalProps> = ({ show, initialScope, domain, onHide, onSave }) => {
  // Campos a editar
  const [marketSegment, setMarketSegment] = useState("");
  const [marketImpact, setMarketImpact] = useState(0);
  // Technical Complexity ahora es un select con valores Low/Medium/High
  const [technicalComplexity, setTechnicalComplexity] = useState<Prioridad>("Low");
  const [risk, setRisk] = useState<Prioridad>("Medium");

  useEffect(() => {
    if (show && initialScope) {
      setMarketSegment(initialScope.marketSegment || domain);
      setMarketImpact(initialScope.marketImpact || 0);
      setTechnicalComplexity(initialScope.technicalComplexity || "Low");
      setRisk(initialScope.risk || "Medium");
    }
  }, [show, initialScope, domain]);

  const handleSave = () => {
    const updatedScope: ScopeSPL = {
      ...initialScope,
      marketSegment, // Este valor ya viene del domain y no es editable
      marketImpact,
      technicalComplexity,
      risk,
    };
    onSave(updatedScope);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Scope Metrics</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {/* Market Segment – campo no editable */}
          <Form.Group controlId="scopeMarketSegment">
            <Form.Label>
              Market Segment <small className="text-muted fst-italic">(This value is derived from the product line domain)</small>
            </Form.Label>
            <Form.Control type="text" value={marketSegment} readOnly />
          </Form.Group>
          {/* Market Impact */}
          <Form.Group controlId="scopeMarketImpact" className="mt-2">
            <Form.Label>
              Market Impact (0-100) <br />
              <small className="text-muted fst-italic">
                (Reflects the commercial potential based on advanced functionalities; 0: no impact, 100: maximum impact)
              </small>
            </Form.Label>
            <Form.Control 
              type="number" 
              placeholder="Enter impact score"
              value={marketImpact}
              onChange={(e) => setMarketImpact(parseInt(e.target.value))}
              min={0}
              max={100}
            />
          </Form.Group>
          {/* Technical Complexity – ahora categórico */}
          <Form.Group controlId="scopeTechnicalComplexity" className="mt-2">
            <Form.Label>
              Technical Complexity <br />
              <small className="text-muted fst-italic">
                (Estimates the development effort for advanced functionalities; select Low, Medium, or High)
              </small>
            </Form.Label>
            <Form.Control as="select" value={technicalComplexity} onChange={(e) => setTechnicalComplexity(e.target.value as Prioridad)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </Form.Control>
          </Form.Group>
          {/* Risk */}
          <Form.Group controlId="scopeRisk" className="mt-2">
            <Form.Label>
              Risk <small className="text-muted fst-italic">(Represents the likelihood of development issues or instability)</small>
            </Form.Label>
            <Form.Control as="select" value={risk} onChange={(e) => setRisk(e.target.value as Prioridad)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </Form.Control>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Scope
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ScopeModal;
