import React, { useState, useEffect, ChangeEvent } from 'react';
import { Modal, Button, Form } from "react-bootstrap";
import { IoIosAddCircle } from "react-icons/io";
import { TiDelete } from "react-icons/ti";
import { MdEdit } from "react-icons/md";
import ProjectService from '../../Application/Project/ProjectService';
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";
import { Language } from '../../Domain/ProductLineEngineering/Entities/Language';
import { Relationship } from "../../Domain/ProductLineEngineering/Entities/Relationship";
import { Model } from '../../Domain/ProductLineEngineering/Entities/Model';

// Definición básica para un elemento del modelo:
interface MaterialElement {
  id: string;
  name: string;
  type: string; // en este caso será "Material"
  parentId?: string | null;
  properties: Array<{
    id: string;
    name: string;
    value: string;
    possibleValues?: string;
  }>;
}

interface NewProduct {
  id: string;
  name: string;
  imageUrl: string;
  features: MaterialElement[];
}

interface NewProductManagerProps {
  projectService: ProjectService;
}

const ProductCatalogManager: React.FC<NewProductManagerProps> = ({ projectService }) => {
  // Estados para el modal de creación de producto
  const [showProductModal, setShowProductModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<MaterialElement[]>([]);

  // Estados para el modal de edición de funcionalidad
  const [showEditFeatureModal, setShowEditFeatureModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<MaterialElement | null>(null);

  // Modelo actual (el “Catálogo de productos potenciales”).
  const currentModel = projectService.currentModel;
  // Estructura y relaciones
  const { elements = [], relationships = [] } = projectService.getStructureAndRelationships();

  // ============================================================
  // 1. Función para obtener los hijos de un elemento
  // ============================================================
  function getChildElements(parentId: string): MaterialElement[] {
    return elements.filter((el) =>
      relationships.some((rel) => rel.sourceId === parentId && rel.targetId === el.id)
    );
  }

  // ============================================================
  // 2. Renderizado recursivo de funcionalidades disponibles
  // ============================================================
  function renderFunctionalityNode(func: MaterialElement, indent: number = 0) {
    const isSelected = selectedFeatures.some(f => f.id === func.id);

    return (
      <div
        key={func.id}
        style={{
          marginLeft: indent,
          padding: '4px 0',
          borderLeft: indent ? '1px solid #ccc' : 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{func.name}</span>
          <div>
            {/* Botón para agregar esta funcionalidad al producto */}
            {!isSelected && (
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => handleAddFeature(func)}
                style={{ marginLeft: '5px' }}
              >
                <IoIosAddCircle size={18} />
              </Button>
            )}
            {/* Botón para crear sub-funcionalidad hija de esta */}
            <Button
  variant="outline-secondary"
  size="sm"
  onClick={() => handleAddSubFunctionality(func.id, projectService, currentModel, forceUpdateModel)}
  style={{ marginLeft: '5px' }}
>
  + Sub
</Button>

          </div>
        </div>
        {/* Render recursivo de los hijos */}
        {getChildElements(func.id).map(child => renderFunctionalityNode(child, indent + 20))}
      </div>
    );
  }

  function renderAvailableFunctionalities() {
    const rootElements = elements.filter(
      (el) => !relationships.some((rel) => rel.targetId === el.id)
    );
    return rootElements.map((el) => renderFunctionalityNode(el));
  }

  // ============================================================
  // 3. Lógica para agregar/editar/quitar funcionalidades al producto
  // ============================================================
  function handleAddFeature(feature: MaterialElement) {
    if (!selectedFeatures.find(f => f.id === feature.id)) {
      setSelectedFeatures([...selectedFeatures, { ...feature }]);
    }
  }

  function handleRemoveFeature(id: string) {
    setSelectedFeatures(selectedFeatures.filter(f => f.id !== id));
  }

  function handleEditFeature(feature: MaterialElement) {
    setEditingFeature(feature);
    setShowEditFeatureModal(true);
  }

  function handleSaveEditedFeature(updatedFeature: MaterialElement) {
    setSelectedFeatures(selectedFeatures.map(f => f.id === updatedFeature.id ? updatedFeature : f));
    setShowEditFeatureModal(false);
    setEditingFeature(null);
  }

  // ============================================================
  // 4. Guardar el producto completo
  // ============================================================
  function handleSaveProduct() {
    const newProduct: NewProduct = {
      id: Date.now().toString(),
      name: productName,
      imageUrl: productImageUrl,
      features: selectedFeatures,
    };
    // Podrías llamar a un método en projectService para persistirlo
    console.log("Nuevo Producto Creado:", newProduct);

    // Limpiar estados
    setProductName('');
    setProductImageUrl('');
    setSelectedFeatures([]);
    setShowProductModal(false);
  }

  // ============================================================
  // 5. “Agregar Sub-Funcionalidad” (nuevo Material) a un padre
  // ============================================================
  function handleAddSubFunctionality(parentId: string, projectService: ProjectService, currentModel: Model, forceUpdateModel: () => void) {
    // Crear un nuevo elemento de tipo "Material" con un nombre por defecto
    const newElement = createMaterialElement(parentId, "New Material", projectService, currentModel);
  
    // Insertarlo en el modelo actual
    currentModel.elements.push(newElement);
  
    // Crear la relación padre->hijo y agregarla al modelo
    const newRel = createRelationshipContains(parentId, newElement.id, projectService);
    currentModel.relationships.push(newRel);
  
    // Disparar eventos para notificar que se creó el elemento
    projectService.raiseEventCreatedElement(currentModel, newElement);
    projectService.raiseEventUpdatedElement(currentModel, newElement);
    projectService.raiseEventSelectedElement(currentModel, newElement);
  
    // Forzar un re-render en la UI (por ejemplo, actualizando un estado)
    forceUpdateModel();
  }
  

  // ============================================================
  // 6. Funciones auxiliares para crear el elemento y la relación
  // ============================================================
  function createMaterialElement(
    parentId: string,
    defaultName: string,
    projectService: ProjectService,
    currentModel: Model // se pasa el modelo actual para usar su tipo, por ejemplo.
  ): Element {
    // Obtenemos la definición del lenguaje y parseamos abstractSyntax si es string.
    let languageDef = projectService.getLanguageDefinition("" + currentModel.type);
    let abstractSyntax: any = languageDef.abstractSyntax;
    if (typeof abstractSyntax === "string") {
      abstractSyntax = JSON.parse(abstractSyntax);
    }
    const matDef = abstractSyntax?.elements?.Material;
  
    const newId = projectService.generateId();
    // Mapeamos las propiedades definidas en la definición del elemento Material
    const newProps: Property[] = (matDef?.properties || []).map((p: any) => {
      return new Property(
        p.name,
        p.defaultValue || "",
        p.type,
        p.options,
        p.linked_property,
        p.linked_value,
        false,
        true,
        p.comment,
        p.possibleValues,
        p.possibleValuesLinks,
        p.minCardinality,
        p.maxCardinality,
        p.constraint,
        p.defaultValue
      );
    });
  
    const newElement: Element = {
      id: newId,
      name: defaultName,
      type: "Material",
      x: 0,
      y: 0,
      width: 120,
      height: 50,
      parentId: parentId,
      properties: newProps,
      sourceModelElements: [],
      instanceOfId: null
    };
  
    return newElement;
  }

  function createRelationshipContains(
    sourceId: string,
    targetId: string,
    projectService: ProjectService
  ): Relationship {
    const relId = projectService.generateId();
    return {
      id: relId,
      name: "_",
      type: "Extends", // o el tipo adecuado en tu DSL
      sourceId: sourceId,
      targetId: targetId,
      points: [],
      min: 0,
      max: 999999,
      properties: [
        new Property(
          "Type",
          "Contains",
          "String",
          undefined,
          undefined,
          undefined,
          false,
          true,
          "",
          "Contains",
          undefined,
          0,
          0,
          "",
          "Contains"
        )
      ]
    };
  }

  // Pequeño truco para forzar re-render cuando mutamos el modelo
  const [, setModelVersion] = useState(0);
  function forceUpdateModel() {
    setModelVersion(v => v + 1);
  }

  // ============================================================
  // 7. Modal para editar propiedades de una funcionalidad
  // ============================================================
  const EditFeatureModal: React.FC<{
    show: boolean;
    feature: MaterialElement;
    onClose: () => void;
    onSave: (updatedFeature: MaterialElement) => void;
  }> = ({ show, feature, onClose, onSave }) => {
    const [localFeature, setLocalFeature] = useState(feature);

    useEffect(() => {
      setLocalFeature(feature);
    }, [feature]);

    const handlePropertyChange = (index: number, value: string) => {
      const updatedProps = [...localFeature.properties];
      updatedProps[index] = { ...updatedProps[index], value };
      setLocalFeature({ ...localFeature, properties: updatedProps });
    };

    return (
      <Modal show={show} onHide={onClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar Funcionalidad: {localFeature.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {localFeature.properties.map((prop, index) => (
              <Form.Group key={prop.id} controlId={`prop-${prop.id}`}>
                <Form.Label>{prop.name}</Form.Label>
                {prop.possibleValues ? (
                  <Form.Control
                    as="select"
                    value={prop.value}
                    onChange={(e) =>
                      handlePropertyChange(index, (e.target as unknown as HTMLSelectElement).value)
                    }
                  >
                    {prop.possibleValues.split(',').map((val) => (
                      <option key={val.trim()} value={val.trim()}>{val.trim()}</option>
                    ))}
                  </Form.Control>
                ) : (
                  <Form.Control
                    type="text"
                    value={prop.value}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handlePropertyChange(index, e.target.value)}
                  />
                )}
              </Form.Group>
            ))}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => onSave(localFeature)}>Guardar Cambios</Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // ============================================================
  // Render principal
  // ============================================================
  return (
    <div style={{ margin: '20px 0' }}>
      <Button variant="primary" onClick={() => setShowProductModal(true)}>
        Agregar Nuevo Producto
      </Button>

      <Modal
        show={showProductModal}
        onHide={() => setShowProductModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Nuevo Producto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="newProductName">
              <Form.Label>Nombre del Producto</Form.Label>
              <Form.Control
                type="text"
                value={productName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setProductName(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="newProductImage">
              <Form.Label>URL de Imagen</Form.Label>
              <Form.Control
                type="text"
                value={productImageUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setProductImageUrl(e.target.value)}
              />
            </Form.Group>
            <hr />
            <h5>Seleccionar Funcionalidades (del catálogo)</h5>
            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid #ccc',
                padding: '10px'
              }}
            >
              {renderAvailableFunctionalities()}
            </div>
            <hr />
            <h5>Funcionalidades Seleccionadas</h5>
            <div>
              {selectedFeatures.length === 0 ? (
                <p>Ninguna funcionalidad seleccionada.</p>
              ) : (
                selectedFeatures.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '5px 0'
                    }}
                  >
                    <span>{f.name}</span>
                    <div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEditFeature(f)}
                        style={{ marginRight: '5px' }}
                      >
                        <MdEdit size={18} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveFeature(f.id)}
                      >
                        <TiDelete size={20} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProductModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveProduct}>Guardar Producto</Button>
        </Modal.Footer>
      </Modal>

      {editingFeature && (
        <EditFeatureModal
          show={showEditFeatureModal}
          feature={editingFeature}
          onClose={() => {
            setShowEditFeatureModal(false);
            setEditingFeature(null);
          }}
          onSave={handleSaveEditedFeature}
        />
      )}
    </div>
  );
};

export default ProductCatalogManager;
