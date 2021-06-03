import LanguageService from "../../DataProvider/Services/languageService";
import { Adaptation } from "../../Domain/ProductLineEngineering/Entities/Adaptation";
import { Application } from "../../Domain/ProductLineEngineering/Entities/Application";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { ProductLine } from "../../Domain/ProductLineEngineering/Entities/ProductLine";
import { Project } from "../../Domain/ProductLineEngineering/Entities/Project";
import { NewModelEventArg } from "./Events/NewModelEventArg";
import ProjectManager from "../../Domain/ProductLineEngineering/UseCases/ProjectUseCases";
import { Language } from "../../Domain/ProductLineEngineering/Entities/Language";
import LanguageUseCases from "../../Domain/ProductLineEngineering/UseCases/LanguageUseCases";
import { SelectedModelEventArg } from "./Events/SelectedModelEventArg";
import { LanguagesDetailEventArg } from "./Events/LanguagesDetailEventArg";
import { ProjectEventArg } from "./Events/ProjectEventArg";
import { NewProductLineEventArg } from "./Events/NewProductLineEventArg";
import { NewApplicationEventArg } from "./Events/NewApplicationEventArg";
import { NewAdaptationEventArg } from "./Events/NewAdaptationEventArg";

export default class ProjectService {
  private graph: any;
  private projectManager: ProjectManager = new ProjectManager();
  private languageUseCases: LanguageUseCases = new LanguageUseCases();
  private languageService: LanguageService = new LanguageService();
  private _languages: any;
  private _languagesDetail: Language[] = this.getLanguagesDetail();
  private _project: Project = this.createProject("");
  private treeItemSelected: string = "";
  private productLineSelected: number = 0;
  private applicationSelected: number = 0;
  private adaptationSelected: number = 0;

  private newProductLineListeners: any = [];
  private newApplicationListeners: any = [];
  private newAdaptationListeners: any = [];
  private newDomainEngineeringModelListeners: any = [];
  private newApplicationModelListeners: any = [];
  private newAdaptationModelListeners: any = [];
  private selectedModelListeners: any = [];
  private loadLanguagesListeners: any = [];
  private updateProjectListeners: any = [];
  private updateSelectedListeners: any = [];

  constructor() {
    let me = this;
    let fun = function (data: any) {
      me._languages = data;
    };

    this.languageService.getLanguages(fun);
  }

  //Search Model functions_ START***********
  modelDomainSelected(idPl: number, idDomainModel: number) {
    let modelSelected =
      this._project.productLines[idPl].domainEngineering?.models[idDomainModel];
    this.raiseEventSelectedModel(modelSelected);
  }

  modelApplicationEngSelected(idPl: number, idApplicationEngModel: number) {
    let modelSelected =
      this._project.productLines[idPl].applicationEngineering?.models[
        idApplicationEngModel
      ];
    this.raiseEventSelectedModel(modelSelected);
  }

  modelApplicationSelected(
    idPl: number,
    idApplication: number,
    idApplicationModel: number
  ) {
    let modelSelected =
      this._project.productLines[idPl].applicationEngineering?.applications[
        idApplication
      ].models[idApplicationModel];
    this.raiseEventSelectedModel(modelSelected);
  }

  modelAdaptationSelected(
    idPl: number,
    idApplication: number,
    idAdaptation: number,
    idAdaptationModel: number
  ) {
    let modelSelected =
      this._project.productLines[idPl].applicationEngineering?.applications[
        idApplication
      ].adaptations[idAdaptation].models[idAdaptationModel];
    this.raiseEventSelectedModel(modelSelected);
  }

  addSelectedModelListener(listener: any) {
    this.selectedModelListeners.push(listener);
  }

  removeSelectedModelListener(listener: any) {
    this.selectedModelListeners[listener] = null;
  }

  raiseEventSelectedModel(model: Model | undefined) {
    if (model) {
      let me = this;
      let e = new SelectedModelEventArg(me, model);
      for (let index = 0; index < me.selectedModelListeners.length; index++) {
        let callback = this.selectedModelListeners[index];
        callback(e);
      }
    }
  }

  updateAdaptationSelected(
    idPl: number,
    idApplication: number,
    idAdaptation: number
  ) {
    this.productLineSelected = idPl;
    this.applicationSelected = idApplication;
    this.adaptationSelected = idAdaptation;
    this.treeItemSelected = "adaptation";
    this.raiseEventUpdateSelected(this.treeItemSelected);
  }
  updateApplicationSelected(idPl: number, idApplication: number) {
    this.productLineSelected = idPl;
    this.applicationSelected = idApplication;
    this.treeItemSelected = "application";
    this.raiseEventUpdateSelected(this.treeItemSelected);
  }
  updateLpSelected(idPl: number) {
    this.productLineSelected = idPl;
    this.treeItemSelected = "productLine";
    this.raiseEventUpdateSelected(this.treeItemSelected);
  }

