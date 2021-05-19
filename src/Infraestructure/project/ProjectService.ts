import { getLanguages } from "../../DataProvider/Services/languageService";
import { ProductLine } from "../../Domain/ProjectManagement/Entities/ProductLine";
import { Project } from "../../Domain/ProjectManagement/Entities/Project";

import ProjectManager from "../../Domain/ProjectManagement/UseCases/ProjectManager";

export default class ProjectService {
  private graph: any;
  private projectManager: ProjectManager = new ProjectManager();
  private _project: Project = this.createProject("");
  private languages: any;

  private NewProductLineListeners:any=[];
 
  constructor() {
    let me = this;
    let fun = function (data: any) {
      me.languages = data;
    };
    getLanguages(fun);
  }

  addNewProductLineListener(listener:any){
    this.NewProductLineListeners.push(listener);
  }

  removeNewProductLineListener(listener:any){
    this.NewProductLineListeners[listener]=null;
  }

  raiseEventNewProductLine(productLine:ProductLine){
    let me=this;
    let e={
      target: me,
      project: me._project,
      productLine: productLine
    }
    for (let index = 0; index < me.NewProductLineListeners.length; index++) {
       let callback= this.NewProductLineListeners[index]; 
       callback(e);
    }
  }

  createProject(projectName: string): Project {
    return this.projectManager.createProject(projectName);
  }

  createLPS(project: Project, productLineName: string) {
    return this.projectManager.createLps(project, productLineName);
  }

  setGraph(graph: any) {
    this.graph = graph;
  }

  getGraph() {
    return this.graph;
  }

  public get project(): Project {
    return this._project;
  }

  public set project(value: Project) {
    this._project = value;
  }

  open() {
    //open file
  }

  getStyleDefinition(language: string, callBack: any) {
    if (this.languages) {
      for (let index = 0; index < this.languages.length; index++) {
        if (this.languages[index].name === language) {
          callBack(this.languages[index]);
        }
      }
    }
  }

  getLanguagesByType(language: string) {
    if (this.languages) {
      for (let index = 0; index < this.languages.length; index++) {
        if (this.languages[index].name === language) {
          return this.languages[index];
        }
      }
    }
  }

  saveProject(): void {
    this.projectManager.saveProject(this._project);
  }

  deleteProject(): void {
    this.projectManager.deleteProject();
  }
}
