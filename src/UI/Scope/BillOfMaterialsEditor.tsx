import React, { Component } from "react";
import { Button, Modal, Form, Card, Row, Col, ListGroup } from "react-bootstrap";
import ProjectService from "../../Application/Project/ProjectService";
import { ScopeSPL } from "../../Domain/ProductLineEngineering/Entities/ScopeSPL";
import { ProductLine } from "../../Domain/ProductLineEngineering/Entities/ProductLine";

// Interfaz para describir un material base (o funcionalidad)
interface MaterialItem {
  id: string;
  name: string;
  imageUrl?: string;  // Si manejas una URL/base64 para mostrar imagen
  properties: any[];
}

// Interfaz para describir un producto potencial
interface PotentialProduct {
  id: string;
  name: string;
  materials: MaterialItem[];
}

interface BillOfMaterialsCatalogProps {
  projectService: ProjectService;// Qué línea de producto estamos usando
  onClose: () => void;         // Para cerrar este catálogo
}

interface State {
  // Materiales “globales” (del BoM base)
  globalMaterials: MaterialItem[];

  // Lista de productos potenciales (configuraciones)
  potentialProducts: PotentialProduct[];

  // Producto seleccionado en la UI
  selectedProductId: string | null;

  // Modal para editar propiedades
  showPropertiesModal: boolean;
  editingMaterial: MaterialItem | null;
}

export default class BillOfMaterialsEditor extends Component<BillOfMaterialsCatalogProps, State> {
  constructor(props: BillOfMaterialsCatalogProps) {
    super(props);
    this.state = {
      globalMaterials: [],
      potentialProducts: [],
      selectedProductId: null,
      showPropertiesModal: false,
      editingMaterial: null,
    };
  }

  componentDidMount() {
    console.log("ejecutando modelo bill of materials sin mxgraph")
    // 1) Cargar “materiales base” desde el scope (ejemplo).
    const selectedModelId = this.props.projectService.getTreeIdItemSelected();
  if (!selectedModelId) {
    return <div>No hay ningún modelo seleccionado.</div>;
  }
    const bomModel = this.props.projectService.findModelById(
      this.props.projectService.project,
      selectedModelId)
    const globalMaterials: MaterialItem[] = bomModel?.elements?.map((elem: any) => {
      return {
        id: elem.id,
        name: elem.name,
        imageUrl: elem.properties?.find((p: any) => p.name === "Image")?.value || "",
        properties: elem.properties || [],
      };
    }) || [];

    // 2) Llamar a getAllConfigurations para obtener las configuraciones (potenciales productos)
    this.props.projectService.getAllConfigurations(
      (configs: any[]) => {
        // “configs” es un array de configuraciones
        // Convertimos cada config en un PotentialProduct
        const potentialProducts: PotentialProduct[] = configs.map((cfg: any) => ({
          id: cfg.id,
          name: cfg.name || "Untitled Product",
          materials: (cfg.features || []).map((f: any) => ({
            id: f.id,
            name: f.name,
            imageUrl: f.properties?.find((p: any) => p.name === "Image")?.value || "",
            properties: f.properties || [],
          })),
        }));

        this.setState({
          globalMaterials,
          potentialProducts,
        });
      },
      (error: any) => {
        console.error("Error fetching configurations:", error);
        // Aun así seteamos los globalMaterials
        this.setState({ globalMaterials });
      }
    );
  }

  // Añade un nuevo producto vacío a la lista
  handleAddNewProduct = () => {
    const newProd: PotentialProduct = {
      id: "prod-" + Date.now(),
      name: "New Product",
      materials: [],
    };
    this.setState((prevState) => ({
      potentialProducts: [...prevState.potentialProducts, newProd],
      selectedProductId: newProd.id,
    }));
  };

  // Selecciona un producto para mostrar sus materiales
  handleSelectProduct(productId: string) {
    this.setState({ selectedProductId: productId });
  }

  // Añade un material a un producto
  handleAddMaterialToProduct(materialId: string) {
    const { selectedProductId, potentialProducts, globalMaterials } = this.state;
    if (!selectedProductId) return;

    const baseMat = globalMaterials.find((m) => m.id === materialId);
    if (!baseMat) return;

    // Clonar las propiedades para que no se modifique el “globalMaterial” original
    const clonedMaterial: MaterialItem = {
      ...baseMat,
      properties: JSON.parse(JSON.stringify(baseMat.properties)),
    };

    // Actualizar la lista de materiales en el producto seleccionado
    const updatedProducts = potentialProducts.map((prod) => {
      if (prod.id === selectedProductId) {
        return {
          ...prod,
          materials: [...prod.materials, clonedMaterial],
        };
      }
      return prod;
    });

    this.setState({ potentialProducts: updatedProducts });
  }

  // Abre el modal para editar propiedades de un material asignado
  handleOpenPropertiesModal(material: MaterialItem) {
    this.setState({
      showPropertiesModal: true,
      editingMaterial: material,
    });
  }

  // Cierra el modal sin guardar
  handleClosePropertiesModal = () => {
    this.setState({
      showPropertiesModal: false,
      editingMaterial: null,
    });
  };

