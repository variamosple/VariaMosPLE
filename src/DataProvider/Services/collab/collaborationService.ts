import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { ProjectInformation } from "../../../Domain/ProductLineEngineering/Entities/ProjectInformation";
import { SessionUser } from "@variamosple/variamos-components";

interface ProjectCollaborationData {
  doc: Y.Doc;
  provider: WebsocketProvider;
  lastActivity: number;
  userCount: number;
  cleanupTimer?: NodeJS.Timeout;
}

const projectCollaborationData = new Map<string, ProjectCollaborationData>();
let currentActiveProjectId: string | null = null;

// Configuración simple para limpieza automática
const CLEANUP_TIMEOUT = 10 * 60 * 1000; // 10 minutos sin usuarios

// Función para limpiar un proyecto automáticamente
const cleanupProject = (projectId: string) => {
  const data = projectCollaborationData.get(projectId);
  if (data) {
    console.log(`[AutoCleanup] 🧹 Limpiando proyecto ${projectId} por inactividad`);

    // Limpiar timer si existe
    if (data.cleanupTimer) {
      clearTimeout(data.cleanupTimer);
    }

    // Desconectar y limpiar
    data.provider.disconnect();
    data.doc.destroy();
    projectCollaborationData.delete(projectId);

    if (currentActiveProjectId === projectId) {
      currentActiveProjectId = null;
    }
  }
};

// Función para programar limpieza automática
const scheduleCleanup = (projectId: string) => {
  const data = projectCollaborationData.get(projectId);
  if (data) {
    // Cancelar timer anterior si existe
    if (data.cleanupTimer) {
      clearTimeout(data.cleanupTimer);
    }

    // Programar nueva limpieza
    data.cleanupTimer = setTimeout(() => {
      const currentData = projectCollaborationData.get(projectId);
      if (currentData && currentData.userCount === 0) {
        cleanupProject(projectId);
      }
    }, CLEANUP_TIMEOUT);

    console.log(`[AutoCleanup] ⏰ Limpieza programada para proyecto ${projectId} en ${CLEANUP_TIMEOUT / 60000} minutos`);
  }
};

// Función para actualizar conteo de usuarios
const updateUserCount = (projectId: string, count: number) => {
  const data = projectCollaborationData.get(projectId);
  if (data) {
    data.userCount = count;
    data.lastActivity = Date.now();

    if (count === 0) {
      console.log(`[AutoCleanup] 👥 No hay usuarios en proyecto ${projectId}, programando limpieza...`);
      scheduleCleanup(projectId);
    } else {
      console.log(`[AutoCleanup] 👥 ${count} usuarios en proyecto ${projectId}, cancelando limpieza`);
      if (data.cleanupTimer) {
        clearTimeout(data.cleanupTimer);
        data.cleanupTimer = undefined;
      }
    }
  }
};

// Función para desconectar el proyecto actual si existe
const disconnectCurrentProject = () => {
  if (currentActiveProjectId) {
    const currentData = projectCollaborationData.get(currentActiveProjectId);
    if (currentData) {
      if (currentData.cleanupTimer) {
        clearTimeout(currentData.cleanupTimer);
      }
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
      // Actualizar conteo de usuarios cuando alguien se conecta
      setTimeout(() => {
        const userCount = wsProvider.awareness?.getStates().size || 0;
        updateUserCount(projectId, userCount);
      }, 1000);
    });

    wsProvider.on("connection-close", () => {
      console.log(`Un usuario se ha desconectado del proyecto ${projectId}.`);
      // Actualizar conteo de usuarios cuando alguien se desconecta
      setTimeout(() => {
        const userCount = wsProvider.awareness?.getStates().size || 0;
        updateUserCount(projectId, userCount);
      }, 1000);
    });

    collaborationData = {
      doc: projectDoc,
      provider: wsProvider,
      lastActivity: Date.now(),
      userCount: 0
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

      // Solo llamar al callback inicial si hay datos en el estado
      const initialData = modelState.get("data");
      if (initialData) {
        console.log(`[observeModelState] Enviando estado inicial del modelo ${modelId}`);
        callback(modelState);
      }

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
};

// Función para actualizar manualmente el conteo de usuarios (exportada para uso externo)
export const updateProjectUserCount = (projectId: string, count: number): void => {
  updateUserCount(projectId, count);
};

// Función para forzar limpieza manual de un proyecto
export const forceCleanupProject = (projectId: string): void => {
  console.log(`[AutoCleanup] 🧹 Forzando limpieza manual del proyecto ${projectId}`);
  cleanupProject(projectId);
};

// Función para obtener estadísticas simples de los proyectos
export const getProjectStats = () => {
  const stats = {
    totalProjects: projectCollaborationData.size,
    projects: [] as any[]
  };

  projectCollaborationData.forEach((data, projectId) => {
    stats.projects.push({
      projectId,
      userCount: data.userCount,
      lastActivity: new Date(data.lastActivity).toISOString(),
      hasCleanupScheduled: !!data.cleanupTimer
    });
  });

  return stats;
};

// Función para limpiar todos los proyectos (para usar al cerrar la aplicación)
export const cleanupAllProjects = (): void => {
  console.log(`[AutoCleanup] 🧹 Limpiando todos los proyectos...`);

  projectCollaborationData.forEach((data) => {
    if (data.cleanupTimer) {
      clearTimeout(data.cleanupTimer);
    }
    data.provider.disconnect();
    data.doc.destroy();
  });

  projectCollaborationData.clear();
  currentActiveProjectId = null;

  console.log(`[AutoCleanup] ✅ Todos los proyectos limpiados`);
};