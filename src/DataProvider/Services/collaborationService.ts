import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type ProjectService from "../../Application/Project/ProjectService";


const projectDocs = new Map<string, Y.Doc>(); 


export const getAllProjectDocs = (): Map<string, Y.Doc> => {
  return projectDocs;
};

export const setupProjectSync = async (
  projectId: string,
  projectService: ProjectService 
): Promise<WebsocketProvider | null> => {
  let projectDoc = projectDocs.get(projectId);

  if (!projectDoc) {
    projectDoc = new Y.Doc();

    // Usar projectService para obtener la información del proyecto
    const projectInfo = projectService.getProjectInformation();
    if (projectInfo && projectInfo.project) {
      const ymap = projectDoc.getMap("projectData");
      ymap.set("data", projectInfo.project);
    }

    projectDocs.set(projectId, projectDoc);
    console.log(`Nuevo Y.Doc creado para el proyecto ${projectId}`);
  } else {
    console.log(`Un usuario se unió al proyecto ${projectId}`);
  }

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

  return wsProvider;
};

export const removeProjectDoc = (projectId: string) => {
  if (projectDocs.has(projectId)) {
    const projectDoc = projectDocs.get(projectId);
    projectDoc?.destroy();
    projectDocs.delete(projectId);
    console.log(`Proyecto ${projectId} ya no es colaborativo`);
  }
};
