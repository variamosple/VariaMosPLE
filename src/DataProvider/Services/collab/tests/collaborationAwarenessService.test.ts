import {
  setupModelAwareness,
  getModelAwareness,
  updateUserCursor,
  setUserEditingCell,
  destroyModelAwareness,
  onModelAwarenessChange
} from '../collaborationAwarenessService';
import { MockProvider } from './mocks';

jest.useFakeTimers();

describe('collaborationAwarenessService', () => {
  const projectId = 'p-aw';
  const modelId = 'm-aw';
  const provider = new MockProvider();

  afterEach(() => {
    try { destroyModelAwareness(projectId, modelId); } catch {}
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('setupModelAwareness stores awareness and local state', () => {
    setupModelAwareness(projectId, modelId, provider as any, { name: 'Alice', color: '#f00' });
    const a = getModelAwareness(projectId, modelId);
    expect(a).toBeDefined();
    const local = provider.awareness.getLocalState();
    expect(local.user.name).toBe('Alice');
  });

  it('updateUserCursor updates local state', () => {
    setupModelAwareness(projectId, modelId, provider as any, { name: 'Bob', color: '#0f0' });
    updateUserCursor(projectId, modelId, 10, 20);
    const local = provider.awareness.getLocalState();
    expect(local.user.cursor).toEqual({ x: 10, y: 20 });
  });

  it('setUserEditingCell sets editing action', () => {
    setupModelAwareness(projectId, modelId, provider as any, { name: 'Carla', color: '#00f' });
    setUserEditingCell(projectId, modelId, 'cell123', 'properties');
    const local = provider.awareness.getLocalState();
    expect(local.user.action.type).toBe('editing');
    expect(local.user.action.cellId).toBe('cell123');
  });

  it('onModelAwarenessChange registers handler and receives states', () => {
    setupModelAwareness(projectId, modelId, provider as any, { name: 'Dana', color: '#abc' });
    const cb = jest.fn();
    const unsub = onModelAwarenessChange(projectId, modelId, (states) => {
      cb(states);
    });
    provider.awareness.emitChange();
    expect(cb).toHaveBeenCalled();
    if (unsub) unsub();
  });

  it('destroyModelAwareness removes awareness entry', () => {
    setupModelAwareness(projectId, modelId, provider as any, { name: 'Eve', color: '#123' });
    destroyModelAwareness(projectId, modelId);
    const a = getModelAwareness(projectId, modelId);
    expect(a).toBeUndefined();
  });
});