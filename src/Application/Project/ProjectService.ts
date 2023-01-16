import { Adaptation } from "../../Domain/ProductLineEngineering/Entities/Adaptation";
import { Application } from "../../Domain/ProductLineEngineering/Entities/Application";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { ProductLine } from "../../Domain/ProductLineEngineering/Entities/ProductLine";
import { Project } from "../../Domain/ProductLineEngineering/Entities/Project";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { NewModelEventArg } from "./Events/NewModelEventArg";
import ProjectManager from "../../Domain/ProductLineEngineering/UseCases/ProjectUseCases";
import { Language } from "../../Domain/ProductLineEngineering/Entities/Language";
import LanguageUseCases from "../../Domain/ProductLineEngineering/UseCases/LanguageUseCases";
import { SelectedModelEventArg } from "./Events/SelectedModelEventArg";
import { SelectedElementEventArg } from "./Events/SelectedElementEventArg";
import { UpdatedElementEventArg } from "./Events/UpdatedElementEventArg";
import { LanguagesDetailEventArg } from "./Events/LanguagesDetailEventArg";
import { ProjectEventArg } from "./Events/ProjectEventArg";
import { NewProductLineEventArg } from "./Events/NewProductLineEventArg";
import { NewApplicationEventArg } from "./Events/NewApplicationEventArg";
import { NewAdaptationEventArg } from "./Events/NewAdaptationEventArg";
import { ExternalFuntion } from "../../Domain/ProductLineEngineering/Entities/ExternalFuntion";
import { Utils } from "../../Addons/Library/Utils/Utils";
import _config from "../../Infraestructure/config.json";
import { Relationship } from "../../Domain/ProductLineEngineering/Entities/Relationship";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";
import { Point } from "../../Domain/ProductLineEngineering/Entities/Point";
import RestrictionsUseCases from "../../Domain/ProductLineEngineering/UseCases/RestrictionsUseCases";
import ProjectUseCases from "../../Domain/ProductLineEngineering/UseCases/ProjectUseCases";
import { isJSDocThisTag } from "typescript";
import * as alertify from "alertifyjs";

export default class ProjectService {
  private graph: any;
  private projectManager: ProjectManager = new ProjectManager();
  private languageUseCases: LanguageUseCases = new LanguageUseCases();
  private restrictionsUseCases: RestrictionsUseCases =
    new RestrictionsUseCases();

  private utils: Utils = new Utils();

  private _environment: string = _config.environment;
  private _languages: any = this.getLanguagesDetail();
  private _externalFunctions: ExternalFuntion[] = [];
  private _project: Project = this.createProject("");
  private treeItemSelected: string = "";
  private treeIdItemSelected: string = "";
  private productLineSelected: number = 0;
  private applicationSelected: number = 0;
  private adaptationSelected: number = 0;

  private newProductLineListeners: any = [];
  private newApplicationListeners: any = [];
  private newAdaptationListeners: any = [];
  private newDomainEngineeringModelListeners: any = [];
  private newApplicationEngineeringModelListeners: any = [];
  private newApplicationModelListeners: any = [];
  private newAdaptationModelListeners: any = [];
  private selectedModelListeners: any = [];
  private loadLanguagesListeners: any = [];
  private updateProjectListeners: any = [];
  private updateSelectedListeners: any = [];
  private selectedElementListeners: any = [];
  private updatedElementListeners: any = [];

  // constructor() {
  //   let me = this;
  //   let fun = function (data: any) {
  //     me._languages = data;
  //   };

  //   this.languageService.getLanguages(fun);
  // }

  public get externalFunctions(): ExternalFuntion[] {
    return this._externalFunctions;
  }

  public get environment(): string {
    return this._environment;
  }

