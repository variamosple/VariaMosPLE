import ExternalFuntionService from "../../../DataProvider/Services/externalFunctionService";
import ProjectPersistenceService from "../../../DataProvider/Services/projectPersistenceService";
import { ExternalFuntion } from "../Entities/ExternalFuntion";
import { Language } from "../Entities/Language";
import { ProjectInformation } from "../Entities/ProjectInformation";
import { Project } from "../Entities/Project";
import { ProjectHistory } from "../Entities/ProjectHistory";
import { ProjectAnnotation } from "../Entities/ProjectAnnotation";
import { ConfigurationInformation } from "../Entities/ConfigurationInformation";

export default class ProjectPersistenceUseCases {
  private projectPersistenceService: ProjectPersistenceService = new ProjectPersistenceService();

  getProjectsByUser(user: string, successCallback: any, errorCallback: any) {
    this.projectPersistenceService.getProjectsByUser(user, successCallback, errorCallback);
  }

  getTemplateProjects(user: string, successCallback: any, errorCallback: any) {
    this.projectPersistenceService.getTemplateProjectsByUser(user, successCallback, errorCallback);
  }

  saveProject(user: string, projectInformation: ProjectInformation, successCallback: any, errorCallback: any): void {
    let me = this;
    this.projectPersistenceService.saveProject(user, projectInformation, successCallback, errorCallback);
  }

  deleteProject(user: string, projectInformation: ProjectInformation, successCallback: any, errorCallback: any): void {
    let me = this;
    this.projectPersistenceService.deleteProject(user, projectInformation, successCallback, errorCallback);
  }

  openProject(user: string, projectId: string, successCallback: any, errorCallback: any): void {
    let me = this;
    this.projectPersistenceService.openProject(user, projectId, successCallback, errorCallback);
  }

  addConfiguration(user: string, projectInformation: ProjectInformation, configurationInformation: ConfigurationInformation, successCallback: any, errorCallback: any): void {
    let me = this;
    this.projectPersistenceService.addConfiguration(user, projectInformation, configurationInformation, successCallback, errorCallback);
  }

  deleteConfiguration(user: string, projectInformation: ProjectInformation, configurationInformation: ConfigurationInformation, successCallback: any, errorCallback: any): void {
    let me = this;
    this.projectPersistenceService.deleteConfiguration(user, projectInformation, configurationInformation, successCallback, errorCallback);
  }

  applyConfiguration(user: string, projectInformation: ProjectInformation, configurationInformation: ConfigurationInformation, successCallback: any, errorCallback: any): void {
    let me = this;
    this.projectPersistenceService.applyConfiguration(user, projectInformation, configurationInformation, successCallback, errorCallback);
  }


  getAllConfigurations(user: string, projectInformation: ProjectInformation, configurationInformation: ConfigurationInformation, successCallback: any, errorCallback: any): void {
    let me = this;
    this.projectPersistenceService.getAllConfigurations(user, projectInformation, configurationInformation, successCallback, errorCallback);
  }

  // ADDED SHARE FUNCTIONS
  async shareProject(projectId: string, toUserEmail: string, role: string): Promise<any> {
    return this.projectPersistenceService.shareProject(projectId, toUserEmail, role);
  }

  changeProjectCollaborationState(projectId: string, successCallback: any, errorCallback: any): void {
    let me = this;
    this.projectPersistenceService.changeProjectCollaborationState(projectId, successCallback, errorCallback);
  }

  async getProjectCollaborators(projectId: string): Promise<any> {
    return this.projectPersistenceService.getProjectCollaborators(projectId);
  }

  removeCollaborator(projectId: string, collaboratorId: string): Promise<any> {
    return this.projectPersistenceService.removeCollaborator(projectId, collaboratorId);
  }

  changeCollaboratorRole(projectId: string, collaboratorId: string, role: string): Promise<any> {
    return this.projectPersistenceService.changeCollaboratorRole(projectId, collaboratorId, role);
  }

  initUser(): Promise<any> {
    return this.projectPersistenceService.initUser();
  }

  async getUserRole(projectId: string): Promise<any> {
    return this.projectPersistenceService.getUserRole(projectId);
  }

  async createHistoryEvent(historyEvent: ProjectHistory): Promise<any> {
    return this.projectPersistenceService.createHistoryEvent(historyEvent);
  }

  async getProjectHistory(projectId: string): Promise<any> {
    return this.projectPersistenceService.getProjectHistory(projectId);
  }

  async createProjectAnnotation(annotation: ProjectAnnotation): Promise<any> {
    return this.projectPersistenceService.createProjectAnnotation(annotation);
  }

  async getProjectAnnotations(modelId: string): Promise<any> {
    return this.projectPersistenceService.getProjectAnnotations(modelId);
  }

  async updateProjectAnnotation(annotationId: string, annotation: ProjectAnnotation): Promise<any> {
    return this.projectPersistenceService.updateProjectAnnotation(
      annotationId,
      annotation
    );
  }

  async deleteProjectAnnotation(annotationId: string): Promise<any> {
    return this.projectPersistenceService.deleteProjectAnnotation(annotationId);
  }

  async resolveProjectAnnotation(annotationId: string): Promise<any> {
    return this.projectPersistenceService.resolveProjectAnnotation(annotationId);
  }

  unresolveProjectAnnotation(annotationId: string): Promise<any> {
    return this.projectPersistenceService.unresolveProjectAnnotation(annotationId);
  }
}
