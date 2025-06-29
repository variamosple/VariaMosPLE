import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import { Awareness } from "y-protocols/awareness";

interface UserAwareness {
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  action?: UserAction;
}

interface UserAction {
  type: 'moving' | 'editing' | 'resizing' | 'selecting' | 'idle';
  cellId?: string;
  timestamp: string;
  details?: {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    editType?: 'properties' | 'label' | 'geometry';
  };
}

const awarenessMap = new Map<string, Awareness>();

export const setupModelAwareness = (
  projectId: string,
  modelId: string,
  provider: WebsocketProvider,
  initialUser: { name: string; color: string }
) => {
  const key = `${projectId}:${modelId}`;
  const awareness = provider.awareness;

  awareness.setLocalStateField("user", {
    name: initialUser.name,
    color: initialUser.color,
    cursor: { x: 0, y: 0 },
    action: {
      type: 'idle',
      timestamp: new Date().toISOString()
    },
    modelId
  });

  awarenessMap.set(key, awareness);
};

export const updateUserCursor = (
  projectId: string,
  modelId: string,
  x: number,
  y: number
) => {
  const key = `${projectId}:${modelId}`;
  const awareness = awarenessMap.get(key);
  if (awareness) {
    const current = awareness.getLocalState();
    if (current?.user) {
      awareness.setLocalStateField("user", {
        ...current.user,
        cursor: { x, y },
        modelId
      });
    }
  }
};

export const updateUserAction = (
  projectId: string,
  modelId: string,
  action: UserAction
) => {
  const key = `${projectId}:${modelId}`;
  const awareness = awarenessMap.get(key);
  if (awareness) {
    const current = awareness.getLocalState();
    if (current?.user) {
      awareness.setLocalStateField("user", {
        ...current.user,
        action,
        modelId
      });
    }
  }
};

export const clearUserAction = (
  projectId: string,
  modelId: string
) => {
  const key = `${projectId}:${modelId}`;
  const awareness = awarenessMap.get(key);
  if (awareness) {
    const current = awareness.getLocalState();
    if (current?.user) {
      awareness.setLocalStateField("user", {
        ...current.user,
        action: {
          type: 'idle',
          timestamp: new Date().toISOString()
        },
        modelId
      });
    }
  }
};

export const onModelAwarenessChange = (
  projectId: string,
  modelId: string,
  callback: (states: Map<number, any>) => void
) => {
  const key = `${projectId}:${modelId}`;
  const awareness = awarenessMap.get(key);
  if (awareness) {
    const handler = () => {
      const states = awareness.getStates();
      callback(states);
    };

    awareness.on("change", handler);
    return () => {
      awareness.off("change", handler);
    };
  }
  return () => {};
};

export const getModelAwareness = (projectId: string, modelId: string): Awareness | undefined => {
  const key = `${projectId}:${modelId}`;
  return awarenessMap.get(key);
};

export const destroyModelAwareness = (projectId: string, modelId: string) => {
const key = `${projectId}:${modelId}`;
awarenessMap.delete(key);
};

// Funciones de conveniencia para acciones específicas
export const setUserMovingCell = (
  projectId: string,
  modelId: string,
  cellId: string,
  position?: { x: number; y: number }
) => {
  updateUserAction(projectId, modelId, {
    type: 'moving',
    cellId,
    timestamp: new Date().toISOString(),
    details: { position }
  });
};

export const setUserEditingCell = (
  projectId: string,
  modelId: string,
  cellId: string,
  editType: 'properties' | 'label' | 'geometry' = 'properties'
) => {
  updateUserAction(projectId, modelId, {
    type: 'editing',
    cellId,
    timestamp: new Date().toISOString(),
    details: { editType }
  });
};

export const setUserResizingCell = (
  projectId: string,
  modelId: string,
  cellId: string,
  size?: { width: number; height: number }
) => {
  updateUserAction(projectId, modelId, {
    type: 'resizing',
    cellId,
    timestamp: new Date().toISOString(),
    details: { size }
  });
};

export const setUserSelectingCell = (
  projectId: string,
  modelId: string,
  cellId: string
) => {
  updateUserAction(projectId, modelId, {
    type: 'selecting',
    cellId,
    timestamp: new Date().toISOString()
  });
};

export const setUserIdle = (
  projectId: string,
  modelId: string
) => {
  clearUserAction(projectId, modelId);
};
