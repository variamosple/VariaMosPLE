import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { ProjectInformation } from "../../../Domain/ProductLineEngineering/Entities/ProjectInformation";
import { SessionUser } from "@variamosple/variamos-components";

interface ProjectCollaborationData {
  doc: Y.Doc;
  provider: WebsocketProvider;
}

const projectCollaborationData = new Map<string, ProjectCollaborationData>();
let currentActiveProjectId: string | null = null;

// Función para desconectar el proyecto actual si existe
const disconnectCurrentProject = () => {
  if (currentActiveProjectId) {
    const currentData = projectCollaborationData.get(currentActiveProjectId);
    if (currentData) {
      currentData.provider.disconnect();
      currentData.doc.destroy();
      projectCollaborationData.delete(currentActiveProjectId);
      console.log(`Proyecto ${currentActiveProjectId} desconectado`);
    }
    currentActiveProjectId = null;
  }
};

export const setupProjectSync = async (
  projectId: string,
): Promise<WebsocketProvider | null> => {
  // Si hay un proyecto activo diferente, desconectarlo
  if (currentActiveProjectId && currentActiveProjectId !== projectId) {
    disconnectCurrentProject();
  }

  let collaborationData = projectCollaborationData.get(projectId);

  if (!collaborationData) {
    const projectDoc = new Y.Doc();
    const websocketUrl = process.env.REACT_APP_WEBSOCKET_URL;
    if (!websocketUrl) {
      throw new Error("La URL del WebSocket no está configurada.");
    }

    const wsProvider = new WebsocketProvider(websocketUrl, projectId, projectDoc);

    projectDoc.getMap("projectState");
    
    wsProvider.on("status", (event) => {
      console.log(`Status WebSocket para proyecto ${projectId}:`, event.status);
    });

    wsProvider.on("sync", () => {
      console.log(`Un nuevo usuario se ha conectado al proyecto ${projectId}.`);
    });

    wsProvider.on("connection-close", () => {
      console.log(`Un usuario se ha desconectado del proyecto ${projectId}.`);
    });

    collaborationData = {
      doc: projectDoc,
      provider: wsProvider
    };

    projectCollaborationData.set(projectId, collaborationData);
    currentActiveProjectId = projectId;
    console.log(`Nuevo Y.Doc y WebSocketProvider creados para el proyecto ${projectId}`);
  } else {
    console.log(`Un usuario se unió al proyecto ${projectId}`);
  }

  return collaborationData.provider;
};

export const removeProjectDoc = (projectId: string) => {
  if (currentActiveProjectId === projectId) {
    disconnectCurrentProject();
  }
};

export const handleCollaborativeProject = async (
  projectId: string,
  projectInfo: ProjectInformation,
): Promise<void> => {
  if (projectInfo?.is_collaborative) {
    console.log(`El proyecto ${projectId} es colaborativo. Configurando Yjs...`);
    await setupProjectSync(projectId);
  } else {
    console.log(`El proyecto ${projectId} no es colaborativo.`);
    removeProjectDoc(projectId);
  }
};

export const getProjectState = (projectId: string): Y.Map<any> | null => {
  const collaborationData = projectCollaborationData.get(projectId);
  if (collaborationData) {
    return collaborationData.doc.getMap("projectState");
  }
  return null;
};

export const updateProjectState = (projectId: string, updateFn: (state: Y.Map<any>) => void): void => {
  const state = getProjectState(projectId);
  if (state) {
    updateFn(state);
  }
};

export const observeProjectState = (projectId: string, callback: (state: any) => void): void => {
  const state = getProjectState(projectId);
  if (state) {
    state.observe(() => {
      callback(state.toJSON());
    });
  }
};

export const sendProjectUpdate = (projectId: string, update: any): void => {
  const state = getProjectState(projectId);
  if (state) {
    state.set("data", {
      ...state.get("data"),
      ...update
    });
  }
};

