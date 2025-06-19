import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import { Awareness } from "y-protocols/awareness";

interface UserAwareness {
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

const awarenessMap = new Map<string, Awareness>();

export const setupProjectAwareness = (
  projectId: string,
  provider: WebsocketProvider,
  initialUser: { name: string; color: string }
) => {
  const awareness = provider.awareness;

  awareness.setLocalStateField("user", {
    name: initialUser.name,
    color: initialUser.color,
    cursor: { x: 0, y: 0 }
  });

  awarenessMap.set(projectId, awareness);
  console.log(`Awareness configurada para el proyecto ${projectId}`);
};

export const updateUserCursor = (
  projectId: string,
  x: number,
  y: number
) => {
  const awareness = awarenessMap.get(projectId);
  if (awareness) {
    const current = awareness.getLocalState();
    if (current?.user) {
      awareness.setLocalStateField("user", {
        ...current.user,
        cursor: { x, y }
      });
    }
  }
};

export const onAwarenessChange = (
  projectId: string,
  callback: (states: Map<number, any>) => void
) => {
  const awareness = awarenessMap.get(projectId);
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

export const getProjectAwareness = (projectId: string): Awareness | undefined => {
  return awarenessMap.get(projectId);
};

export const destroyProjectAwareness = (projectId: string) => {
  awarenessMap.delete(projectId);
console.log(`Awareness eliminado para el proyecto ${projectId}`);

};
