import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

interface ProjectData {
  doc: Y.Doc;
  workspaceID: string;
}

const projectDocs = new Map<string, ProjectData>(); // Mapa para almacenar los documentos Y.Doc por ID de proyecto, posteriormente se puede cambiar a una base de datos o almacenamiento persistente

export const makeProjectCollaborative = (projectId: string): string => {
  if (!projectId) {
    throw new Error("El projectId no puede estar vacío.");
  }

  if (!projectDocs.has(projectId)) {
    const projectDoc = new Y.Doc();
    projectDocs.set(projectId, { doc: projectDoc, workspaceID: projectId });
    console.log(
      `Proyecto ${projectId} ahora es colaborativo con workspaceID: ${projectId}`
    );
  } else {
    console.log(`El proyecto ${projectId} ya es colaborativo.`);
  }
  return projectId;
};

export const setupProjectSync = (
  projectId: string
): WebsocketProvider | null => {
  const projectData = projectDocs.get(projectId);

  if (!projectData) {
    console.error(`El proyecto ${projectId} no es colaborativo.`);
    return null;
  }

  const { doc, workspaceID } = projectData;
  const websocketUrl = process.env.WEBSOCKET_URL;
  if (!websocketUrl) {
    throw new Error("La URL del WebSocket no está configurada.");
  }

  const wsProvider = new WebsocketProvider(websocketUrl, workspaceID, doc);

  wsProvider.on("status", (event) => {
    console.log(`Status WebSocket para proyecto ${projectId}:`, event.status);
  });

  return wsProvider;
};

export const removeProjectDoc = (projectId: string) => {
    if (projectDocs.has(projectId)) {
      const projectDoc = projectDocs.get(projectId);
      projectDoc?.doc.destroy();
      projectDocs.delete(projectId);
      console.log(`Proyecto ${projectId} ya no es colaborativo`);
    }
  };
