import * as Y from "yjs";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Relationship } from "../../Domain/ProductLineEngineering/Entities/Relationship";

export interface ModelChange {
  type: 'element_added' | 'element_updated' | 'element_removed' | 
        'relationship_added' | 'relationship_updated' | 'relationship_removed';
  id: string;
  data?: any;
  oldData?: any;
}

export interface ModelDiff {
  elementsAdded: Element[];
  elementsUpdated: Element[];
  elementsRemoved: string[];
  relationshipsAdded: Relationship[];
  relationshipsUpdated: Relationship[];
  relationshipsRemoved: string[];
}

/**
 * Compara dos estados de modelo y retorna las diferencias
 */
export const calculateModelDiff = (
  currentModel: Model | null,
  newModelData: any
): ModelDiff => {
  const diff: ModelDiff = {
    elementsAdded: [],
    elementsUpdated: [],
    elementsRemoved: [],
    relationshipsAdded: [],
    relationshipsUpdated: [],
    relationshipsRemoved: []
  };

  if (!currentModel || !newModelData) {
    console.log("calculateModelDiff: Modelo actual o datos nuevos son null");
    return diff;
  }

  console.log("calculateModelDiff: Comparando modelos", {
    currentElements: currentModel.elements?.length || 0,
    newElements: newModelData.elements?.length || 0,
    currentRelationships: currentModel.relationships?.length || 0,
    newRelationships: newModelData.relationships?.length || 0
  });

  const currentElements = new Map(currentModel.elements.map(e => [e.id, e]));
  const currentRelationships = new Map(currentModel.relationships.map(r => [r.id, r]));

  const newElements = newModelData.elements || [];
  const newRelationships = newModelData.relationships || [];

  const newElementsMap = new Map(newElements.map((e: Element) => [e.id, e]));
  const newRelationshipsMap = new Map(newRelationships.map((r: Relationship) => [r.id, r]));

  // Detectar elementos añadidos y actualizados
  newElements.forEach((element: Element) => {
    const currentElement = currentElements.get(element.id);
    if (!currentElement) {
      console.log(`Elemento añadido: ${element.id} (${element.name})`);
      diff.elementsAdded.push(element);
    } else if (!areElementsEqual(currentElement, element)) {
      console.log(`Elemento actualizado: ${element.id} (${element.name})`);
      diff.elementsUpdated.push(element);
    }
  });

  // Detectar elementos removidos
  currentElements.forEach((element, id) => {
    if (!newElementsMap.has(id)) {
      console.log(`Elemento removido: ${id} (${element.name})`);
      diff.elementsRemoved.push(id);
    }
  });

  // Detectar relaciones añadidas y actualizadas
  newRelationships.forEach((relationship: Relationship) => {
    const currentRelationship = currentRelationships.get(relationship.id);
    if (!currentRelationship) {
      console.log(`Relación añadida: ${relationship.id} (${relationship.name})`);
      diff.relationshipsAdded.push(relationship);
    } else if (!areRelationshipsEqual(currentRelationship, relationship)) {
      console.log(`Relación actualizada: ${relationship.id} (${relationship.name})`);
      diff.relationshipsUpdated.push(relationship);
    }
  });

  // Detectar relaciones removidas
  currentRelationships.forEach((relationship, id) => {
    if (!newRelationshipsMap.has(id)) {
      console.log(`Relación removida: ${id} (${relationship.name})`);
      diff.relationshipsRemoved.push(id);
    }
  });

  console.log("calculateModelDiff resultado:", {
    elementsAdded: diff.elementsAdded.length,
    elementsUpdated: diff.elementsUpdated.length,
    elementsRemoved: diff.elementsRemoved.length,
    relationshipsAdded: diff.relationshipsAdded.length,
    relationshipsUpdated: diff.relationshipsUpdated.length,
    relationshipsRemoved: diff.relationshipsRemoved.length
  });

  return diff;
};

/**
 * Compara dos elementos para detectar cambios
 */
