import { getLanguages } from "../../DataProvider/Services/languageService";
import { Adaptation } from "../../Domain/ProjectManagement/Entities/Adaptation";
import { Application } from "../../Domain/ProjectManagement/Entities/Application";
import { Model } from "../../Domain/ProjectManagement/Entities/Model";
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

export class NewAdaptationEventArg {
  public target: any;
  public project: Project;
  public adaptation: Adaptation;

  constructor(target: any, project: Project, adaptation: Adaptation) {
    this.target = target;
    this.project = project;
    this.adaptation = adaptation;
  }
}

export class NewModelEventArg {
  public target: any;
  public project: Project;
  public model: Model;

  constructor(target: any, project: Project, model: Model) {
    this.target = target;
    this.project = project;
    this.model = model;
  }
}

export default class ProjectService {
  private graph: any;
  private projectManager: ProjectManager = new ProjectManager();
  private _project: Project = this.createProject("");
  private languages: any;

  private NewProductLineListeners: any = [];
  private NewApplicationListeners: any = [];
  private NewAdaptationListeners: any = [];
  private NewDomainEngineeringModelListeners: any = [];
  private NewApplicationModelListeners: any = [];
  private NewAdaptationModelListeners: any = [];
  
  
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

  //Adaptation functions_ START***********
  createAdaptation(
    project: Project,
    adaptationName: string,
    productLineId: number,
    applicationId: number
  ) {
    return this.projectManager.createAdaptation(
      project,
      adaptationName,
      productLineId,
      applicationId
    );
  }

  addNewAdaptationListener(listener: any) {
    this.NewAdaptationListeners.push(listener);
  }

  removeNewAdaptationListener(listener: any) {
    this.NewAdaptationListeners[listener] = null;
  }

  raiseEventAdaptation(adaptation: Adaptation) {
    let me = this;
    let e = new NewAdaptationEventArg(me, me._project, adaptation);
    for (let index = 0; index < me.NewAdaptationListeners.length; index++) {
      let callback = this.NewAdaptationListeners[index];
      callback(e);
    }
  }
  //Adaptation functions_ END***********

  //createDomainEngineeringModel functions_ START***********
  createDomainEngineeringModel(
    project: Project,
    languageType: string,
    productLineId: number
  ) {
    return this.projectManager.createDomainEngineeringModel(
      project,
      languageType,
      productLineId
    );
  }

  addNewDomainEngineeringModelListener(listener: any) {
    this.NewDomainEngineeringModelListeners.push(listener);
  }

  removeNewDomainEngineeringModelListener(listener: any) {
    this.NewDomainEngineeringModelListeners[listener] = null;
  }

  raiseEventDomainEngineeringModel(model: Model) {
    let me = this;
    let e = new NewModelEventArg(me, me._project, model);
    for (
      let index = 0;
      index < me.NewDomainEngineeringModelListeners.length;
      index++
    ) {
      let callback = this.NewDomainEngineeringModelListeners[index];
      callback(e);
    }
  }
  //createDomainEngineeringModel functions_ END***********

  //createApplicationModel functions_ START***********
  createApplicationModel(
    project: Project,
    languageType: string,
    productLineId: number,
    applicationId: number
  ) {
    return this.projectManager.createApplicationModel(
      project,
      languageType,
      productLineId,
      applicationId
    );
  }

  addNewApplicationModelListener(listener: any) {
    this.NewApplicationModelListeners.push(listener);
  }

  removeNewApplicationModelListener(listener: any) {
    this.NewApplicationModelListeners[listener] = null;
  }

  raiseEventApplicationModelModel(model: Model) {
    let me = this;
    let e = new NewModelEventArg(me, me._project, model);
    for (
      let index = 0;
      index < me.NewApplicationModelListeners.length;
      index++
    ) {
      let callback = this.NewApplicationModelListeners[index];
      callback(e);
    }
  }
  //createApplicationModel functions_ END***********



  //createAdaptationModel functions_ START***********
  createAdaptationModel(
    project: Project,
    languageType: string,
    productLineId: number,
    applicationId: number,
    adaptationId: number
  ) {
    return this.projectManager.createAdaptationModel(
      project,
      languageType,
      productLineId,
      applicationId,
      adaptationId
    );
  }

  addNewAdaptationModelListener(listener: any) {
    this.NewAdaptationModelListeners.push(listener);
  }

  removeNewAdaptationModelListener(listener: any) {
    this.NewAdaptationModelListeners[listener] = null;
  }

  raiseEventAdaptationModelModel(model: Model) {
    let me = this;
    let e = new NewModelEventArg(me, me._project, model);
    for (
      let index = 0;
      index < me.NewAdaptationModelListeners.length;
      index++
    ) {
      let callback = this.NewAdaptationModelListeners[index];
      callback(e);
    }
  }
  //createAdaptationModel functions_ END***********

  
  //createApplicationEngineeringModel functions_ START***********

  //createApplicationEngineeringModel functions_ END***********

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
