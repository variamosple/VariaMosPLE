// BillOfMaterialsEditor.tsx

import React, { Component, ChangeEvent } from "react";
import {
  Modal,
  Button,
  Card,
  Row,
  Col,
  Form,
  InputGroup
} from "react-bootstrap";
import { Accordion, AccordionBody, AccordionHeader, AccordionItem } from "reactstrap";
import ProjectService from "../../Application/Project/ProjectService";

/** Devuelve el número del BoM_level o 99 si no está definido */
function getBoMLevel(material: any): number {
  const bomProp = material.properties?.find((p: any) => p.name === "BoM_level");
  if (bomProp && bomProp.value) {
    // Asume que "BoM_level" puede ser "level 0", "0" o "2"
    const match = bomProp.value.match(/(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  return 99;
}

/** Verifica si material tiene Quantity == "1" */
function hasQuantityOne(material: any): boolean {
  const qtyProp = material.properties?.find((p: any) => p.name === "Quantity");
  return qtyProp && qtyProp.value === "1";
}

interface BillOfMaterialsEditorProps {
  projectService: ProjectService;
  onClose: () => void; // para cerrar este editor
}

interface BillOfMaterialsEditorState {
  searchTerm: string;
  allScopeConfigurations: Array<Record<string, any>>;
  showDetailModal: boolean;
  selectedConfig: Record<string, any> | null;
  openAccordion: string[]; // IDs de accordion abiertos
  allAccordionIds: string[]; // IDs posibles para expandir/colapsar
}

export default class BillOfMaterialsEditor extends Component<
  BillOfMaterialsEditorProps,
  BillOfMaterialsEditorState
> {
  constructor(props: BillOfMaterialsEditorProps) {
    super(props);
    this.state = {
      searchTerm: "",
      allScopeConfigurations: [],
      showDetailModal: false,
      selectedConfig: null,
      openAccordion: [],
      allAccordionIds: [],
    };
  }

  componentDidMount() {
    // Cargar todas las configuraciones del scope
    this.props.projectService.getAllConfigurations(
      (configs: any[]) => {
        this.setState({ allScopeConfigurations: configs });
      },
      (error: any) => {
        console.error("Error fetching configurations:", error);
      }
    );
  }

  handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchTerm: e.target.value });
  };

  /** Retorna la lista de productos filtrados por searchTerm */
  getFilteredProducts() {
    const { searchTerm, allScopeConfigurations } = this.state;
    if (!searchTerm) return allScopeConfigurations;
    const lower = searchTerm.toLowerCase();
    return allScopeConfigurations.filter((cfg) =>
      (cfg.name || "").toLowerCase().includes(lower)
    );
  }

  /** Click en un producto del catálogo => abre modal */
  handleSelectProduct(config: Record<string, any>) {
    this.setState({
      selectedConfig: config,
      showDetailModal: true,
      openAccordion: [],
      allAccordionIds: [],
    });
  }

  handleCloseModal = () => {
    this.setState({
      showDetailModal: false,
      selectedConfig: null,
      openAccordion: [],
      allAccordionIds: [],
    });
  };

  /** Manejo de accordion individual */
  toggleAccordion(id: string) {
    this.setState((prev) => {
      const isOpen = prev.openAccordion.includes(id);
      const newOpen = isOpen
        ? prev.openAccordion.filter((item) => item !== id)
        : [...prev.openAccordion, id];
      return { openAccordion: newOpen };
    });
  }


  // =========================================================
  // Render recursivo de materiales
  // =========================================================

  /**
   * Lógica principal para obtener los “root” con BoM_level=0 (producto)
   * y luego dibujar recursivamente
   */
  renderMaterialsRecursively(config) {
    const { elements, relationships } = this.props.projectService.getStructureAndRelationships();

    // Filtrar materiales raíz según la estructura general
    const rootMaterials = elements.filter(
      (element) => !relationships.some((rel) => rel.targetId === element.id)
    );

    console.log(`Materiales raíz para config ${config.id}:`, rootMaterials);

    return rootMaterials.map((rootMaterial) =>
      this.renderMaterialAccordion(rootMaterial, config)
    );
  }

  /** 
   * Dibuja un material (si Quantity=1) y sus hijos 
   * - Genera un ID único para el AccordionItem
   * - Lo registra en this.state.allAccordionIds
   * - Llama recursivamente a hijos con boMlevel = parent's boMlevel + 1
   */
  renderMaterialAccordion(material, config, parentId = null) {
    const accordionId = `${config.id}-${parentId || "root"}-${material.id}`;

    // Obtener valores específicos de la configuración actual
    const materialWithValues = this.getMaterialWithConfigValues(material, config);

    const quantityProperty = materialWithValues.properties?.find(
      (prop) => prop.name === "Quantity"
    );
    const levelProperty = materialWithValues.properties?.find(
      (prop) => prop.name === "BoM_level"
    );

    // Si no hay propiedad "Quantity" o su valor no es "1", no renderizar el acordeón
    if (!quantityProperty || quantityProperty.value !== "1") {
      console.log(`Material ${materialWithValues.name} no cumple la condición de Quantity == "1". No se renderiza.`);
      return null;
    }
    if (!levelProperty || levelProperty.value === "Product (level 0)"){
      return (this.renderChildMaterials(material.id, config));
    }

    console.log(`Renderizando material ID: ${accordionId}`, materialWithValues);

    return (
      <AccordionItem key={accordionId}>
        <AccordionHeader targetId={accordionId}>
          {materialWithValues.name || "Unnamed Material"}
        </AccordionHeader>
        <AccordionBody accordionId={accordionId}>
          <ul>
            {materialWithValues.properties?.map((prop, index) => (
              <li key={index}>
                <strong>{prop.name}:</strong> {prop.value || "N/A"}
              </li>
            ))}
          </ul>
          {/* Renderizar materiales hijos si existen */}
          {this.renderChildMaterials(material.id, config)}
        </AccordionBody>
      </AccordionItem>
    );
  }

  /**
   * Busca en projectService los materiales que son hijos de "parentId" y que tengan boMlevel = expectedLevel,
   * con base en la relación sourceId->targetId.
   */
  renderChildMaterials(parentId, config) {
    const { elements, relationships } = this.props.projectService.getStructureAndRelationships();

    // Filtrar materiales hijos según la estructura general
    const childMaterials = elements.filter((element) =>
      relationships.some((rel) => rel.sourceId === parentId && rel.targetId === element.id)
    );

    console.log(`Materiales hijos de ${parentId} en config ${config.id}:`, childMaterials);

    return childMaterials.map((childMaterial) =>
      this.renderMaterialAccordion(childMaterial, config, parentId)
    );
  }


  /**
   * Dado un material “base” (definido en elements),
   * retorna la versión configurada (según config.features) si existe.
   */
  getMaterialWithConfigValues(material: any, config: any) {
    const configuredMat = config.features?.find(
      (f: any) => f.id === material.id
    );
    if (configuredMat) {
      return {
        ...material,
        properties: configuredMat.properties || material.properties,
      };
    }
    return material;
  }

  // =========================================================
  // Render principal
  // =========================================================

  renderSearchBar() {
    return (
      <InputGroup className="mb-3" style={{ maxWidth: "400px" }}>
        <Form.Control
          placeholder="Buscar producto..."
          value={this.state.searchTerm}
          onChange={this.handleSearchChange}
        />
      </InputGroup>
    );
  }

  renderProductsList() {
    const filtered = this.getFilteredProducts();
    if (filtered.length === 0) {
      return <p>No se encontraron productos con ese filtro.</p>;
    }

    return (
      <Row>
        {filtered.map((cfg: any) => (
          <Col md={4} key={cfg.id} style={{ marginBottom: "15px" }}>
            <Card
              style={{ cursor: "pointer" }}
              onClick={() => this.handleSelectProduct(cfg)}
            >
              {cfg.imageUrl ? (
                <Card.Img
                  variant="top"
                  src={cfg.imageUrl}
                  style={{ maxHeight: "180px", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    height: "180px",
                    backgroundColor: "#eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                  }}
                >
                  Sin imagen
                </div>
              )}
              <Card.Body>
                <Card.Title>{cfg.name || "Producto"}</Card.Title>
                {/* Podrías agregar más datos aquí */}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  renderDetailModal() {
    const { showDetailModal, selectedConfig, openAccordion } = this.state;
    if (!selectedConfig) return null;

    return (
      <Modal
        show={showDetailModal}
        onHide={this.handleCloseModal}
        fullscreen
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedConfig.name || "Detalle del Producto"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row style={{ height: "100%" }}>
            {/* Columna izquierda (1/3): Imagen */}
            <Col md={4} style={{ borderRight: "1px solid #ccc" }}>
              {selectedConfig.imageUrl ? (
                <div style={{ textAlign: "center" }}>
                  <img
                    src={selectedConfig.imageUrl}
                    alt={selectedConfig.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "80vh",
                      objectFit: "contain",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "80vh",
                    backgroundColor: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Sin imagen
                </div>
              )}
            </Col>

            {/* Columna derecha (2/3): Detalles */}
            <Col md={8} style={{ paddingLeft: "20px" }}>
              <div style={{ marginBottom: "10px" }}>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={this.handleExpandAll}
                  style={{ marginRight: "5px" }}
                >
                  Expandir Todo
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={this.handleCollapseAll}
                >
                  Colapsar Todo
                </Button>
              </div>
              <h5>Especificaciones / Funcionalidades</h5>
              <p>
                Se listan a continuación las funcionalidades con BoM_level
                creciente y <code>Quantity=1</code>.
              </p>
              <Accordion
                flush
                open={this.state.openAccordion}
                toggle={(id) => this.toggleAccordion(id)}
              >
                {this.renderMaterialsRecursively(selectedConfig)}
              </Accordion>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    );
  }

  handleExpandAll = () => {
    this.setState((prev) => ({
      openAccordion: [...prev.allAccordionIds],
    }));
  };

  handleCollapseAll = () => {
    this.setState({ openAccordion: [] });
  };

  render() {
    return (
      <div style={{ padding: "20px" }}>
        <h4>Catálogo del Scope - Bill of Materials</h4>
        <div style={{ marginBottom: "10px" }}>
          <Button variant="outline-secondary" onClick={this.props.onClose}>
            Cerrar
          </Button>
        </div>

        {this.renderSearchBar()}
        {this.renderProductsList()}
        {this.renderDetailModal()}
      </div>
    );
  }
}
