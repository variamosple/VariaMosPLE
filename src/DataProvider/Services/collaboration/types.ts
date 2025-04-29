import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export interface ProjectCollaborationData {
  doc: Y.Doc;
  provider: WebsocketProvider;
}

export interface TestMessage {
  message: string;
  timestamp: string;
} 