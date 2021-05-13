import { getLanguages, getLanguagesNative } from "../../DataProvider/Services/languageService";
import { cMyProject } from "../../Domain/ProjectManagement/Entities/ProjectModel";

import {
  initializerProject,
  myProject,
} from "../../Domain/ProjectManagement/UseCases/initializer";

import ProjectManager from "../../Domain/ProjectManagement/UseCases/ProjectManager";

export default class ProjectService {
  private graph: any;
  private projectManager: ProjectManager = new ProjectManager();
  private _project: cMyProject = new cMyProject("Project 1");

  constructor() { 
    this.createProject("Project 1", "Lps 1");
  }

  createProject(projectName: string, productLineName: string) {
    this._project = this.projectManager.createProject(projectName, productLineName);
  }

  setGraph(graph: any) {
    this.graph = graph;
  }

  getGraph() {
    return this.graph;
  }

  public get project(): cMyProject {
    return this._project;
  }

  public set project(value: cMyProject) {
    this._project = value;
  }

  open() {
    //open file
  }

  getStyleDefinition(language: string, callBack: any) {
    getLanguages(language, callBack);
  }

  test() {
    return "Mundo 2";
  }

  saveProject(): void { 
    this.projectManager.saveProject(this._project); 
  }
}