  callExternalFuntion(externalFunction: ExternalFuntion, query: any) {
    let me = this;

    // Standard Request Start
    externalFunction.request = {};
    
    //pack the semantics
    const semantics = me._languages.filter((lang) => lang.id === externalFunction.language_id)[0].semantics;

    const data = { 
      modelSelectedId: me.treeIdItemSelected, 
      project: me._project,
      rules: semantics 
    };

    externalFunction.request = {
      transactionId: me.generateId(),
      data: !query ? data : { ...data, query },
    };
    // Standard Request End
    
  
    let callback = function (response: any) {
      //Decode content.
      //alert(JSON.stringify(response));
      if(externalFunction.resulting_action === 'download')
        response.data.content = Buffer.from(
          response.data.content,
          "base64"
        ).toString();

      if (response.data.name?.indexOf("json") > -1)
        response.data.content = JSON.parse(response.data.content);

      const resulting_action: any = {
        download: function () {
          me.utils.downloadFile(response.data.name, response.data.content);
        },
        showonscreen: function () {
          // alert(JSON.stringify(response.data.content));
          if('error' in response.data) {
            alertify.error(response.data.error);
          } else {
            alertify.success(String(response.data.content));
          // document.getElementById(me.treeIdItemSelected).click();
          }
        },
        updateproject: function() {

          if('error' in response.data) {
            alertify.error(response.data.error);
          } else {
            me.updateProject(response.data.content,me.treeIdItemSelected);
          // document.getElementById(me.treeIdItemSelected).click();
          }
        }
      };
      //Set the resulting action to be conditional on the query itself
      //since we will have a single mechanism for making these queries
      // TODO: FIXME: This is a dirty hack...
      if(!query){
        resulting_action[externalFunction.resulting_action]();
      } else {
        if(response.data.content?.productLines) {
          resulting_action['updateproject']()
        } else {
          resulting_action['showonscreen']()
        }
      }
    };
    alertify.success('request sent ...');
    me.languageUseCases.callExternalFuntion(callback, externalFunction);
  }

  loadExternalFunctions(languageName: string) {
    let me = this;
    let language = this._languages.filter(language => language.name == languageName);
    let callback = function (data: any) {
      me._externalFunctions = data;
    };
    if (language) {
      if (language.length>0) {
        this.languageUseCases.getExternalFunctions(callback, language[0].id);
      }
    } 
  }

  //Search Model functions_ START***********
  modelDomainSelected(idPl: number, idDomainModel: number) {
    let modelSelected =
      this._project.productLines[idPl].domainEngineering?.models[idDomainModel];

    this.treeItemSelected = "model";
    this.treeIdItemSelected = modelSelected.id;

    this.loadExternalFunctions(modelSelected.name);

    this.raiseEventSelectedModel(modelSelected);
    this.raiseEventUpdateSelected(this.treeItemSelected);
  }

