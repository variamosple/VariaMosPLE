import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type ProjectService from "../../Application/Project/ProjectService";
import { ProjectInformation } from "../../Domain/ProductLineEngineering/Entities/ProjectInformation";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";

interface ProjectCollaborationData {
  doc: Y.Doc;
  provider: WebsocketProvider;
  modelStates: Map<string, Y.Map<any>>;
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
  projectInfo: ProjectInformation
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
      provider: wsProvider,
      modelStates: new Map()
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
  model?: Model
): Promise<void> => {
  if (!projectInfo.is_collaborative) return;

  const provider = await setupProjectSync(projectId, projectInfo);
  if (provider && model) {
    // Inicializar el estado del modelo si existe
    const modelState = getModelState(projectId, model.id);
    if (!modelState) {
      updateModelState(projectId, model.id, (state) => {
        state.set('elements', model.elements);
        state.set('relationships', model.relationships);
      });
    }
  }
};

// Obtener el estado de un modelo específico
export const getModelState = (projectId: string, modelId: string): Y.Map<any> | null => {
  const collaborationData = projectCollaborationData.get(projectId);
  if (!collaborationData) return null;

  if (!collaborationData.modelStates.has(modelId)) {
    const modelState = collaborationData.doc.getMap(`model_${modelId}`);
    collaborationData.modelStates.set(modelId, modelState);
  }

  return collaborationData.modelStates.get(modelId) || null;
};

// Actualizar el estado de un modelo específico
export const updateModelState = (
  projectId: string, 
  modelId: string, 
  updateFn: (state: Y.Map<any>) => void
): void => {
  const state = getModelState(projectId, modelId);
  if (state) {
    updateFn(state);
  }
};

// Observar cambios en un modelo específico
export const observeModelState = (
  projectId: string, 
  modelId: string, 
  callback: (state: any) => void
): void => {
  const state = getModelState(projectId, modelId);
  if (state) {
    state.observe(() => {
      callback(state.toJSON());
    });
  }
};

// Enviar actualización para un modelo específico
export const sendModelUpdate = (
  projectId: string, 
  modelId: string, 
  update: any
): void => {
  const state = getModelState(projectId, modelId);
  if (state) {
    state.set("data", {
      ...state.get("data"),
      ...update
    });
  }
};

// Eliminar el estado de un modelo específico
export const removeModelState = (projectId: string, modelId: string): void => {
  const collaborationData = projectCollaborationData.get(projectId);
  if (collaborationData) {
    collaborationData.modelStates.delete(modelId);
  }
};