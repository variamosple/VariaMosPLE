import { MockYDoc, MockYMap, MockProvider } from './mocks';

jest.mock('yjs', () => {
  const mocks = require('./mocks');
  return {
    Doc: mocks.MockYDoc,
    Map: mocks.MockYMap
  };
});
jest.mock('y-websocket', () => {
  const mocks = require('./mocks');
  return {
    WebsocketProvider: mocks.MockProvider
  };
});

import * as collaborationService from '../collaborationService';

describe('collaborationService (unit / light integration)', () => {
  const PROJECT_ID = 'proj-test';

  afterEach(() => {
    try { collaborationService.removeProjectDoc(PROJECT_ID); } catch {}
    jest.resetAllMocks();
  });

  it('setupProjectSync creates provider and project state map', async () => {
    process.env.REACT_APP_WEBSOCKET_URL = 'ws://localhost:1234';
    const provider = await collaborationService.setupProjectSync(PROJECT_ID);
    expect(provider).toBeDefined();
    const state = collaborationService.getProjectState(PROJECT_ID);
    expect(state).not.toBeNull();
    state!.set('x', 1);
    expect(state!.get('x')).toBe(1);
  });

  it('manageModelState creates and returns model map', async () => {
    process.env.REACT_APP_WEBSOCKET_URL = 'ws://localhost:1234';
    await collaborationService.setupProjectSync(PROJECT_ID);
    const modelState = collaborationService.manageModelState(PROJECT_ID, 'm1');
    expect(modelState).not.toBeNull();
    modelState!.set('data', { foo: 'bar' });
    const projState = collaborationService.getProjectState(PROJECT_ID);
    const stored = projState!.get('model_m1');
    expect(stored.get('data')).toEqual({ foo: 'bar' });
  });

  it('observeModelState calls callback on change and returns unsubscribe', async () => {
    process.env.REACT_APP_WEBSOCKET_URL = 'ws://localhost:1234';
    await collaborationService.setupProjectSync(PROJECT_ID);
    const modelState = collaborationService.manageModelState(PROJECT_ID, 'm2')!;
    const cb = jest.fn();
    const unsub = collaborationService.observeModelState(PROJECT_ID, 'm2', (s: any, changes?: any) => {
      cb(s, changes);
    });
    modelState.set('v', 42);
    expect(cb).toHaveBeenCalled();
    if (unsub) unsub();
  });

  it('setupProjectSync throws if REACT_APP_WEBSOCKET_URL is not configured', async () => {
    delete process.env.REACT_APP_WEBSOCKET_URL;
    await expect(collaborationService.setupProjectSync('no-url-proj')).rejects.toThrow(/WebSocket/);
  });

  it('observeModelState unsubscribe actually removes the observer', async () => {
    process.env.REACT_APP_WEBSOCKET_URL = 'ws://localhost:1234';
    await collaborationService.setupProjectSync(PROJECT_ID);
    const modelState = collaborationService.manageModelState(PROJECT_ID, 'm-unsub')!;
    const cb = jest.fn();
    const unsub = collaborationService.observeModelState(PROJECT_ID, 'm-unsub', () => cb());
    modelState.set('a', 1);
    expect(cb).toHaveBeenCalled();
    cb.mockReset();
    if (unsub) unsub();
    modelState.set('b', 2);
    expect(cb).not.toHaveBeenCalled();
  });

  it('schedules cleanup and removes provider when no users (uses fake timers)', async () => {
    jest.useFakeTimers();
    process.env.REACT_APP_WEBSOCKET_URL = 'ws://localhost:1234';
    const projId = 'proj-timer';
    await collaborationService.setupProjectSync(projId);
    const prov = collaborationService.getProjectProvider(projId) as any;

    prov.emit('sync');

    jest.advanceTimersByTime(1000);

    jest.advanceTimersByTime(10 * 60 * 1000 + 1000);

    expect(collaborationService.getProjectProvider(projId)).toBeNull();
    jest.useRealTimers();
  });

  it('removeProjectDoc disconnects and removes provider', async () => {
    process.env.REACT_APP_WEBSOCKET_URL = 'ws://localhost:1234';
    const proj = 'proj-disconnect';
    await collaborationService.setupProjectSync(proj);
    const prov = collaborationService.getProjectProvider(proj) as any;
    const discSpy = jest.spyOn(prov, 'disconnect');
    collaborationService.removeProjectDoc(proj);
    expect(discSpy).toHaveBeenCalled();
    expect(collaborationService.getProjectProvider(proj)).toBeNull();
  });

  it('setupProjectSync is idempotent (multiple calls do not create duplicates)', async () => {
    process.env.REACT_APP_WEBSOCKET_URL = 'ws://localhost:1234';
    const proj = 'proj-idemp';
    const p1 = await collaborationService.setupProjectSync(proj);
    const p2 = await collaborationService.setupProjectSync(proj);
    expect(p1).toBeDefined();
    expect(p2).toBeDefined();
    expect(p1).toBe(p2);
  });

  it('manageModelState returns null if project state is missing', () => {
    const val = collaborationService.manageModelState('non-existent', 'mX');
    expect(val).toBeNull();
  });

  it('observeProjectState invokes callback on changes', async () => {
    process.env.REACT_APP_WEBSOCKET_URL = 'ws://localhost:1234';
    const proj = 'proj-initial';
    await collaborationService.setupProjectSync(proj);
    const state = collaborationService.getProjectState(proj)!;
    const cb = jest.fn();
    collaborationService.observeProjectState(proj, (s: any) => cb(s));
    state.set('initialKey', 'initValue');
    expect(cb).toHaveBeenCalled();
  });
});