  modelApplicationEngSelected(idPl: number, idApplicationEngModel: number) {
    let modelSelected =
      this._project.productLines[idPl].applicationEngineering?.models[
      idApplicationEngModel
      ];
    this.treeItemSelected = "model";
    this.treeIdItemSelected = modelSelected.id;

    this.loadExternalFunctions(modelSelected.name);

    this.raiseEventSelectedModel(modelSelected);
    this.raiseEventUpdateSelected(this.treeItemSelected);
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
    this.treeItemSelected = "model";
    this.treeIdItemSelected = modelSelected.id;

    this.loadExternalFunctions(modelSelected.name);

    this.raiseEventSelectedModel(modelSelected);
    this.raiseEventUpdateSelected(this.treeItemSelected);
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

    this.treeItemSelected = "model";
    this.treeIdItemSelected = modelSelected.id;

    this.loadExternalFunctions(modelSelected.name);

    this.raiseEventSelectedModel(modelSelected);
    this.raiseEventUpdateSelected(this.treeItemSelected);
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

  addSelectedElementListener(listener: any) {
    this.selectedElementListeners.push(listener);
  }

  removeSelectedElementListener(listener: any) {
    this.selectedElementListeners[listener] = null;
  }

  raiseEventSelectedElement(
    model: Model | undefined,
    element: Element | undefined
  ) {
    let me = this;
    let e = new SelectedElementEventArg(me, model, element);
    for (let index = 0; index < me.selectedElementListeners.length; index++) {
      let callback = this.selectedElementListeners[index];
      callback(e);
    }
  }

  addUpdatedElementListener(listener: any) {
    this.updatedElementListeners.push(listener);
  }

  removeUpdatedElementListener(listener: any) {
    this.updatedElementListeners[listener] = null;
  }

  raiseEventUpdatedElement(
    model: Model | undefined,
    element: Element | undefined
  ) {
    let me = this;
    let e = new UpdatedElementEventArg(me, model, element);
    for (let index = 0; index < me.updatedElementListeners.length; index++) {
      let callback = this.updatedElementListeners[index];
      callback(e);
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
    this.treeIdItemSelected =
      this._project.productLines[idPl].applicationEngineering.applications[
        idApplication
      ].adaptations[idAdaptation].id;
    this.raiseEventUpdateSelected(this.treeItemSelected);
  }
  updateApplicationSelected(idPl: number, idApplication: number) {
    this.productLineSelected = idPl;
    this.applicationSelected = idApplication;
    this.treeItemSelected = "application";
    this.treeIdItemSelected =
      this._project.productLines[idPl].applicationEngineering.applications[
        idApplication
      ].id;
    this.raiseEventUpdateSelected(this.treeItemSelected);
  }
  updateLpSelected(idPl: number) {
    this.productLineSelected = idPl;
    this.treeItemSelected = "productLine";
    this.treeIdItemSelected = this._project.productLines[idPl].id;
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

  public get languages(): Language[] {
    return this._languages;
  }

  getLanguagesDetail(): Language[] {
    return this.languageUseCases.getLanguagesDetail();
  }

  applyRestrictions(callback: any, model: Model) {
    let languageByName: Language = this.languageUseCases.getLanguageByName(
      model.name,
      this._languages
    );

    let restrictions: any =
      this.restrictionsUseCases.getRestrictions(languageByName);

    this.restrictionsUseCases.applyRestrictions(callback, model, restrictions);
  }

  getLanguagesDetailCll(callback: any) {
    return this.languageUseCases.getLanguagesDetailCll(callback);
  }

  createLanguage(callback: any, language: any) {
    language.abstractSyntax = JSON.parse(language.abstractSyntax);
    language.concreteSyntax = JSON.parse(language.concreteSyntax);
    language.semantics = JSON.parse(language.semantics);

    return this.languageUseCases.createLanguage(callback, language);
  }

  updateLanguage(callback: any, language: any, languageId: string) {
    language.id = languageId;
    language.abstractSyntax = JSON.parse(language.abstractSyntax);
    language.concreteSyntax = JSON.parse(language.concreteSyntax);
    language.semantics = JSON.parse(language.semantics);

    return this.languageUseCases.updateLanguage(callback, language);
  }

  deleteLanguage(callback: any, languageId: string) {
    return this.languageUseCases.deleteLanguage(callback, languageId);
  }

  existDomainModel(language: string): boolean {
    let existModel = this._project.productLines[
      this.productLineSelected
    ].domainEngineering.models.filter((model) => model.name === language)[0];

    if (existModel) return true;

    return false;
  }

  existApplicaioninEngModel(language: string): boolean {
    let existModel = this._project.productLines[
      this.productLineSelected
    ].applicationEngineering.models.filter(
      (model) => model.name === language
    )[0];

    if (existModel) return true;

    return false;
  }

  existApplicaioninModel(language: string): boolean {
    let existModel = this._project.productLines[
      this.productLineSelected
    ].applicationEngineering.applications[
      this.applicationSelected
    ].models.filter((model) => model.name === language)[0];

    if (existModel) return true;

    return false;
  }

  existAdaptationModel(language: string): boolean {
    let existModel = this._project.productLines[
      this.productLineSelected
    ].applicationEngineering.applications[this.applicationSelected].adaptations[
      this.adaptationSelected
    ].models.filter((model) => model.name === language)[0];

    if (existModel) return true;

    return false;
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

  languageExist(languageName: string): Boolean {
    return this.languageUseCases.getLanguageByName(
      languageName,
      this._languages
    )
      ? true
      : false;
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

  //This gets called when one uploads a project file
  //It takes as the parameters the file one selects from the
  //dialog
  importProject(file: string | undefined): void {
    console.log(file);
    if (file) {
      this._project = Object.assign(this._project, JSON.parse(file));
    }
    this.raiseEventUpdateProject(this._project);
  }

  updateProject(project: Project, modelSelectedId: string): void {
      this._project = project;    
    this.raiseEventUpdateProject(this._project);
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
    this.utils.downloadFile(this._project.id + ".json", this._project);
  }

  deleteItemProject() {
    this._project = this.projectManager.deleteItemProject(
      this._project,
      this.treeIdItemSelected
    );
    this.raiseEventUpdateProject(this._project);
  }

  refreshLanguageList() {
    this._languages = this.getLanguagesDetail();
    this.raiseEventLanguagesDetail(this._languages);
  }

  renameItemProject(newName: string) {
    this._project = this.projectManager.renameItemProject(
      this._project,
      this.treeIdItemSelected,
      newName
    );
    this.raiseEventUpdateProject(this._project);
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

  //createApplicationEngineeringModel functions_ START***********
  createApplicationEngineeringModel(project: Project, languageType: string) {
    return this.projectManager.createApplicationEngineeringModel(
      project,
      languageType,
      this.productLineSelected
    );
  }

  addNewApplicationEngineeringModelListener(listener: any) {
    this.newApplicationEngineeringModelListeners.push(listener);
  }

  removeNewApplicationEngineeringModelListener(listener: any) {
    this.newApplicationEngineeringModelListeners[listener] = null;
  }

  raiseEventApplicationEngineeringModel(model: Model) {
    let me = this;
    let e = new NewModelEventArg(me, me._project, model);
    for (
      let index = 0;
      index < me.newApplicationEngineeringModelListeners.length;
      index++
    ) {
      let callback = this.newApplicationEngineeringModelListeners[index];
      callback(e);
    }
  }
  //createApplicationEngineeringModel functions_ END***********

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



  duplicateObject(obj: any) {
    let str = JSON.stringify(obj);
    return JSON.parse(str);
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

  getLanguageDefinition(language: string) {
    if (this.languages) {
      for (let index = 0; index < this.languages.length; index++) {
        if (this.languages[index].name === language) {
          return this.languages[index];
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

  createRelationship(
    model: Model,
    name: string,
    type: string,
    sourceId: string,
    targetId: string,
    points: Point[] = [],
    min: number,
    max: number,
    properties: Property[]
  ): Relationship {
    let r = this.projectManager.createRelationship(
      model,
      name,
      type,
      sourceId,
      targetId,
      points,
      min,
      max,
      properties
    );
    return r;
  }

  findModelElementById(model: Model, uid: any) {
    return ProjectUseCases.findModelElementById(model, uid);
  }

  findModelRelationshipById(model: Model, uid: any) {
    return ProjectUseCases.findModelRelationshipById(model, uid);
  }

  removeModelElementById(model: Model, uid: any) {
    return ProjectUseCases.removeModelElementById(model, uid);
  }

  removeModelRelationshipById(model: Model, uid: any) {
    return ProjectUseCases.removeModelRelationshipById(model, uid);
  }

  removeModelRelationshipsOfElement(model: Model, uid: any) {
    return ProjectUseCases.removeModelRelationshipsOfElement(model, uid);
  }

  findModelByName(type: string, modelName: string, neightborModel: Model) {
    return ProjectUseCases.findModelByName(this._project, type, modelName, neightborModel.id);
  }

  findModelElementByIdInProject(elementId: string) {
    return ProjectUseCases.findModelElementByIdInProject(this._project, elementId);
  }

  generateId() {
    return ProjectUseCases.generateId();
  }
}
