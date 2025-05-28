import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col} from "react-bootstrap";
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
  const [derivedSystems, setDerivedSystems] = useState<string[]>([]);
  const [techConstraints, setTechConstraints] = useState<string[]>([]);
  const [regulatoryConstraints, setRegulatoryConstraints] = useState<string[]>([]);
  const [evolutionStrategy, setEvolutionStrategy] = useState("");

  useEffect(() => {
    if (show && initialScope) {
      setMarketSegment(initialScope.marketSegment || domain);
      setMarketImpact(initialScope.marketImpact || 0);
      setTechnicalComplexity(initialScope.technicalComplexity || "Low");
      setRisk(initialScope.risk || "Medium");
      setDerivedSystems(initialScope.derivedSystems || []);
      setTechConstraints(initialScope.techConstraints || []);
      setRegulatoryConstraints(initialScope.regulatoryConstraints || []);
      setEvolutionStrategy(initialScope.evolutionStrategy || "");
    }
  }, [show, initialScope, domain]);

  const handleSave = () => {
    const updatedScope: ScopeSPL = {
      ...initialScope,
      marketSegment, // Este valor ya viene del domain y no es editable
      marketImpact,
      technicalComplexity,
      risk,
      derivedSystems,
      techConstraints,
      regulatoryConstraints,
      evolutionStrategy,
    };
    onSave(updatedScope);
    onHide();
  };

  const handleListChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number, value: string) => {
    setter(prev => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  };
  const addListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter(prev => [...prev, ""]);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Scope Metrics</Modal.Title>
      </Modal.Header>
      <Modal.Body
      style={{
          maxHeight: "70vh",
          overflowY: "auto",
          paddingRight: "1rem",
        }}>
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
           {/* 2. Derived Systems */}
          <Form.Group controlId="scopeDerivedSystems" className="mt-4">
            <Form.Label>Derived Systems Types</Form.Label>
            <div className="d-flex align-items-center mb-2">
              <Button size="sm" onClick={() => addListItem(setDerivedSystems)}>+ Add System</Button>
            </div>
            {derivedSystems.map((item, idx) => (
              <Row key={idx} className="mb-2">
                <Col xs={10}>
                  <Form.Control
                    type="text"
                    placeholder="e.g. drones, autonomous submarines"
                    value={item}
                    onChange={e => handleListChange(setDerivedSystems, idx, e.target.value)}
                  />
                </Col>
                <Col xs={2}>
                  <Button variant="outline-secondary" size="sm"
                          onClick={() => setDerivedSystems(prev => prev.filter((_, i) => i !== idx))}>
                    ×
                  </Button>
                </Col>
              </Row>
            ))}
          </Form.Group>

          {/* 3. Technical Constraints */}
          <Form.Group controlId="scopeTechConstraints" className="mt-4">
            <Form.Label>Technical Constraints</Form.Label>
            <div className="d-flex align-items-center mb-2">
              <Button size="sm" onClick={() => addListItem(setTechConstraints)}>+ Add Constraint</Button>
            </div>
            {techConstraints.map((item, idx) => (
              <Row key={idx} className="mb-2">
                <Col xs={10}>
                  <Form.Control
                    type="text"
                    placeholder="e.g. STANAG, DO-178C"
                    value={item}
                    onChange={e => handleListChange(setTechConstraints, idx, e.target.value)}
                  />
                </Col>
                <Col xs={2}>
                  <Button variant="outline-secondary" size="sm"
                          onClick={() => setTechConstraints(prev => prev.filter((_, i) => i !== idx))}>
                    ×
                  </Button>
                </Col>
              </Row>
            ))}
          </Form.Group>

          {/* 4. Regulatory Constraints */}
          <Form.Group controlId="scopeRegulatoryConstraints" className="mt-4">
            <Form.Label>Regulatory Constraints</Form.Label>
            <div className="d-flex align-items-center mb-2">
              <Button size="sm" onClick={() => addListItem(setRegulatoryConstraints)}>+ Add Constraint</Button>
            </div>
            {regulatoryConstraints.map((item, idx) => (
              <Row key={idx} className="mb-2">
                <Col xs={10}>
                  <Form.Control
                    type="text"
                    placeholder="e.g. GDPR"
                    value={item}
                    onChange={e => handleListChange(setRegulatoryConstraints, idx, e.target.value)}
                  />
                </Col>
                <Col xs={2}>
                  <Button variant="outline-secondary" size="sm"
                          onClick={() => setRegulatoryConstraints(prev => prev.filter((_, i) => i !== idx))}>
                    ×
                  </Button>
                </Col>
              </Row>
            ))}
          </Form.Group>

          {/* 5. Evolution Strategy */}
          <Form.Group controlId="scopeEvolution" className="mt-4">
            <Form.Label>Evolution Strategy</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              style={{ resize: "vertical", padding: "0.75rem" }}
              placeholder="Describe what will NOT be included in phase 1 and the roadmap for future evolution"
              value={evolutionStrategy}
              onChange={e => setEvolutionStrategy(e.target.value)}
            />
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
