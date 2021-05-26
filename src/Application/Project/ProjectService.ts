import LanguageService from "../../DataProvider/Services/languageService";
import { Adaptation } from "../../Domain/ProductLineEngineering/Entities/Adaptation";
import { Application } from "../../Domain/ProductLineEngineering/Entities/Application";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { ProductLine } from "../../Domain/ProductLineEngineering/Entities/ProductLine";
import { Project } from "../../Domain/ProductLineEngineering/Entities/Project";
import { NewModelEventArg } from "./Events/NewModelEventArg";
import ProjectManager from "../../Domain/ProductLineEngineering/UseCases/ProjectUseCases";

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

export default class ProjectService {
  private graph: any;
  private projectManager: ProjectManager = new ProjectManager();
  private languageService: LanguageService = new LanguageService();

  private _project: Project = this.createProject("");
  private languages: any;

  private newProductLineListeners: any = [];
  private newApplicationListeners: any = [];
  private newAdaptationListeners: any = [];
  private newDomainEngineeringModelListeners: any = [];
  private newApplicationModelListeners: any = [];
  private newAdaptationModelListeners: any = [];

  constructor() {
    let me = this;
    let fun = function (data: any) {
      me.languages = data;
    };
    this.languageService.getLanguages(fun);
  }

  createProject(projectName: string): Project {
    return this.projectManager.createProject(projectName);
  }

  //Product Line functions_ START***********
  createLPS(project: Project, productLineName: string) {
    return this.projectManager.createLps(project, productLineName);
  }

  addNewProductLineListener(listener: any) {
    this.newProductLineListeners.push(listener);
  }

  removeNewProductLineListener(listener: any) {
    this.newProductLineListeners[listener] = null;
  }

  raiseEventNewProductLine(productLine: ProductLine) {
    let me = this;
    let e = new NewProductLineEventArg(me, me._project, productLine);
    for (let index = 0; index < me.newProductLineListeners.length; index++) {
      let callback = this.newProductLineListeners[index];
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
    this.newApplicationListeners.push(listener);
  }

  removeNewApplicationListener(listener: any) {
    this.newApplicationListeners[listener] = null;
  }

  raiseEventApplication(application: Application) {
    let me = this;
    let e = new NewApplicationEventArg(me, me._project, application);
    for (let index = 0; index < me.newApplicationListeners.length; index++) {
      let callback = this.newApplicationListeners[index];
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
    this.newAdaptationListeners.push(listener);
  }

  removeNewAdaptationListener(listener: any) {
    this.newAdaptationListeners[listener] = null;
  }

  raiseEventAdaptation(adaptation: Adaptation) {
    let me = this;
    let e = new NewAdaptationEventArg(me, me._project, adaptation);
    for (let index = 0; index < me.newAdaptationListeners.length; index++) {
      let callback = this.newAdaptationListeners[index];
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
    this.newDomainEngineeringModelListeners.push(listener);
  }

  removeNewDomainEngineeringModelListener(listener: any) {
    this.newDomainEngineeringModelListeners[listener] = null;
  }

  raiseEventDomainEngineeringModel(model: Model) {
    let me = this;
    let e = new NewModelEventArg(me, me._project, model);
    for (
      let index = 0;
      index < me.newDomainEngineeringModelListeners.length;
      index++
    ) {
      let callback = this.newDomainEngineeringModelListeners[index];
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
    this.newApplicationModelListeners.push(listener);
  }

  removeNewApplicationModelListener(listener: any) {
    this.newApplicationModelListeners[listener] = null;
  }

  raiseEventApplicationModelModel(model: Model) {
    let me = this;
    let e = new NewModelEventArg(me, me._project, model);
    for (
      let index = 0;
      index < me.newApplicationModelListeners.length;
      index++
    ) {
      let callback = this.newApplicationModelListeners[index];
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
    this.newAdaptationModelListeners.push(listener);
  }

  removeNewAdaptationModelListener(listener: any) {
    this.newAdaptationModelListeners[listener] = null;
  }

  raiseEventAdaptationModelModel(model: Model) {
    let me = this;
    let e = new NewModelEventArg(me, me._project, model);
    for (
      let index = 0;
      index < me.newAdaptationModelListeners.length;
      index++
    ) {
      let callback = this.newAdaptationModelListeners[index];
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
