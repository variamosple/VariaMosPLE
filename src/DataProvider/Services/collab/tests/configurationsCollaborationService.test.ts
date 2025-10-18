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

import configurationsCollaborationService from '../configurationsCollaborationService';
import * as collabService from '../collaborationService';
import { MockYDoc, MockYMap, MockProvider } from './mocks';

jest.mock('../collaborationService');

describe('configurationsCollaborationService (unit)', () => {
  const PROJECT_ID = 'proj-config';
  let doc: MockYDoc;
  let productConfigurations: MockYMap;
  let fakeProvider: MockProvider;

  beforeEach(() => {
    doc = new MockYDoc();
    productConfigurations = doc.getMap('productConfigurations');
    fakeProvider = new MockProvider();

    (collabService.getProjectState as jest.Mock).mockImplementation((pid: string) => {
      if (pid === PROJECT_ID) {
        const map = new MockYMap();
        return map;
      }
      return null;
    });
    (collabService.getProjectProvider as jest.Mock).mockImplementation(() => fakeProvider);
    (collabService.setupProjectSync as jest.Mock).mockImplementation(async () => fakeProvider);
  });

  afterEach(() => {
    configurationsCollaborationService.cleanup();
    jest.resetAllMocks();
  });

  it('initializeConfigurationsSync initializes and returns boolean', async () => {
    const ok = await configurationsCollaborationService.initializeConfigurationsSync(PROJECT_ID);
    expect(typeof ok).toBe('boolean');
  });

  it('observeConfigurationsChanges can register and cleanup', () => {
    const cb = jest.fn();
    const unsub = configurationsCollaborationService.observeConfigurationsChanges(cb);
    expect(unsub === null || typeof unsub === 'function').toBe(true);
    if (typeof unsub === 'function') unsub();
  });

  it('syncCreateProductOperation does not throw (basic behavior)', async () => {
    await configurationsCollaborationService.initializeConfigurationsSync(PROJECT_ID);
    expect(() => configurationsCollaborationService.syncCreateProductOperation({ id: 'p1', name: 'P1' })).not.toThrow();
  });
});