  updateDomainEngSelected() {
    this.treeItemSelected = "domainEngineering";
    this.raiseEventUpdateSelected(this.treeItemSelected);
  }

  updateAppEngSelected() {
    this.treeItemSelected = "applicationEngineering";
    this.raiseEventUpdateSelected(this.treeItemSelected);
  }

  getTreeItemSelected() {
    return this.treeItemSelected;
  }

  setTreeItemSelected(value: string) {
    this.treeItemSelected = value;
  }

  addUpdateSelectedListener(listener: any) {
    this.updateSelectedListeners.push(listener);
  }

  removeUpdateSelectedListener(listener: any) {
    this.updateSelectedListeners[listener] = null;
  }

  raiseEventUpdateSelected(itemSelected: string) {
    let me = this;
    let e: string = itemSelected;
    for (let index = 0; index < me.updateSelectedListeners.length; index++) {
      let callback = this.updateSelectedListeners[index];
      callback(e);
    }
  }
  //Search Model functions_ END***********

  //Language functions_ START***********
  public get languagesDetail(): Language[] {
    return this._languagesDetail;
  }

  public get languages(): Language[] {
    return this._languages;
  }

  getLanguagesDetail(): Language[] {
    return this.languageUseCases.getLanguagesDetail();
  }

  addLanguagesDetailListener(listener: any) {
    this.loadLanguagesListeners.push(listener);
  }

  removeLanguagesDetailListener(listener: any) {
    this.loadLanguagesListeners[listener] = null;
  }

  raiseEventLanguagesDetail(language: Language[]) {
    let me = this;
    let e = new LanguagesDetailEventArg(me, language);
    for (let index = 0; index < me.loadLanguagesListeners.length; index++) {
      let callback = this.loadLanguagesListeners[index];
      callback(e);
    }
  }

  getLanguagesByType(languageType: string, _languages: Language[]): Language[] {
    return this.languageUseCases.getLanguagesByType(languageType, _languages);
  }

  //Language functions_ END***********

  //Project functions_ START***********
  public get project(): Project {
    return this._project;
  }

  public set project(value: Project) {
    this._project = value;
  }

  createProject(projectName: string): Project {
    let project = this.projectManager.createProject(projectName);
    project = this.loadProject(project);

    return project;
  }

  loadProject(project: Project): Project {
    let projectSessionStorage = sessionStorage.getItem("Project");
    if (projectSessionStorage) {
      project = Object.assign(project, JSON.parse(projectSessionStorage));
    }

    return project;
  }

  saveProject(): void {
    this.projectManager.saveProject(this._project);
  }

  deleteProject(): void {
    this.projectManager.deleteProject();
    window.location.reload();
  }

  exportProject() {
    var dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(this._project));
    var downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", this._project.id + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  updateProjectState(state: boolean) {
    this._project.enable = state;
    this.raiseEventUpdateProject(this._project);
  }

  updateProjectName(name: string) {
    this._project.name = name;
    this.raiseEventUpdateProject(this._project);
  }

  addUpdateProjectListener(listener: any) {
    this.updateProjectListeners.push(listener);
  }

  removeUpdateProjectListener(listener: any) {
    this.updateProjectListeners[listener] = null;
  }

  raiseEventUpdateProject(project: Project) {
    let me = this;
    let e = new ProjectEventArg(me, project);
    for (let index = 0; index < me.updateProjectListeners.length; index++) {
      let callback = this.updateProjectListeners[index];
      callback(e);
    }
  }

  //Project functions_ END***********

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
  createApplication(project: Project, applicationName: string) {
    return this.projectManager.createApplication(
      project,
      applicationName,
      this.productLineSelected
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
  createAdaptation(project: Project, adaptationName: string) {
    return this.projectManager.createAdaptation(
      project,
      adaptationName,
      this.productLineSelected,
      this.applicationSelected
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
  createDomainEngineeringModel(project: Project, languageType: string) {
    return this.projectManager.createDomainEngineeringModel(
      project,
      languageType,
      this.productLineSelected
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
  createApplicationModel(project: Project, languageType: string) {
    return this.projectManager.createApplicationModel(
      project,
      languageType,
      this.productLineSelected,
      this.applicationSelected
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
  createAdaptationModel(project: Project, languageType: string) {
    return this.projectManager.createAdaptationModel(
      project,
      languageType,
      this.productLineSelected,
      this.applicationSelected,
      this.adaptationSelected
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

  // getLanguagesByType(language: string) {
  //   if (this.languages) {
  //     for (let index = 0; index < this.languages.length; index++) {
  //       if (this.languages[index].name === language) {
  //         return this.languages[index];
  //       }
  //     }
  //   }
  // }
}