// ===== NUEVAS FUNCIONES PARA SINCRONIZACIÓN DE ESTRUCTURA =====

/**
 * Actualiza la estructura completa del proyecto (ProductLines, Applications, etc.)
 */
export const updateProjectStructure = (
  projectId: string,
  projectData: any,
  userId?: string
): void => {
  console.log(`[updateProjectStructure] 📤 Iniciando actualización de estructura:`, {
    projectId: projectId,
    hasProjectData: !!projectData,
    userId: userId,
    productLinesCount: projectData?.productLines?.length || 0
  });

  const state = getProjectState(projectId);
  if (state) {
    console.log(`[updateProjectStructure] ✅ Estado YJS encontrado, actualizando...`);
    const structureData = {
      data: projectData,
      lastModified: Date.now(),
      modifiedBy: userId || 'unknown'
    };

    state.set("projectStructure", structureData);
    console.log(`[updateProjectStructure] ✅ Estructura actualizada en YJS:`, structureData);
  } else {
    console.log(`[updateProjectStructure] ❌ No se encontró estado YJS para proyecto ${projectId}`);
  }
};

/**
 * Observa cambios en la estructura del proyecto
 */
export const observeProjectStructure = (
  projectId: string,
  callback: (structureData: any, metadata?: any) => void
): () => void => {
  console.log(`[observeProjectStructure] 👀 Configurando observador para proyecto ${projectId}`);

  const state = getProjectState(projectId);
  if (state) {
    console.log(`[observeProjectStructure] ✅ Estado YJS encontrado, configurando observador...`);

    // Callback inicial con datos actuales
    const currentStructure = state.get("projectStructure");
    console.log(`[observeProjectStructure] Estructura actual:`, {
      hasCurrentStructure: !!currentStructure,
      currentStructure: currentStructure
    });

    if (currentStructure) {
      console.log(`[observeProjectStructure] 📥 Ejecutando callback inicial`);
      callback(currentStructure.data, {
        lastModified: currentStructure.lastModified,
        modifiedBy: currentStructure.modifiedBy
      });
    }

    const observer = () => {
      console.log(`[observeProjectStructure] 🔔 Cambio detectado en estructura del proyecto ${projectId}`);

      const structureData = state.get("projectStructure");
      console.log(`[observeProjectStructure] Datos de estructura:`, {
        hasStructureData: !!structureData,
        structureData: structureData
      });

      if (structureData) {
        console.log(`[observeProjectStructure] 📥 Ejecutando callback con nuevos datos`);
        callback(structureData.data, {
          lastModified: structureData.lastModified,
          modifiedBy: structureData.modifiedBy
        });
      }
    };

    state.observe(observer);
    console.log(`[observeProjectStructure] ✅ Observador configurado correctamente`);

    return () => {
      state.unobserve(observer);
      console.log(`[observeProjectStructure] 🔇 Desobservando estructura del proyecto ${projectId}`);
    };
  } else {
    console.log(`[observeProjectStructure] ❌ No se encontró estado YJS para proyecto ${projectId}`);
  }

  return () => {};
};

export const observeModelState = (projectId: string, modelId: string, callback: (state: any, changes?: any) => void): () => void => {
  const projectState = getProjectState(projectId);
  if (projectState) {
    let modelState = projectState.get(`model_${modelId}`) as Y.Map<any>;

    if (!modelState) {
      modelState = manageModelState(projectId, modelId);
    }

    if (modelState) {
      console.log(`[observeModelState] Observando el estado del modelo ${modelId} para el proyecto ${projectId}`);
      console.log(`[observeModelState] modelState inicial:`, modelState);
      callback(modelState);

      const observer = (event: any) => {
        console.log(`[observeModelState] Cambio detectado en el modelo ${modelId}:`, modelState);

        // Extraer información de los cambios específicos
        const changes = {
          keys: event.keys,
          target: event.target,
          transaction: event.transaction
        };

        callback(modelState, changes);
      };

      modelState.observe(observer);
      return () => {
        modelState.unobserve(observer);
        console.log(`[observeModelState] Desobservando el estado del modelo ${modelId} para el proyecto ${projectId}`);
      };
    } else {
      console.log(`No se pudo inicializar el estado del modelo ${modelId} para el proyecto ${projectId}`);
    }
  } else {
    console.log(`No se encontró el estado del proyecto ${projectId}`);
  }
}

