import ExternalFuntionService from "../../../DataProvider/Services/externalFunctionService";
import ProjectPersistenceService from "../../../DataProvider/Services/projectPersistenceService";
import { ExternalFuntion } from "../Entities/ExternalFuntion";
import { Language } from "../Entities/Language";
import { ProjectInformation } from "../Entities/ProjectInformation";
import { Project  } from "../Entities/Project";
import { ConfigurationInformation } from "../Entities/ConfigurationInformation";

export default class ProjectPersistenceUseCases {
  private projectPersistenceService: ProjectPersistenceService = new ProjectPersistenceService(); 

  getProjectsByUser(user:string, successCallback:any, errorCallback: any) {
      this.projectPersistenceService.getProjectsByUser(user, successCallback, errorCallback);
  }   

  getTemplateProjects(user:string, successCallback:any, errorCallback: any) {
      this.projectPersistenceService.getTemplateProjectsByUser(user, successCallback, errorCallback);
  }   

  saveProject(user:string, projectInformation:ProjectInformation, successCallback:any, errorCallback: any): void {
    let me=this;
    this.projectPersistenceService.saveProject(user, projectInformation, successCallback, errorCallback);
  }

  deleteProject(user:string, projectInformation:ProjectInformation, successCallback:any, errorCallback: any): void {
    let me=this;
    this.projectPersistenceService.deleteProject(user, projectInformation, successCallback, errorCallback);
  }

  openProject(user:string, projectId:string, successCallback:any, errorCallback: any): void {
    let me=this;
    this.projectPersistenceService.openProject(user, projectId, successCallback, errorCallback);
  }

  addConfiguration(user:string, projectInformation:ProjectInformation, configurationInformation:ConfigurationInformation, successCallback:any, errorCallback: any): void {
    let me=this;
    this.projectPersistenceService.addConfiguration(user, projectInformation, configurationInformation, successCallback, errorCallback);
  }

  deleteConfiguration(user:string, projectInformation:ProjectInformation, configurationInformation:ConfigurationInformation, successCallback:any, errorCallback: any): void {
    let me=this;
    this.projectPersistenceService.deleteConfiguration(user, projectInformation, configurationInformation, successCallback, errorCallback);
  }

  applyConfiguration(user:string, projectInformation:ProjectInformation, configurationInformation:ConfigurationInformation, successCallback:any, errorCallback: any): void {
    let me=this;
    this.projectPersistenceService.applyConfiguration(user, projectInformation, configurationInformation, successCallback, errorCallback);
  }


  getAllConfigurations(user:string, projectInformation:ProjectInformation, configurationInformation:ConfigurationInformation, successCallback:any, errorCallback: any): void { 
    let me=this; 
    this.projectPersistenceService.getAllConfigurations(user, projectInformation, configurationInformation, successCallback, errorCallback);
  } 

  // ADDED SHARE FUNCTIONS
  shareProject(projectId:string, toUserEmail: string, role: string, successCallback:any, errorCallback: any): void {
    let me=this;
    this.projectPersistenceService.shareProject(projectId , toUserEmail, role, successCallback, errorCallback);
  }

  changeProjectCollaborationState(projectId:string, successCallback:any, errorCallback: any): void {
    let me=this;
    this.projectPersistenceService.changeProjectCollaborationState(projectId, successCallback, errorCallback);
  }

  getProjectCollaborators(projectId:string, successCallback:any, errorCallback: any): void {
    let me=this;
    this.projectPersistenceService.getProjectCollaborators(projectId, successCallback, errorCallback);
  }

  removeCollaborator(projectId:string, collaboratorId:string, successCallback:any, errorCallback: any): void {
    let me=this;
    this.projectPersistenceService.removeCollaborator(projectId, collaboratorId, successCallback, errorCallback);
  }

  changeCollaboratorRole(projectId:string, collaboratorId:string, role:string, successCallback:any, errorCallback: any): void {
    let me=this;
    this.projectPersistenceService.changeCollaboratorRole(projectId, collaboratorId, role, successCallback, errorCallback);
  }
  
  getUserRole(projectId:string, successCallback:any, errorCallback: any): void {
    let me=this;
    this.projectPersistenceService.getUserRole(projectId, successCallback, errorCallback);
  }

}
