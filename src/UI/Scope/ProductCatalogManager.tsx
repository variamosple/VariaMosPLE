import React, { useState, useEffect, ChangeEvent } from 'react';
import { Modal, Button, Form } from "react-bootstrap";
import { IoIosAddCircle } from "react-icons/io";
import { TiDelete } from "react-icons/ti";
import { MdEdit } from "react-icons/md";
import { FaTrashAlt } from "react-icons/fa";
import { MdLibraryAdd } from "react-icons/md";
import ProjectService from '../../Application/Project/ProjectService';
import { Element } from '../../Domain/ProductLineEngineering/Entities/Element';
import { Property } from '../../Domain/ProductLineEngineering/Entities/Property';
import { Relationship } from '../../Domain/ProductLineEngineering/Entities/Relationship';
import { Model } from '../../Domain/ProductLineEngineering/Entities/Model';
import EditFeatureModal from './EditFeatureModal';
import { ConfigurationInformation } from '../../Domain/ProductLineEngineering/Entities/ConfigurationInformation';
import './scope.css';
import { v4 as uuidv4 } from 'uuid';

interface NewProductManagerProps {
  projectService: ProjectService;
   onCloseAllModals?: () => void;
  //onClose: () => void;
}

const NewProductManager: React.FC<NewProductManagerProps> = ({ projectService, onCloseAllModals }) => {
  // Estado para mostrar/ocultar el modal de edición de configuración (nuevo producto)
  const [showProductModal, setShowProductModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  // En este caso, usamos el listado de IDs de funcionalidades que están activas (Quantity = "1")
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  // Para edición de propiedades de un elemento
  const [showEditFeatureModal, setShowEditFeatureModal] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);

  // Obtenemos el modelo actual (se asume que es el "Catalog of potential products")
  const currentModel: Model = projectService.currentModel;
  // Obtenemos la estructura (elementos y relaciones) a través del projectService
  const { elements = [], relationships = [] } = projectService.getStructureAndRelationships();
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState("");

  // Fuerza re-render en el componente (por ejemplo, para actualizar cambios en el modelo)
  const [, setModelVersion] = useState(0);
  const forceUpdateModel = () => setModelVersion(v => v + 1);

  // al inicio de tu componente, tras tus otros useState…
useEffect(() => {
  if (showProductModal) {
    // Si no hay NINGÚN elemento Material, creamos el root por defecto
    const hasAnyMaterial = currentModel.elements.some(el => el.type === "Material");
    if (!hasAnyMaterial) {
      const newId = projectService.generateId();
      const productLineName = projectService.getProductLineSelected().name;
      // Propiedad Quantity = "1"
      const qtyProp = new Property(
        "Quantity", "1", "String",
        undefined, undefined, undefined,
        false, true, "", "", undefined,
        0, 0, "", "1"
      );
      // Propiedad BoM_level = "Product (level 0)"
      const levelProp = new Property(
        "BoM_level", "Product (level 0)", "String",
        undefined, undefined, undefined,
        false, true, "", "", undefined,
        0, 0, "", "Product (level 0)"
      );
      const rootMaterial: Element = {
        id: newId,
        name: productLineName,
        type: "Material",
        x: 0, y: 0, width: 120, height: 50,
        parentId: null,
        properties: [qtyProp, levelProp],
        sourceModelElements: [],
        instanceOfId: null
      };
      currentModel.elements.push(rootMaterial);
      // dispara el evento para que lo guarde/reporte
      projectService.raiseEventCreatedElement(currentModel, rootMaterial);
      forceUpdateModel();
    }
  }
}, [showProductModal]);

  // -----------------------------------------------------------------
  // Renderizado recursivo de la estructura de funcionalidades disponibles
  // -----------------------------------------------------------------
  const getChildElements = (parentId: string): Element[] => {
    return elements.filter((el: Element) =>
      relationships.some((rel: Relationship) => rel.sourceId === parentId && rel.targetId === el.id)
    );
  };

  /**
   * Generamos un árbol recursivo utilizando <ul> y <li>
   * y usaremos <span> o <div> con clases específicas para
   * dibujar líneas verticales/horizontales (css).
   */
  function renderAvailableFunctionalities() {
    console.log("id del usuario: ", projectService.getUser());
    //console.log("id del usuario: ", projectService.user);
    const rootElements = elements.filter((el: Element) =>
      !relationships.some((rel: Relationship) => rel.targetId === el.id)
    );
    return (
      <ul className="hierarchical-list">
        {rootElements.map((el) => renderFunctionalityNode(el))}
      </ul>
    );
  }

  const [showOptionsForId, setShowOptionsForId] = useState<string | null>(null);

  function toggleNodeOptions(id: string) {
    setShowOptionsForId((prev) => (prev === id ? null : id));
  }

  
  /**
   * Versión recursiva, con <ul> anidado para los hijos.
   * Usamos <li> para cada elemento, y dentro un contenedor
   * con la “burbuja” o “nodo” (display: inline-block).
   */

  const renderFunctionalityNode = (elem: Element): JSX.Element | null => {
    // Procesamos solo nodos de tipo "Material"
    if (elem.type !== "Material") return null;

    const isSelected = selectedFeatureIds.includes(elem.id);
    const childElements: Element[] = getChildElements(elem.id);

    return (
      <li
        key={elem.id}
        className="tree-node"
        onMouseEnter={() => setShowOptionsForId(elem.id)}
        onMouseLeave={() => setShowOptionsForId(null)}
      >
        <div className={`node-content ${isSelected ? "selected" : ""}`}>
          <span className="node-title">{elem.name}</span>
          {showOptionsForId === elem.id && (
            <div className="node-toolbar">
              {!isSelected && (
                <button
                style={{
                  marginLeft: "5px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#7aaf57"
                }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("elemento ", elem.id)
                    handleSelectFeature(elem.id);
                  }}
                  title="Enable functionality"
                >
                  <IoIosAddCircle size={25} />
                </button>
              )}
              {isSelected && (
                <>
                  <button
                  style={{
                    marginLeft: "5px",
                    border: "none",
                    backgroundColor: "transparent",
                  }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditFeature(elem.id);
                    }}
                    title="Edit properties"
                  >
                    <MdEdit size={25} />
                  </button>
                  <button
                  style={{
                    marginLeft: "5px",
                    border: "none",
                    backgroundColor: "transparent",
                    color:"#d56e5a"
                  }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeselectFeature(elem.id);
                    }}
                    title="Disable functionality"
                  >
                    <TiDelete size={25} />
                  </button>
                </>
              )}
              <button
              style={{
                marginLeft: "5px",
                border: "none",
                backgroundColor: "transparent",
              }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddSubFunctionality(elem.id);
                }}
                title="Add subfunctionality"
              >
                <MdLibraryAdd size={25} />
              </button>
              <button
              style={{
                marginLeft: "5px",
                border: "none",
                backgroundColor: "transparent",
              }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFunctionality(elem.id);
                }}
                title="Delete functionality of potential products"
              >
                <FaTrashAlt />
              </button>
            </div>
          )}
        </div>

        {childElements.length > 0 && (
          <ul className="children-list">
            {childElements.map((child) => renderFunctionalityNode(child))}
          </ul>
        )}
      </li>
    );
  };




  const handleConfirmAddSubFunctionality = () => {
    if (!selectedParentId || newSubName.trim() === "") {
      alert("Por favor, ingrese un nombre válido para la sub-funcionalidad.");
      return;
    }
    // Crea el nuevo elemento usando el nombre ingresado
    const newElement = createMaterialElement(
      selectedParentId,
      newSubName,
      projectService,
      currentModel
    );
    currentModel.elements.push(newElement);

    // Crea la relación "Contains" entre el padre y el nuevo elemento
    const newRel = createRelationshipContains(
      selectedParentId,
      newElement.id,
      projectService
    );
    currentModel.relationships.push(newRel);

    // Marca la nueva funcionalidad como seleccionada (Quantity = "1")
    setSelectedFeatureIds([...selectedFeatureIds, newElement.id]);

    // Dispara los eventos para notificar la creación y actualización
    projectService.raiseEventCreatedElement(currentModel, newElement);
    projectService.raiseEventUpdatedElement(currentModel, newElement);
    projectService.saveProjectInServer(projectService.getProjectInformation(), null, null);

    forceUpdateModel();
    setShowAddSubModal(false);
    setNewSubName("");
    setSelectedParentId(null);

  };


  // -----------------------------------------------------------------
  // Manejadores para seleccionar/deseleccionar funcionalidades
  // -----------------------------------------------------------------
  const handleSelectFeature = (id: string) => {
    if (!selectedFeatureIds.includes(id)) {
      setSelectedFeatureIds([...selectedFeatureIds, id]);
    }
  };

  const handleDeselectFeature = (id: string) => {
    setSelectedFeatureIds(selectedFeatureIds.filter(fid => fid !== id));
  };

  // Para editar propiedades, guardamos el id de la funcionalidad a editar.
  const handleEditFeature = (id: string) => {
    console.log("Abriendo modal de edición para el feature con id:", id);
    setEditingFeatureId(id);
    setShowEditFeatureModal(true);
  };

  // -----------------------------------------------------------------
  // Función para agregar una sub-funcionalidad (nueva "Material")
  // -----------------------------------------------------------------

  /*
  const handleAddSubFunctionality = (parentId: string) => {
    // Creamos un nuevo elemento "Material" a partir de la definición del lenguaje.
    const newElement = createMaterialElement(parentId, "New Material", projectService, currentModel);
    // Insertamos en el modelo actual.
    currentModel.elements.push(newElement);
    // Creamos la relación "Contains" entre el padre y el nuevo elemento.
    const newRel = createRelationshipContains(parentId, newElement.id, projectService);
    currentModel.relationships.push(newRel);
    // Marcamos la nueva funcionalidad como seleccionada (Quantity = "1")
    setSelectedFeatureIds([...selectedFeatureIds, newElement.id]);
    // Disparamos eventos para notificar la creación y actualización.
    projectService.raiseEventCreatedElement(currentModel, newElement);
    projectService.raiseEventUpdatedElement(currentModel, newElement);
    forceUpdateModel();
  };
*/
  const handleAddSubFunctionality = (parentId: string) => {
    setSelectedParentId(parentId);
    setShowAddSubModal(true);
  };