  // Guarda las propiedades editadas
  handleSaveMaterialProperties = (updatedProps: any[]) => {
    const { selectedProductId, potentialProducts, editingMaterial } = this.state;
    if (!selectedProductId || !editingMaterial) return;

    // Actualizar las propiedades del material en la lista de products
    const updatedProducts = potentialProducts.map((prod) => {
      if (prod.id !== selectedProductId) return prod;
      return {
        ...prod,
        materials: prod.materials.map((mat) => {
          if (mat.id === editingMaterial.id) {
            return {
              ...mat,
              properties: updatedProps,
            };
          }
          return mat;
        }),
      };
    });

    this.setState({
      potentialProducts: updatedProducts,
      showPropertiesModal: false,
      editingMaterial: null,
    });
  };

  // Ejemplo de guardado en servidor: actualiza las configuraciones con “potentialProducts”
  handleSaveAll = () => {
    // Transforma potentialProducts a la estructura que tu server espera (por ejemplo, { id, features, ...})
    const { potentialProducts } = this.state;
    const configsToSave = potentialProducts.map((p) => ({
      id: p.id,
      name: p.name,
      features: p.materials.map((m) => ({
        id: m.id,
        name: m.name,
        properties: m.properties,
      })),
    }));

    // Llamar a la lógica de guardado
    // Por ejemplo, un UseCase de “saveMultipleConfigurations” o similar
    // O, si tu `projectService` provee una forma de “bulkSave”:
    // (esto depende totalmente de tu implementación real)
    const projectInfo = this.props.projectService.getProjectInformation();
    this.props.projectService.saveProjectInServer(
      projectInfo,
      (response) => {
        console.log("Guardado exitoso. Respuesta:", response);
      },
      (error) => {
        console.error("Error guardando:", error);
      }
    );
  };

  renderProductTabs() {
    const { potentialProducts, selectedProductId } = this.state;
    return (
      <div style={{ marginBottom: "10px" }}>
        {potentialProducts.map((prod) => (
          <Button
            key={prod.id}
            variant={prod.id === selectedProductId ? "primary" : "outline-primary"}
            style={{ marginRight: "5px" }}
            onClick={() => this.handleSelectProduct(prod.id)}
          >
            {prod.name}
          </Button>
        ))}
        <Button variant="success" onClick={this.handleAddNewProduct}>
          + Add Product
        </Button>
      </div>
    );
  }

  renderGlobalMaterialsCatalog() {
    const { globalMaterials, selectedProductId } = this.state;
    if (!selectedProductId) {
      return <p>Please select a product first.</p>;
    }

    return (
      <Row>
        {globalMaterials.map((mat) => (
          <Col md={4} key={mat.id} style={{ marginBottom: "15px" }}>
            <Card>
              {mat.imageUrl ? (
                <Card.Img variant="top" src={mat.imageUrl} style={{ maxHeight: "120px", objectFit: "cover" }} />
              ) : (
                <div style={{ height: "120px", backgroundColor: "#ccc" }}>No image</div>
              )}
              <Card.Body>
                <Card.Title>{mat.name}</Card.Title>
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => this.handleAddMaterialToProduct(mat.id)}
                >
                  Add to Product
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  renderSelectedProductDetails() {
    const { potentialProducts, selectedProductId } = this.state;
    if (!selectedProductId) return null;

    const product = potentialProducts.find((p) => p.id === selectedProductId);
    if (!product) return <p>Invalid product</p>;

    return (
      <div style={{ marginTop: "20px" }}>
        <h5>Materials in "{product.name}"</h5>
        {product.materials.length === 0 ? (
          <p>No materials added yet.</p>
        ) : (
          <ListGroup>
            {product.materials.map((m) => (
              <ListGroup.Item key={m.id}>
                {m.name}
                {" "}
                <Button
                  variant="link"
                  onClick={() => this.handleOpenPropertiesModal(m)}
                >
                  Edit Properties
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>
    );
  }

  renderPropertiesModal() {
    const { showPropertiesModal, editingMaterial } = this.state;
    if (!editingMaterial) return null;

    return (
      <Modal show={showPropertiesModal} onHide={this.handleClosePropertiesModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Material Properties - {editingMaterial.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingMaterial.properties.map((prop, idx) => (
            <Form.Group key={idx} className="mb-2">
              <Form.Label>{prop.name}</Form.Label>
              <Form.Control
                type="text"
                value={prop.value || ""}
                onChange={(e) => {
                  const newVal = e.target.value;
                  // Actualizar in-place en editingMaterial
                  // Si editingMaterial es no nulo:
                  if (!this.state.editingMaterial) return;

                  const updatedProps = this.state.editingMaterial.properties.map((prop, i) => {
                    if (i === idx) {
                      return { ...prop, value: newVal };
                    }
                    return prop;
                  });

                  this.setState({
                    editingMaterial: {
                      ...this.state.editingMaterial,
                      properties: updatedProps,
                    },
                  });

                }}
              />
            </Form.Group>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClosePropertiesModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (this.state.editingMaterial) {
                this.handleSaveMaterialProperties(this.state.editingMaterial.properties);
              }
            }}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  render() {
    return (
      <div style={{ padding: "15px" }}>
        <h4>Catalog for My product line</h4>
        <Button variant="primary" onClick={this.props.onClose} style={{ marginBottom: "10px" }}>
          Close Catalog
        </Button>

        {/* Sección de tabs/botones de productos */}
        {this.renderProductTabs()}

        <hr />
        <div>
          <h5>Available Materials</h5>
          {this.renderGlobalMaterialsCatalog()}
        </div>

        {this.renderSelectedProductDetails()}

        <hr />
        <Button variant="success" onClick={this.handleSaveAll}>
          Save All
        </Button>

        {this.renderPropertiesModal()}
      </div>
    );
  }
}
