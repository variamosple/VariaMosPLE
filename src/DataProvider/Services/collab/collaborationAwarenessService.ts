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
const awarenessTimers = new Map<string, NodeJS.Timeout>();

// Configuración simple para limpieza de awareness
const AWARENESS_CLEANUP_TIMEOUT = 5 * 60 * 1000; // 5 minutos sin actividad

// Función para programar limpieza automática de awareness
const scheduleAwarenessCleanup = (key: string) => {
  // Cancelar timer anterior si existe
  const existingTimer = awarenessTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Programar nueva limpieza
  const timer = setTimeout(() => {
    awarenessMap.delete(key);
    awarenessTimers.delete(key);
  }, AWARENESS_CLEANUP_TIMEOUT);

  awarenessTimers.set(key, timer);
};

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

  // Programar limpieza automática
  scheduleAwarenessCleanup(key);

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
      // Reprogramar limpieza por actividad
      scheduleAwarenessCleanup(key);
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
      // Reprogramar limpieza por actividad
      scheduleAwarenessCleanup(key);
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

  // Cancelar timer de limpieza si existe
  const timer = awarenessTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    awarenessTimers.delete(key);
  }

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

export const setUserIdle = (
  projectId: string,
  modelId: string
) => {
  clearUserAction(projectId, modelId);
};
