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
  private languages:any;

  constructor() { 
    let me = this;
    this.createProject("Project 1", "Lps 1");
    let fun= function(data:any){
      me.languages=data;
    }
    getLanguages(fun);
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
    if(this.languages){
      for (let index = 0; index < this.languages.length; index++) {
        if(this.languages[index].name==language){
          callBack(this.languages[index]);
        } 
      }
    }
  }

  getLanguagesByType(language: string ) { 
    if(this.languages){
      for (let index = 0; index < this.languages.length; index++) {
        if(this.languages[index].name==language){
          return this.languages[index];
        } 
      }
    }
  }

  test() {
    return "Mundo 2";
  }

  saveProject(): void { 
    this.projectManager.saveProject(this._project); 
  }
}
