import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type ProjectService from "../../Application/Project/ProjectService";
import { ProjectInformation } from "../../Domain/ProductLineEngineering/Entities/ProjectInformation";

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
  projectInfo: ProjectInformation
): Promise<void> => {
  if (projectInfo?.is_collaborative) {
    console.log(`El proyecto ${projectId} es colaborativo. Configurando Yjs...`);
    await setupProjectSync(projectId, projectInfo);
  } else {
    console.log(`El proyecto ${projectId} no es colaborativo.`);
    removeProjectDoc(projectId);
  }
};

export const getProjectState = (projectId: string): Y.Map<any> | null => {
  const collaborationData = projectCollaborationData.get(projectId);
  if (collaborationData) {
    return collaborationData.doc.getMap("diagramState");
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