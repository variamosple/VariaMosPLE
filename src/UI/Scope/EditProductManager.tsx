import React, { useState, useEffect, ChangeEvent } from 'react';
import { Modal, Button, Form } from "react-bootstrap";
import { IoIosAddCircle } from "react-icons/io";
import { TiDelete } from "react-icons/ti";
import ProjectService from '../../Application/Project/ProjectService';
import { Element } from '../../Domain/ProductLineEngineering/Entities/Element';
import { Property } from '../../Domain/ProductLineEngineering/Entities/Property';
import { Relationship } from '../../Domain/ProductLineEngineering/Entities/Relationship';
import { Model } from '../../Domain/ProductLineEngineering/Entities/Model';
import { ConfigurationInformation } from '../../Domain/ProductLineEngineering/Entities/ConfigurationInformation';
import './scope.css';

interface EditProductManagerProps {
  projectService: ProjectService;
  selectedConfig: any; // Configuración del producto seleccionada (contiene name, features, etc.)
  onClose: () => void;
  onConfigurationEdited?: (editData: any) => void;
}

const EditProductManager: React.FC<EditProductManagerProps> = ({ projectService, selectedConfig, onClose, onConfigurationEdited }) => {
  // Inicializamos los estados con los valores del producto seleccionado
  const [productName, setProductName] = useState(selectedConfig.name || '');
  const [productImage, setProductImage] = useState<string | null>(null); // Base64 sin prefijo
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);

  // Usamos currentModel del projectService para manipular la configuración
  const currentModel: Model = projectService.currentModel;

  // Fuerza re-render (trick)
  const [, setModelVersion] = useState(0);
  const forceUpdateModel = () => setModelVersion(v => v + 1);

  // Al iniciar, prepopulamos los estados a partir de selectedConfig
  useEffect(() => {
    if (selectedConfig.features) {
      // Para funcionalidades de tipo Material
      const ids = selectedConfig.features
        .filter((f: any) => {
          const qProp = f.properties?.find((p: any) => p.name === "Quantity");
          return qProp && qProp.value === "1";
        })
        .map((f: any) => f.id);
      setSelectedFeatureIds(ids);
      // Para la imagen, buscamos el elemento de tipo Product
      const productElem = selectedConfig.features.find((f: any) => f.type === "Product");
      if (productElem) {
        const imageProp = productElem.properties?.find((p: any) => p.name === "Product_image");
        if (imageProp && imageProp.value) {
          setProductImage(imageProp.value);
        }
      }
    }
  }, [selectedConfig]);

  // ----------------------------------------------------------
  // Función para subir y procesar la imagen (actualiza el elemento "Product")
  // ----------------------------------------------------------
  const handleUploadProductImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result as string;
      // Extraer solo la parte base64 (sin el prefijo "data:image/jpeg;base64,")
      const base64Data = result.includes(',') ? result.split(',')[1] : result;

      // Creamos la propiedad "Product_image"
      const productImageProp = new Property(
        "Product_image",   // name
        base64Data,        // value
        "Image",           // type
        undefined,         // options
        undefined,         // linked_property
        undefined,         // linked_value
        false,             // custom
        true,              // display
        "",                // comment
        "",                // possibleValues
        undefined,         // possibleValuesLinks
        0,                 // minCardinality
        0,                 // maxCardinality
        "",                // constraint
        base64Data         // defaultValue
      );

      // Buscar en el modelo (currentModel) si existe un elemento "Product"
      let productElem = currentModel.elements.find((elem: Element) => elem.type === "Product");
      if (productElem) {
        // Si ya existe, actualizamos su propiedad "Product_image"
        const imageProp = productElem.properties.find((p: Property) => p.name === "Product_image");
        if (imageProp) {
          imageProp.value = base64Data;
        } else {
          productElem.properties.push(productImageProp);
        }
        // Disparar eventos de actualización para el elemento modificado
        projectService.raiseEventUpdatedElement(currentModel, productElem);
      } else {
        // Si no existe, creamos un nuevo elemento "Product"
        const newProductId = projectService.generateId();
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
      }
      // Forzar un re-render para actualizar la UI
      forceUpdateModel();
    };

    reader.readAsDataURL(file);
  };


  // ----------------------------------------------------------
  // Funciones para manejar la selección/deselección y edición de funcionalidades
  // ----------------------------------------------------------
  const handleSelectFeature = (id: string) => {
    if (!selectedFeatureIds.includes(id)) {
      setSelectedFeatureIds([...selectedFeatureIds, id]);
    }
  };

  const handleDeselectFeature = (id: string) => {
    setSelectedFeatureIds(selectedFeatureIds.filter(fid => fid !== id));
  };



  // ----------------------------------------------------------
  // Renderizado recursivo de las funcionalidades disponibles
  // ----------------------------------------------------------
  const getChildElements = (parentId: string): Element[] => {
    const elements = currentModel.elements || [];
    const relationships = currentModel.relationships || [];
    return elements.filter((el: Element) =>
      relationships.some((rel: Relationship) => rel.sourceId === parentId && rel.targetId === el.id)
    );
  };
  const [showOptionsForId, setShowOptionsForId] = useState<string | null>(null);
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
                      color: "#d56e5a"
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


  const renderAvailableFunctionalities = () => {
    const elements = currentModel.elements || [];
    const relationships = currentModel.relationships || [];
    const rootElements = elements.filter((el: Element) =>
      !relationships.some((rel: Relationship) => rel.targetId === el.id)
    );
    return (
      <ul className="hierarchical-list">
        {rootElements.map((el) => renderFunctionalityNode(el))}
      </ul>
    );
  };





  // ----------------------------------------------------------
  // Función para guardar la configuración del producto
  // Actualiza el nombre y, para cada funcionalidad de tipo "Material",
  // asigna "1" si está seleccionada, "0" si no.
  // Además, se actualiza la imagen ya modificada.
  // ----------------------------------------------------------
  const handleSaveConfiguration = () => {
    // Actualiza el nombre del producto en la configuración seleccionada
    selectedConfig.name = productName;

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
      selectedConfig.id,                            // id (usamos el id actual para actualizar)
      productName,                                  // config_name (y también se asigna al name)
      projectService.getTreeIdItemSelected(),       // id_feature_model: se asume que es el id del modelo actual
      projectService.project                        // project_json: el proyecto completo
    );

    // Define callbacks para el guardado
    const successCallback = () => {
      // AHORA eliminamos la configuración anterior (solo después del éxito del guardado)
      const deleteSuccessCallback = () => {
        // Notificar al componente padre sobre la edición colaborativa (crear nueva + eliminar anterior)
        if (onConfigurationEdited) {
          const editData = {
            type: 'CONFIGURATION_EDITED',
            originalConfigurationId: selectedConfig.id,
            originalConfigurationName: selectedConfig.name,
            newConfigurationData: {
              id: configurationInformation.id,
              name: productName,
              config_name: productName,
              selectedFeatures: selectedFeatureIds,
              timestamp: Date.now()
            },
            timestamp: Date.now()
          };
          onConfigurationEdited(editData);
        } 

        alert("Configuración editada exitosamente.");
        // Forzamos la actualización del modelo
        forceUpdateModel();
        // Cerramos ambos modals
        onClose();
      };

      const deleteErrorCallback = (deleteError: any) => {
        console.error(`Error eliminando configuración anterior:`, deleteError);
        alert(`Nueva configuración guardada, pero hubo un error eliminando la anterior: ${deleteError.message || 'Error desconocido'}`);

        // Aún cerramos los modals y actualizamos
        forceUpdateModel();
        onClose();
      };

      // Eliminar la configuración anterior con callbacks
      projectService.deleteConfigurationInServer(selectedConfig.id, deleteSuccessCallback, deleteErrorCallback);
    };

    const errorCallback = (e: any) => {
      console.error(`Error guardando nueva configuración:`, e);
      alert("No se pudo guardar la configuración.");
    };
    // Llamamos a la función de guardado en el projectService
    projectService.saveConfigurationInServer(configurationInformation, successCallback, errorCallback);
  };


  return (
    <Modal show={true} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit product properties</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="editProductName">
            <Form.Label>Product name</Form.Label>
            <Form.Control
              type="text"
              value={productName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setProductName(e.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="editProductImage">
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
          <h5>Available functionalities</h5>
          <div className="alert alert-info" style={{ fontSize: '14px', padding: '8px 12px', marginBottom: '10px' }}>
            <strong>ℹ️ Edit Mode:</strong> You can only select/deselect existing functionalities.
            To add new functionalities or modify existing ones, use the "New potential product" option.
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
            {renderAvailableFunctionalities()}
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSaveConfiguration}>Save product</Button>
      </Modal.Footer>

    </Modal>
  );
};

export default EditProductManager;
