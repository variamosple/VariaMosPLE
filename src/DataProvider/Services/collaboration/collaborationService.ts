import { ProjectCollaborationManager } from './ProjectCollaborationManager';

const collaborationManager = ProjectCollaborationManager.getInstance();

export const setupProjectSync = collaborationManager.setupProjectSync.bind(collaborationManager);
export const removeProjectDoc = collaborationManager.removeProjectDoc.bind(collaborationManager);
export const handleCollaborativeProject = collaborationManager.handleCollaborativeProject.bind(collaborationManager);
export const sendTestMessage = collaborationManager.sendTestMessage.bind(collaborationManager);
export const listenToTestMessages = collaborationManager.listenToTestMessages.bind(collaborationManager);
export const setupDiagramEvents = collaborationManager.setupDiagramEvents.bind(collaborationManager);
export const sendDiagramEvent = collaborationManager.sendDiagramEvent.bind(collaborationManager);

export { collaborationManager }; 