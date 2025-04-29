import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { ProjectInformation } from "../../../Domain/ProductLineEngineering/Entities/ProjectInformation";
import { ProjectCollaborationData, TestMessage } from "./types";
import { WEBSOCKET_URL } from "./constants";

export class ProjectCollaborationManager {
  private static instance: ProjectCollaborationManager;
  private projectCollaborationData: Map<string, ProjectCollaborationData>;
  // private messageObservers = new Map<string, ((message: string) => void)[]>();

  private constructor() {
    this.projectCollaborationData = new Map<string, ProjectCollaborationData>();
  }

  public static getInstance(): ProjectCollaborationManager {
    if (!ProjectCollaborationManager.instance) {
      ProjectCollaborationManager.instance = new ProjectCollaborationManager();
    }
    return ProjectCollaborationManager.instance;
  }

  public async setupProjectSync(
    projectId: string,
    projectInfo: ProjectInformation
  ): Promise<WebsocketProvider | null> {
    let collaborationData = this.projectCollaborationData.get(projectId);

    if (!collaborationData) {
      collaborationData = await this.initializeProjectCollaboration(projectId, projectInfo);
    } else {
      console.log(`Un usuario se unió al proyecto ${projectId}`);
    }

    return collaborationData.provider;
  }

  private async initializeProjectCollaboration(
    projectId: string,
    projectInfo: ProjectInformation
  ): Promise<ProjectCollaborationData> {
    if (!WEBSOCKET_URL) {
      throw new Error("La URL del WebSocket no está configurada.");
    }

    const projectDoc = new Y.Doc();
    this.initializeProjectData(projectDoc, projectInfo);

    const wsProvider = new WebsocketProvider(WEBSOCKET_URL, projectId, projectDoc);
    this.setupWebSocketListeners(wsProvider, projectId);

    const collaborationData = {
      doc: projectDoc,
      provider: wsProvider
    };

    this.projectCollaborationData.set(projectId, collaborationData);
    console.log(`Nuevo Y.Doc y WebSocketProvider creados para el proyecto ${projectId}`);

    return collaborationData;
  }

  private initializeProjectData(doc: Y.Doc, projectInfo: ProjectInformation): void {
    const ymap = doc.getMap("diagramState");
    if (projectInfo?.project) {
      ymap.set("data", projectInfo.project);
    }
  }

  private setupWebSocketListeners(provider: WebsocketProvider, projectId: string): void {
    provider.on("status", (event) => {
      console.log(`Status WebSocket para proyecto ${projectId}:`, event.status);
    });

    provider.on("sync", () => {
      console.log(`Un nuevo usuario se ha conectado al proyecto ${projectId}.`);
    });

    provider.on("connection-close", () => {
      console.log(`Un usuario se ha desconectado del proyecto ${projectId}.`);
    });
  }

  public removeProjectDoc(projectId: string): void {
    const collaborationData = this.projectCollaborationData.get(projectId);
    
    if (collaborationData) {
      this.cleanupProjectCollaboration(collaborationData, projectId);
    }
  }

  private cleanupProjectCollaboration(data: ProjectCollaborationData, projectId: string): void {
    data.provider.disconnect();
    console.log("WebSocketProvider desconectado");
  
    data.doc.destroy();
    console.log("Y.Doc destruido");
    
    this.projectCollaborationData.delete(projectId);
    console.log(`Proyecto ${projectId} ya no es colaborativo`);
  }

  public async handleCollaborativeProject(
    projectId: string,
    projectInfo: ProjectInformation
  ): Promise<void> {
    if (projectInfo?.is_collaborative) {
      console.log(`El proyecto ${projectId} es colaborativo. Configurando Yjs...`);
      await this.setupProjectSync(projectId, projectInfo);
    } else {
      console.log(`El proyecto ${projectId} no es colaborativo.`);
    }
  }

  public sendTestMessage(projectId: string, message: string): void {
    const collaborationData = this.projectCollaborationData.get(projectId);
    
    if (collaborationData) {
      const ymap = collaborationData.doc.getMap("testMessages");
      ymap.set("lastMessage", {
        message,
        timestamp: new Date().toISOString()
      });
      console.log(`Mensaje de prueba enviado: ${message}`);
    } else {
      console.warn("No hay datos de colaboración para este proyecto");
    }
  }

  public listenToTestMessages(projectId: string, callback: (message: string) => void): void {
    const collaborationData = this.projectCollaborationData.get(projectId);
    
    if (collaborationData) {
      const ymap = collaborationData.doc.getMap("testMessages");
      ymap.observe(() => {
        const lastMessage = ymap.get("lastMessage") as TestMessage;
        if (lastMessage) {
          callback(lastMessage.message);
        }
      });
    }
  }
} 