export const manageModelState = (projectId: string, modelId: string): Y.Map<any> | null => {
  const projectState = getProjectState(projectId);
  if (projectState) {
    let modelState = projectState.get(`model_${modelId}`) as Y.Map<any>;
    
    if (!modelState) {
      modelState = new Y.Map<any>();
      projectState.set(`model_${modelId}`, modelState);
      console.log(`Estado del modelo ${modelId} creado e inicializado para el proyecto ${projectId}`);
    } else {
      console.log(`Estado del modelo ${modelId} ya existe para el proyecto ${projectId}`);
    }
    
    return modelState;
  }

  console.log(`No se encontró el estado del proyecto ${projectId}`);
  return null;
}

export const updateModelState = (projectId: string, modelId: string, updateFn: (state: Y.Map<any>) => void): void => {
  const projectState = getProjectState(projectId);
  if (projectState) {
    const modelState = projectState.get(`model_${modelId}`) as Y.Map<any>;
    if (modelState) {
      updateFn(modelState);
    } else {
      console.log(`No se encontró el estado del modelo ${modelId} para el proyecto ${projectId}`);
    }
  } else {
    console.log(`No se encontró el estado del proyecto ${projectId}`);
  }
}

// Nuevas funciones para sincronización incremental
export const updateModelElementsIncremental = (
  projectId: string,
  modelId: string,
  elements: any[],
  relationships: any[]
): void => {
  const projectState = getProjectState(projectId);
  if (projectState) {
    const modelState = projectState.get(`model_${modelId}`) as Y.Map<any>;
    if (modelState) {
      // Crear mapas de Yjs para elementos y relaciones si no existen
      let elementsMap = modelState.get('elements') as Y.Map<any>;
      let relationshipsMap = modelState.get('relationships') as Y.Map<any>;

      if (!elementsMap) {
        elementsMap = new Y.Map();
        modelState.set('elements', elementsMap);
      }

      if (!relationshipsMap) {
        relationshipsMap = new Y.Map();
        modelState.set('relationships', relationshipsMap);
      }

      // Actualizar elementos
      elements.forEach(element => {
        elementsMap.set(element.id, element);
      });

      // Actualizar relaciones
      relationships.forEach(relationship => {
        relationshipsMap.set(relationship.id, relationship);
      });

      // Mantener compatibilidad con el formato anterior
      modelState.set("data", {
        elements: elements,
        relationships: relationships,
        timestamp: Date.now()
      });
    }
  }
}

export const removeModelElements = (
  projectId: string,
  modelId: string,
  elementIds: string[],
  relationshipIds: string[]
): void => {
  const projectState = getProjectState(projectId);
  if (projectState) {
    const modelState = projectState.get(`model_${modelId}`) as Y.Map<any>;
    if (modelState) {
      const elementsMap = modelState.get('elements') as Y.Map<any>;
      const relationshipsMap = modelState.get('relationships') as Y.Map<any>;

      if (elementsMap) {
        elementIds.forEach(id => elementsMap.delete(id));
      }

      if (relationshipsMap) {
        relationshipIds.forEach(id => relationshipsMap.delete(id));
      }
    }
  }
}

  export const getProjectProvider = (projectId: string): WebsocketProvider | null => {
  const collaborationData = projectCollaborationData.get(projectId);
  if (collaborationData) {
    return collaborationData.provider;
  }
  console.log(`No se encontró el WebSocketProvider para el proyecto ${projectId}`);
  return null;
}