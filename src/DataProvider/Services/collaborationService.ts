import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { v4 as uuidv4 } from "uuid";

interface ProjectData {
  doc: Y.Doc;
  workspaceID: string;
}

const projectDocs = new Map<string, ProjectData>(); // Mapa para almacenar los documentos Y.Doc por ID de proyecto, posteriormente se puede cambiar a una base de datos o almacenamiento persistente

export const makeProjectCollaborative = (projectId: string): string => {
    if (!projectDocs.has(projectId)) {
      const workspaceID = uuidv4();
      const projectDoc = new Y.Doc();
      projectDocs.set(projectId, { doc: projectDoc, workspaceID });
      console.log(`Proyecto ${projectId} ahora es colaborativo con workspaceID: ${workspaceID}`);
      return workspaceID;
    } else {
      console.log(`El proyecto ${projectId} ya es colaborativo.`);
      return projectDocs.get(projectId)!.workspaceID;
    }
  };

  export const setupProjectSync = (
    projectId: string,
  ): WebsocketProvider | null => {
    const projectData = projectDocs.get(projectId);

    if (!projectData) {
      console.error(`El proyecto ${projectId} no es colaborativo.`);
      return null;
    }

    const { doc, workspaceID } = projectData;
    const wsProvider = new WebsocketProvider(process.env.WEBSOCKET_URL, workspaceID, doc);

    wsProvider.on("status", (event) => {
      console.log(`Status WebSocket para proyecto ${projectId}:`, event.status); // logs "connected" or "disconnected"
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