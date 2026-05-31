import * as Y from "yjs";
import { getProjectState, getProjectProvider } from "./collaborationService";

class HistoryCollaborationService {
  private projectId: string | null = null;
  private historyState: Y.Map<any> | null = null;
  private isInitialized = false;

  async initializeHistorySync(projectId: string): Promise<boolean> {
    const projectState = getProjectState(projectId);
    const provider = getProjectProvider(projectId);

    if (!projectState || !provider) {
      return false;
    }

    this.projectId = projectId;

    let historyMap = projectState.get("projectHistory") as Y.Map<any>;

    if (!historyMap) {
      historyMap = new Y.Map<any>();
      projectState.set("projectHistory", historyMap);
    }

    this.historyState = historyMap;
    this.isInitialized = true;

    return true;
  }

  publishHistoryEvent(event: any) {
    if (!this.isInitialized || !this.historyState) {
      return;
    }

    const id =
      event.id ||
      `history_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    this.historyState.set(id, {
      ...event,
      id,
      timestamp: Date.now()
    });
  }

  observeHistoryChanges(callback: (records: any[]) => void): (() => void) | null {
    if (!this.isInitialized || !this.historyState) {
      return null;
    }

    const observer = () => {
      const records = Object.values(this.historyState?.toJSON() || {})
        .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));

      callback(records);
    };

    this.historyState.observe(observer);

    observer();

    return () => {
      this.historyState?.unobserve(observer);
    };
  }

  cleanup() {
    this.projectId = null;
    this.historyState = null;
    this.isInitialized = false;
  }
}

const historyCollaborationService = new HistoryCollaborationService();
export default historyCollaborationService;