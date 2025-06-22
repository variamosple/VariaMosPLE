import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import { Awareness } from "y-protocols/awareness";

interface UserAwareness {
  name: string;
  color: string;
  cursor?: { x: number; y: number };
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
