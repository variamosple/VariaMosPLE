import ExternalFuntionService from "../../../DataProvider/Services/externalFunctionService";
import ProjectPersistenceService from "../../../DataProvider/Services/projectPersistenceService";
import { ExternalFuntion } from "../Entities/ExternalFuntion";
import { Language } from "../Entities/Language";
import { ProjectInformation } from "../Entities/ProjectInformation";
import { Project  } from "../Entities/Project";

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
}
