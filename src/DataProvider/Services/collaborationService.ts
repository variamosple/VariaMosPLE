import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";


const projectDocs = new Map<string, Y.Doc>(); // Mapa para almacenar los documentos Y.Doc por ID de proyecto, posteriormente se puede cambiar a una base de datos o almacenamiento persistente, Esto unicamente en LOCAL!

// AUXILIAR
const projectListDoc = new Y.Doc();
const projectsArray = projectListDoc.getArray<{
  projectId: string;
}>("projectsList");

const websocketUrl =
  process.env.REACT_APP_WEBSOCKET_URL || "ws://localhost:1234";
const projectListProvider = new WebsocketProvider(
  websocketUrl,
  "projectsList",
  projectListDoc
);

projectsArray.observe((event) => {
  console.log("Cambios en la lista de proyectos:", projectsArray.toArray());
  projectsArray.toArray().forEach(({ projectId}) => {
    if (!projectDocs.has(projectId)) {
        const projectDoc = new Y.Doc();
        projectDoc.getArray("notifications");
        projectDocs.set(projectId, projectDoc);
        console.log(`Proyecto ${projectId} sincronizado y añadido a projectDocs.`);
        
        const wsProvider = setupProjectSync(projectId);
        if (wsProvider) {
          console.log(`WebSocket configurado para el proyecto ${projectId}.`);
        }
    }
  });
});
// AUXILIAR END

export const getAllProjectDocs = (): Map<string, Y.Doc> => {
  return projectDocs;
};

export const makeProjectCollaborative = (projectId: string): string => {
  if (!projectId) {
    throw new Error("El projectId no puede estar vacío.");
  }
  if (!projectDocs.has(projectId)) {
    projectsArray.push([{ projectId }]);
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
  const projectDoc = projectDocs.get(projectId);

  if (!projectDoc) {
    console.error(`El proyecto ${projectId} no es colaborativo.`);
    return null;
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
    const notifications = projectDoc.getArray("notifications");
    notifications.push([`Usuario conectado al proyecto ${projectId}`]);
  });

  wsProvider.on("connection-close", () => {
    console.log(`Un usuario se ha desconectado del proyecto ${projectId}.`);
    const notifications = projectDoc.getArray("notifications");
    notifications.push([`Usuario desconectado del proyecto ${projectId}`]);  });

    const notifications = projectDoc.getArray("notifications");
    notifications.observe((event) => {
        event.changes.added.forEach((item) => {
            console.log(`Notificación recibida en el proyecto ${projectId}:`, item);
        });
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