const handleUploadProductImage = (file: File) => {
  const MAX_INPUT_SIZE = 1024 * 1024;    // 1 MB
  const TARGET_SIZE = 500 * 1024;        // 500 KB

  // Helper: load a File into an HTMLImageElement
  const loadImage = (blob: Blob): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });

  // Helper: draw the image at given width/height into a canvas and return dataURL at quality 0.9
  const drawToCanvas = (img: HTMLImageElement, width: number, height: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
  };

  // Helper: given an Image, repeatedly scale down by half until the dataURL length is below TARGET_SIZE
  const compressUntilOkay = async (img: HTMLImageElement): Promise<string> => {
    let width = img.width;
    let height = img.height;
    let dataURL: string;

    // initial draw at full size & quality=0.9
    let canvas = drawToCanvas(img, width, height);
    dataURL = canvas.toDataURL("image/jpeg", 0.9);
    while (dataURL.length > TARGET_SIZE * 1.37) {
      // length ≈ base64 string size in bytes × 1.37 → rough conversion
      width = Math.floor(width * 0.75);
      height = Math.floor(height * 0.75);
      canvas = drawToCanvas(img, width, height);
      // you can also decrease quality if needed. try quality=0.8
      dataURL = canvas.toDataURL("image/jpeg", 0.8);
      // loop until small enough
    }
    return dataURL.split(",")[1]; // strip "data:image/jpeg;base64," prefix
  };

  const processFile = async () => {
    try {
      // If already smaller than 1 MB, skip compress step:
      if (file.size <= MAX_INPUT_SIZE) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const base64Data = result.includes(",") ? result.split(",")[1] : result;
          finalizeUpload(base64Data);
        };
        reader.readAsDataURL(file);
      } else {
        // Otherwise, load image, compress, then continue:
        const img = await loadImage(file);
        const compressedBase64 = await compressUntilOkay(img);
        finalizeUpload(compressedBase64);
      }
    } catch (err) {
      alert("Failed to process image. Please try a smaller file.");
      console.error(err);
    }
  };

  // After obtaining a base64 string < 500 KB, create element + Property
  const finalizeUpload = (base64Data: string) => {
    const newProductId = projectService.generateId();
    const productImageProp = new Property(
      "Product_image",   // name
      base64Data,        // value
      "Image",           // type
      undefined,
      undefined,
      undefined,
      false,
      true,
      "",
      "",
      undefined,
      0,
      0,
      "",
      base64Data
    );

    const newProduct: Element = {
      id: newProductId,
      name: "product image",
      type: "Product",
      x: 350,
      y: 200,
      width: 200,
      height: 150,
      parentId: null,
      properties: [productImageProp],
      sourceModelElements: [],
      instanceOfId: null
    };

    currentModel.elements.push(newProduct);
    projectService.raiseEventCreatedElement(currentModel, newProduct);
    projectService.raiseEventUpdatedElement(currentModel, newProduct);
    forceUpdateModel();
  };

  processFile();
};



  const handleDeleteFunctionality = (featureId: string) => {
    // Array para almacenar los IDs del elemento a eliminar y todos sus descendientes.
    const idsToDelete: string[] = [];

    // Función recursiva para recolectar los IDs de todos los descendientes.
    const collectDescendantIds = (id: string) => {
      idsToDelete.push(id);
      // Buscar relaciones cuyo source sea este id (los hijos directos)
      const childRels = currentModel.relationships.filter(
        (rel: Relationship) => rel.sourceId === id
      );
      childRels.forEach((rel) => {
        collectDescendantIds(rel.targetId);
      });
    };

    // Inicia la recolección desde el featureId a eliminar.
    collectDescendantIds(featureId);

    // Elimina del modelo todos los elementos cuyos IDs estén en idsToDelete.
    currentModel.elements = currentModel.elements.filter(
      (elem: Element) => !idsToDelete.includes(elem.id)
    );

    // Elimina las relaciones que involucren alguno de esos elementos (como source o target).
    currentModel.relationships = currentModel.relationships.filter(
      (rel: Relationship) =>
        !idsToDelete.includes(rel.sourceId) && !idsToDelete.includes(rel.targetId)
    );

    // Actualiza la lista de funcionalidades seleccionadas (selectedFeatureIds)
    setSelectedFeatureIds(selectedFeatureIds.filter((id: string) => !idsToDelete.includes(id)));

    // Dispara algún evento para notificar la actualización del modelo (puedes adaptar según tus necesidades)
    projectService.raiseEventUpdatedElement(currentModel, null);
    projectService.saveProjectInServer(projectService.getProjectInformation(), null, null);

    // Forzamos el re-render para que se reflejen los cambios
    forceUpdateModel();
  };


  // -----------------------------------------------------------------
  // Funciones auxiliares para crear un nuevo "Material" y su relación
  // -----------------------------------------------------------------
  function createMaterialElement(
    parentId: string,
    defaultName: string,
    projectService: ProjectService,
    currentModel: Model
  ): Element {
    let languageDef = projectService.getLanguageDefinition("" + currentModel.type);
    let abstractSyntax: any = languageDef.abstractSyntax;
    if (typeof abstractSyntax === "string") {
      abstractSyntax = JSON.parse(abstractSyntax);
    }
    const matDef = abstractSyntax?.elements?.Material;
    const newId = projectService.generateId();
    // Construir las propiedades; para "Quantity" asignamos "1" por defecto.
    const newProps: Property[] = (matDef?.properties || []).map((p: any) => {
      let defaultVal = p.defaultValue || "";
      if (p.name === "Quantity") {
        defaultVal = "1";
      }
      return new Property(
        p.name,
        defaultVal,
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
        defaultVal
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
      type: "Extends",
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

  // -----------------------------------------------------------------
  // Función para "guardar" la configuración del producto
  // Actualiza el valor de la propiedad "Quantity" en cada elemento del modelo
  // según si está seleccionado o no, y llama a la función para persistir la configuración.
  // -----------------------------------------------------------------

  /*
  const handleSaveProduct = () => {
    // Actualizamos la propiedad "Quantity" de cada elemento Material en el modelo.
    currentModel.elements.forEach((elem: Element) => {
      if (elem.type === "Material") {
        const qProp = elem.properties.find(p => p.name === "Quantity");
        if (qProp) {
          if (selectedFeatureIds.includes(elem.id)) {
            qProp.value = "1";
          } else {
            qProp.value = "0";
          }
        }
      }
    });
    // Llamamos a la función para guardar la configuración en el project.
    projectService.raiseEventRequestSaveConfigurationListener(projectService.project, currentModel.id);
    forceUpdateModel();
    setShowProductModal(false);
  };
*/
  const handleSaveProduct = () => {

    // Actualiza la propiedad "Quantity" de cada elemento Material en el modelo actual
    currentModel.elements.forEach((elem: Element) => {
      if (elem.type === "Material") {
        const qProp = elem.properties.find(p => p.name === "Quantity");
        if (qProp) {
          qProp.value = selectedFeatureIds.includes(elem.id) ? "1" : "0";
        }
      }
    });

    // Construye el objeto de configuración usando la estructura requerida
    const configurationInformation = new ConfigurationInformation(
      uuidv4(),                            // id (usamos el id actual para actualizar)
      productName,                                  // config_name (y también se asigna al name)
      projectService.getTreeIdItemSelected(),       // id_feature_model: se asume que es el id del modelo actual
      projectService.project                        // project_json: el proyecto completo
    );

    // Define callbacks para el guardado
    const successCallback = (e: any) => {
      alert("Configuración guardada.");
      // Forzamos la actualización del modelo (por ejemplo, refrescando la lista de configuraciones)
      forceUpdateModel();
      onCloseAllModals();
    };

    const errorCallback = (e: any) => {
      alert("No se pudo guardar la configuración.");
      onCloseAllModals();
    };

    // Llamamos a la función de guardado en el projectService
    projectService.saveConfigurationInServer(configurationInformation, successCallback, errorCallback);
    setShowProductModal(false)
    if (onCloseAllModals) {
      onCloseAllModals();
    }
    forceUpdateModel();
  };

  // Si se solicita editar, buscamos el elemento correspondiente en currentModel
  const getFeatureById = (id: string): Element | undefined => {
    return currentModel.elements.find((elem: Element) => elem.id === id);
  };

  return (
    <div>
      <Button variant="primary" onClick={() => setShowProductModal(true)}>
        Add new potential product
      </Button>

      <Modal
        show={showProductModal}
        onHide={() => {
          setShowProductModal(false);
          if (onCloseAllModals) onCloseAllModals();
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>New Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="newProductName">
              <Form.Label>Product name</Form.Label>
              <Form.Control
                type="text"
                value={productName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setProductName(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="newProductImage">
              <Form.Label>Upload image</Form.Label>
              <Form.Control
                type="file"
                accept="image/jpeg, image/png"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadProductImage(e.target.files[0]);
                  }
                }}
              />
            </Form.Group>

            <hr />
            <h5>Select functionalities (from the catalog)</h5>
            <div style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
              {renderAvailableFunctionalities()}
            </div>
            <hr />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
              setShowProductModal(false);
              if (onCloseAllModals) onCloseAllModals();
            }}
>Cancel</Button>
          <Button variant="primary" onClick={handleSaveProduct}>Save potential product</Button>
        </Modal.Footer>
      </Modal>

      {showEditFeatureModal && editingFeatureId && getFeatureById(editingFeatureId) && (
  <EditFeatureModal
    show={showEditFeatureModal}
    feature={ { ...getFeatureById(editingFeatureId)! } }  // pasamos una copia (spread) para "congelar" el objeto
    onClose={() => {
      setShowEditFeatureModal(false);
      setEditingFeatureId(null);
    }}
    onSave={(updatedFeature: Element) => {
      const index = currentModel.elements.findIndex((e: Element) => e.id === updatedFeature.id);
      if (index > -1) {
        currentModel.elements[index] = updatedFeature;
        projectService.raiseEventUpdatedElement(currentModel, updatedFeature);
        // Si es posible, evita llamar forceUpdateModel() inmediatamente, ya que puede reinicializar el render
      }
      setShowEditFeatureModal(false);
      setEditingFeatureId(null);
    }}
  />
)}



      {showAddSubModal && (
        <Modal
          show={showAddSubModal}
          onHide={() => {
            setShowAddSubModal(false);
            setNewSubName("");
            setSelectedParentId(null);
          }}
          centered
          backdrop="static"  // Evita que el modal se cierre al hacer click fuera
        >
          <Modal.Header closeButton>
            <Modal.Title>Add subfunctionality</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group controlId="newSubName">
              <Form.Label>Name of subfunctionality</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingrese el nombre..."
                value={newSubName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewSubName(e.target.value)
                }
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddSubModal(false);
                setNewSubName("");
                setSelectedParentId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={(e) => {
                e.preventDefault(); // Prevenimos el comportamiento por defecto
                handleConfirmAddSubFunctionality();
              }}
            >
              Add
            </Button>
          </Modal.Footer>
        </Modal>
      )}

    </div>
  );
};

export default NewProductManager;
