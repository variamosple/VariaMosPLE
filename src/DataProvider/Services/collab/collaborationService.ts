import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { ProjectInformation } from "../../../Domain/ProductLineEngineering/Entities/ProjectInformation";

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

  }
};

// Función para actualizar conteo de usuarios
const updateUserCount = (projectId: string, count: number) => {
  const data = projectCollaborationData.get(projectId);
  if (data) {
    data.userCount = count;
    data.lastActivity = Date.now();

    if (count === 0) {
      scheduleCleanup(projectId);
    } else {
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
    });

    wsProvider.on("sync", () => {
      // Actualizar conteo de usuarios cuando alguien se conecta
      setTimeout(() => {
        const userCount = wsProvider.awareness?.getStates().size || 0;
        updateUserCount(projectId, userCount);
      }, 1000);
    });

    wsProvider.on("connection-close", () => {
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
    await setupProjectSync(projectId);
  } else {
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


export const observeModelState = (projectId: string, modelId: string, callback: (state: any, changes?: any) => void): () => void => {
  const projectState = getProjectState(projectId);
  if (projectState) {
    let modelState = projectState.get(`model_${modelId}`) as Y.Map<any>;

    if (!modelState) {
      modelState = manageModelState(projectId, modelId);
    }

    if (modelState) {
      // Solo llamar al callback inicial si hay datos en el estado
      const initialData = modelState.get("data");
      if (initialData) {
        callback(modelState);
      }

      const observer = (event: any) => {
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
      };
    }
  }
  
  return () => {};
}

export const manageModelState = (projectId: string, modelId: string): Y.Map<any> | null => {
  const projectState = getProjectState(projectId);
  if (projectState) {
    let modelState = projectState.get(`model_${modelId}`) as Y.Map<any>;
    
    if (!modelState) {
      modelState = new Y.Map<any>();
      projectState.set(`model_${modelId}`, modelState);
    } 
    
    return modelState;
  }

  return null;
}

export const updateModelState = (projectId: string, modelId: string, updateFn: (state: Y.Map<any>) => void): void => {
  const projectState = getProjectState(projectId);
  if (projectState) {
    let modelState = projectState.get(`model_${modelId}`) as Y.Map<any>;
    
    if (!modelState) {
      modelState = new Y.Map<any>();
      projectState.set(`model_${modelId}`, modelState);
    }
    
    updateFn(modelState);
  }
}

export const getProjectProvider = (projectId: string): WebsocketProvider | null => {
  const collaborationData = projectCollaborationData.get(projectId);
  if (collaborationData) {
    return collaborationData.provider;
  }
  return null;
};
