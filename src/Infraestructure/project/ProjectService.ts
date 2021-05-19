import { getLanguages } from "../../DataProvider/Services/languageService";
import { Application } from "../../Domain/ProjectManagement/Entities/Application";
import { ProductLine } from "../../Domain/ProjectManagement/Entities/ProductLine";
import { Project } from "../../Domain/ProjectManagement/Entities/Project";

import ProjectManager from "../../Domain/ProjectManagement/UseCases/ProjectManager";

export class NewProductLineEventArg {
  public target: any;
  public project: Project;
  public productLine: ProductLine;

  constructor(target: any, project: Project, productLine: ProductLine) {
    this.target = target;
    this.project = project;
    this.productLine = productLine;
  }
}

export class NewApplicationEventArg {
  public target: any;
  public project: Project;
  public application: Application;

  constructor(target: any, project: Project, application: Application) {
    this.target = target;
    this.project = project;
    this.application = application;
  }
}

export default class ProjectService {
  private graph: any;
  private projectManager: ProjectManager = new ProjectManager();
  private _project: Project = this.createProject("");
  private languages: any;

  private NewProductLineListeners: any = [];
  private NewApplicationListeners: any = [];
  
  constructor() {
    let me = this;
    let fun = function (data: any) {
      me.languages = data;
    };
    getLanguages(fun);
  }

  createProject(projectName: string): Project {
    return this.projectManager.createProject(projectName);
  }

  //Product Line functions_ START***********
  createLPS(project: Project, productLineName: string) {
    return this.projectManager.createLps(project, productLineName);
  }

  addNewProductLineListener(listener: any) {
    this.NewProductLineListeners.push(listener);
  }

  removeNewProductLineListener(listener: any) {
    this.NewProductLineListeners[listener] = null;
  }

  raiseEventNewProductLine(productLine: ProductLine) {
    let me = this;
    let e = new NewProductLineEventArg(me, me._project, productLine);
    for (let index = 0; index < me.NewProductLineListeners.length; index++) {
      let callback = this.NewProductLineListeners[index];
      callback(e);
    }
  }
  //Product Line functions_ END***********

  //Application functions_ START***********
  createApplication(
    project: Project,
    applicationName: string,
    productLineId: number
  ) {
    return this.projectManager.createApplication(
      project,
      applicationName,
      productLineId
    );
  }

  addNewApplicationListener(listener: any) {
    this.NewApplicationListeners.push(listener);
  }

  removeNewApplicationListener(listener: any) {
    this.NewApplicationListeners[listener] = null;
  }

  raiseEventApplication(application: Application) {
    let me = this;
    let e = new NewApplicationEventArg(me, me._project, application);
    for (let index = 0; index < me.NewApplicationListeners.length; index++) {
      let callback = this.NewApplicationListeners[index];
      callback(e);
    }
  }
  //Application functions_ END***********

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
