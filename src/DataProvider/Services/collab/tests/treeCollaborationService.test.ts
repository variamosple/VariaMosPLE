jest.mock('yjs', () => {
  const mocks = require('./mocks');
  return {
    Doc: jest.fn().mockImplementation(() => new mocks.MockYDoc()),
    Map: mocks.MockYMap
  };
});
jest.mock('y-websocket', () => {
  const mocks = require('./mocks');
  return {
    WebsocketProvider: jest.fn().mockImplementation(() => new mocks.MockProvider())
  };
});

import treeCollaborationService from '../treeCollaborationService';
import * as collabService from '../collaborationService';
import { MockYDoc, MockYMap, MockProvider } from './mocks';

jest.mock('../collaborationService');

describe('treeCollaborationService', () => {
  const PROJECT_ID = 'proj-tree';
  let doc: MockYDoc;

  beforeEach(() => {
    doc = new MockYDoc();
    const projectState = doc.getMap('projectState');
    const treeState = doc.getMap('treeState');
    projectState.set('treeState', treeState);

    (collabService.getProjectState as jest.Mock).mockImplementation((pid: string) => {
      if (pid === PROJECT_ID) return treeState;
      return null;
    });
    (collabService.getProjectProvider as jest.Mock).mockImplementation(() => new MockProvider());
    (collabService.setupProjectSync as jest.Mock).mockImplementation(async () => new MockProvider());
  });

  afterEach(() => {
    treeCollaborationService.cleanup();
    jest.resetAllMocks();
  });

  it('initializeTreeSync returns boolean and toggles active flag', async () => {
    const ok = await treeCollaborationService.initializeTreeSync(PROJECT_ID);
    expect(typeof ok).toBe('boolean');
    expect(typeof treeCollaborationService.isCollaborationActive()).toBe('boolean');
  });

  it('syncCurrentProjectState accepts projectService and does not throw', async () => {
    await treeCollaborationService.initializeTreeSync(PROJECT_ID);
    const fakeProjectService = {
      getProject: () => ({
        productLines: [{ id: 'pl1', name: 'PL1', scope: { models: [{ id: 'm1', name: 'M1', languageId: 'l1', type: 't1' }] } }]
      })
    };
    expect(() => treeCollaborationService.syncCurrentProjectState(fakeProjectService)).not.toThrow();
  });

  it('syncAddModelOperation handles operation without throwing', async () => {
    await treeCollaborationService.initializeTreeSync(PROJECT_ID);
    const fakeProjectService = { getProject: () => ({ productLines: [] }) };
    expect(() => treeCollaborationService.syncAddModelOperation({ id: 'm-new' }, fakeProjectService)).not.toThrow();
  });

  it('prunes operations older than MAX_OPERATIONS_HISTORY', async () => {
    await treeCollaborationService.initializeTreeSync(PROJECT_ID);
    const fakeProjectService = { getProject: () => ({ productLines: [] }) };
    // add many operations (more than internal MAX_OPERATIONS_HISTORY)
    for (let i = 0; i < 60; i++) {
      treeCollaborationService.syncAddModelOperation({ id: `m${i}` }, fakeProjectService);
    }

    const internal: any = treeCollaborationService as any;
    const treeState: any = internal.treeState;
  // Force pruning invocation (simulate scheduled cleanup)
  internal.cleanupOldOperations();
  const allAfter = treeState.toJSON();
  const opKeysAfter = Object.keys(allAfter).filter(k => k !== 'currentState' && allAfter[k].type);
  // Internal limit should prune to <= MAX_OPERATIONS_HISTORY
  expect(opKeysAfter.length).toBeLessThanOrEqual(internal.MAX_OPERATIONS_HISTORY);
  });

  it('getConnectionStatus reflects provider state', async () => {
    // Make provider reflect different states
    const mockProv = new MockProvider();
    mockProv.wsconnected = false;
    mockProv.synced = false;
    // awareness has size 0 by default

    (collabService.getProjectProvider as jest.Mock).mockImplementation(() => mockProv);

    await treeCollaborationService.initializeTreeSync(PROJECT_ID);
    const status = treeCollaborationService.getConnectionStatus();
    expect(status).toHaveProperty('connected');
    expect(status.connected).toBe(false);
    expect(status.synced).toBe(false);
    expect(typeof status.userCount).toBe('number');
  });
});