const areElementsEqual = (element1: Element, element2: Element): boolean => {
  // Comparar propiedades básicas
  if (element1.name !== element2.name ||
      element1.type !== element2.type ||
      element1.x !== element2.x ||
      element1.y !== element2.y ||
      element1.width !== element2.width ||
      element1.height !== element2.height ||
      element1.parentId !== element2.parentId) {
    console.log(`Elemento ${element1.id} cambió:`, {
      name: element1.name !== element2.name ? `${element1.name} -> ${element2.name}` : 'sin cambio',
      type: element1.type !== element2.type ? `${element1.type} -> ${element2.type}` : 'sin cambio',
      position: (element1.x !== element2.x || element1.y !== element2.y) ?
        `(${element1.x},${element1.y}) -> (${element2.x},${element2.y})` : 'sin cambio',
      size: (element1.width !== element2.width || element1.height !== element2.height) ?
        `${element1.width}x${element1.height} -> ${element2.width}x${element2.height}` : 'sin cambio',
      parentId: element1.parentId !== element2.parentId ? `${element1.parentId} -> ${element2.parentId}` : 'sin cambio'
    });
    return false;
  }

  // Comparar propiedades
  if (element1.properties.length !== element2.properties.length) {
    console.log(`Elemento ${element1.id} cambió número de propiedades: ${element1.properties.length} -> ${element2.properties.length}`);
    return false;
  }

  for (let i = 0; i < element1.properties.length; i++) {
    const prop1 = element1.properties[i];
    const prop2 = element2.properties.find(p => p.id === prop1.id);
    if (!prop2) {
      console.log(`Elemento ${element1.id} perdió propiedad: ${prop1.name}`);
      return false;
    }
    if (prop1.value !== prop2.value || prop1.name !== prop2.name) {
      console.log(`Elemento ${element1.id} cambió propiedad ${prop1.name}: ${prop1.value} -> ${prop2.value}`);
      return false;
    }
  }

  return true;
};

/**
 * Compara dos relaciones para detectar cambios
 */
const areRelationshipsEqual = (rel1: Relationship, rel2: Relationship): boolean => {
  if (rel1.name !== rel2.name ||
      rel1.type !== rel2.type ||
      rel1.sourceId !== rel2.sourceId ||
      rel1.targetId !== rel2.targetId) {
    return false;
  }

  // Comparar puntos de la relación
  if (rel1.points?.length !== rel2.points?.length) {
    return false;
  }

  if (rel1.points && rel2.points) {
    for (let i = 0; i < rel1.points.length; i++) {
      if (rel1.points[i].x !== rel2.points[i].x || 
          rel1.points[i].y !== rel2.points[i].y) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Extrae cambios específicos de un evento de Yjs
 */
export const extractChangesFromYjsEvent = (event: any): ModelChange[] => {
  const changes: ModelChange[] = [];
  
  if (event.keys) {
    event.keys.forEach((change: any, key: string) => {
      if (key === 'elements' && change.action === 'update') {
        // Manejar cambios en elementos
        const elementsMap = event.target.get('elements') as Y.Map<any>;
        if (elementsMap) {
          // Aquí podrías implementar lógica más específica para detectar
          // qué elementos específicos cambiaron dentro del mapa
        }
      } else if (key === 'relationships' && change.action === 'update') {
        // Manejar cambios en relaciones
        const relationshipsMap = event.target.get('relationships') as Y.Map<any>;
        if (relationshipsMap) {
          // Lógica similar para relaciones
        }
      }
    });
  }
  
  return changes;
};

/**
 * Aplica un diff de modelo de manera incremental
 */
export const applyModelDiffIncremental = (
  currentModel: Model,
  diff: ModelDiff
): Model => {
  // Crear una copia del modelo actual
  const updatedModel = { ...currentModel };
  
  // Aplicar elementos añadidos
  updatedModel.elements = [...currentModel.elements, ...diff.elementsAdded];
  
  // Aplicar elementos actualizados
  diff.elementsUpdated.forEach(updatedElement => {
    const index = updatedModel.elements.findIndex(e => e.id === updatedElement.id);
    if (index !== -1) {
      updatedModel.elements[index] = updatedElement;
    }
  });
  
  // Remover elementos
  updatedModel.elements = updatedModel.elements.filter(
    e => !diff.elementsRemoved.includes(e.id)
  );
  
  // Aplicar relaciones añadidas
  updatedModel.relationships = [...currentModel.relationships, ...diff.relationshipsAdded];
  
  // Aplicar relaciones actualizadas
  diff.relationshipsUpdated.forEach(updatedRelationship => {
    const index = updatedModel.relationships.findIndex(r => r.id === updatedRelationship.id);
    if (index !== -1) {
      updatedModel.relationships[index] = updatedRelationship;
    }
  });
  
  // Remover relaciones
  updatedModel.relationships = updatedModel.relationships.filter(
    r => !diff.relationshipsRemoved.includes(r.id)
  );
  
  return updatedModel;
};

/**
 * Verifica si un diff tiene cambios significativos
 */
export const hasMeaningfulChanges = (diff: ModelDiff): boolean => {
  return diff.elementsAdded.length > 0 ||
         diff.elementsUpdated.length > 0 ||
         diff.elementsRemoved.length > 0 ||
         diff.relationshipsAdded.length > 0 ||
         diff.relationshipsUpdated.length > 0 ||
         diff.relationshipsRemoved.length > 0;
};
