import { Adaptation } from "../Entities/Adaptation";
import { Application } from "../Entities/Application";
import { Model } from "../Entities/Model";
import { ProductLine } from "../Entities/ProductLine";
import { Project } from "../Entities/Project";
import { Relationship } from "../Entities/Relationship";
import { Point } from "../Entities/Point";
import { Property } from "../Entities/Property";
import { Element } from "../Entities/Element";


enum ModelType {
  Domain = "Domain",
  ApplicationEng = "ApplicationEng",
  Application = "Application",
  Adaptation = "Adaptation"
};

type ModelLookupResult = {
  model: Model;
  modelType: ModelType;
  plIdx: number;
  modelIdx: number;
  appIdx?: number;
  adapIdx?: number;
};
export default class ProjectUseCases {
  // constructor() {
  // }

  createProject(projectName: string): Project {
    let project = new Project(ProjectUseCases.generateId(), projectName);
    return project;
  }

  renameItemProject(
    project: Project,
    idItem: string,
    newName: string
  ): Project {
    let currentLP = 0;
    let currentAp = 0;
    let currentAdapt = 0;

    project.productLines.forEach((productLine) => {
      // search productLine
      if (productLine.id === idItem) {
        project.productLines[currentLP].name = newName;
        return project;
      }

      productLine.applicationEngineering.applications.forEach((application) => {
        // search application
        if (application.id === idItem) {
          project.productLines[currentLP].applicationEngineering.applications[
            currentAp
          ].name = newName;
          return project;
        }

        application.adaptations.forEach((adaptation) => {
          // search adaptation
          if (adaptation.id === idItem) {
            project.productLines[currentLP].applicationEngineering.applications[
              currentAp
            ].adaptations[currentAdapt].name = newName;
            return project;
          }

          currentAdapt = currentAdapt + 1;
        });
        currentAp = currentAp + 1;
      });
      currentLP = currentLP + 1;
    });
    return project;
  }

  deleteItemProject(project: Project, idItem: string): Project {
    let currentLP = 0;
    let currentAp = 0;
    let currentAdapt = 0;

    project.productLines.forEach((productLine) => {
      // search productLine
      if (productLine.id === idItem) {
        project.productLines = project.productLines.filter(
          (lp) => lp.id !== idItem
        );
        return project;
      }

      productLine.domainEngineering.models.forEach((domainModel) => {
        // search domainModel
        if (domainModel.id === idItem) {
          project.productLines[currentLP].domainEngineering.models =
            project.productLines[currentLP].domainEngineering.models.filter(
              (model) => model.id !== idItem
            );
          return project;
        }
      });

      productLine.applicationEngineering.models.forEach(
        (applicationEngModel) => {
          // search applicationEngModel
          if (applicationEngModel.id === idItem) {
            project.productLines[currentLP].applicationEngineering.models =
              project.productLines[
                currentLP
              ].applicationEngineering.models.filter(
                (model) => model.id !== idItem
              );
            return project;
          }
        }
      );

      productLine.applicationEngineering.applications.forEach((application) => {
        // search application
        if (application.id === idItem) {
          project.productLines[currentLP].applicationEngineering.applications =
            project.productLines[
              currentLP
            ].applicationEngineering.applications.filter(
              (app) => app.id !== idItem
            );
          return project;
        }

        application.models.forEach((applicationModel) => {
          // search applicationModel
          if (applicationModel.id === idItem) {
            project.productLines[currentLP].applicationEngineering.applications[
              currentAp
            ].models = project.productLines[
              currentLP
            ].applicationEngineering.applications[currentAp].models.filter(
              (model) => model.id !== idItem
            );
            return project;
          }
        });

        application.adaptations.forEach((adaptation) => {
          // search adaptation
          if (adaptation.id === idItem) {
            project.productLines[currentLP].applicationEngineering.applications[
              currentAp
            ].adaptations = project.productLines[
              currentLP
            ].applicationEngineering.applications[currentAp].adaptations.filter(
              (adp) => adp.id !== idItem
            );
            return project;
          }

          adaptation.models.forEach((adaptationModel) => {
            // search AdaptationModel
            if (adaptationModel.id === idItem) {
              project.productLines[
                currentLP
              ].applicationEngineering.applications[currentAp].adaptations[
                currentAdapt
              ].models = project.productLines[
                currentLP
              ].applicationEngineering.applications[currentAp].adaptations[
                currentAdapt
              ].models.filter((model) => model.id !== idItem);
              return project;
            }
          });

          currentAdapt = currentAdapt + 1;
        });
        currentAp = currentAp + 1;
      });
      currentLP = currentLP + 1;
    });
    return project;
  }

  createLps(project: Project, producLineName: string): ProductLine {
    let productLine: ProductLine = new ProductLine(
      ProjectUseCases.generateId(),
      producLineName
    );
    project.productLines.push(productLine);
    return productLine;
  }

  createApplication(
    project: Project,
    applicationName: string,
    productLine: number
  ): Application {
    let application: Application = new Application(
      ProjectUseCases.generateId(),
      applicationName
    );

    project.productLines[productLine].applicationEngineering?.applications.push(
      application
    );

    return application;
  }

  createAdaptation(
    project: Project,
    adaptationName: string,
    productLine: number,
    application: number
  ): Adaptation {
    let adaptation: Adaptation = new Adaptation(
      ProjectUseCases.generateId(),
      adaptationName
    );
    project.productLines[productLine].applicationEngineering?.applications[
      application
    ].adaptations?.push(adaptation);

    return adaptation;
  }

  createDomainEngineeringModel(
    project: Project,
    languageType: string,
    productLine: number
  ): Model {
    let model: Model = new Model(ProjectUseCases.generateId(), languageType);
    project.productLines[productLine].domainEngineering?.models.push(model);

    //Ejecutar el consumo de mxGraph.

    return model;
  }

  createApplicationEngineeringModel(
    project: Project,
    languageType: string,
    productLine: number
  ): Model {
    let model: Model = new Model(ProjectUseCases.generateId(), languageType);
    project.productLines[productLine].applicationEngineering?.models.push(
      model
    );

    //Ejecutar el consumo de mxGraph.

    return model;
  }

  createApplicationModel(
    project: Project,
    languageType: string,
    productLine: number,
    application: number
  ): Model {
    // let modelName = this.findLanguage(LanguageType);

    let model: Model = new Model(ProjectUseCases.generateId(), languageType);

    project.productLines[productLine].applicationEngineering?.applications[
      application
    ].models.push(model);

    //Ejecutar el consumo de mxGraph.

    return model;
  }

  createAdaptationModel(
    project: Project,
    languageType: string,
    productLine: number,
    application: number,
    adaptation: number
  ): Model {
    // let modelName = this.findLanguage(LanguageType);

    let model: Model = new Model(ProjectUseCases.generateId(), languageType);

    project.productLines[productLine].applicationEngineering.applications[
      application
    ].adaptations[adaptation].models.push(model);

    //Ejecutar el consumo de mxGraph.

    return model;
  }

  static findModelByName(project: Project, type: string, modelName: string, modelNeighborId: string): Model {
    //encuentra un modelo por nombre y tipo cercano a otro a nivel de carpeta
    let modelNeighborDomain = this.findDomainFolder(project, modelNeighborId);
    let modelNeighborApplication = this.findApplicationFolder(project, modelNeighborId);
    let modelNeighborAdaptation = this.findAdaptationFolder(project, modelNeighborId);

    for (let i = 0; i < project.productLines.length; i++) {
      const productLine = project.productLines[i];
      if (type == "Domain") {
        for (let k = 0; k < productLine.domainEngineering.models.length; k++) {
          const model = productLine.domainEngineering.models[k];
          if (model.name == modelName) {
            if (productLine.domainEngineering == modelNeighborDomain) {
              return model;
            }
          }
        }
      }
      else if (type == "Application") {
        for (let ap = 0; ap < productLine.applicationEngineering.applications.length; ap++) {
          const application = productLine.applicationEngineering.applications[ap];
          for (let k = 0; k < application.models.length; k++) {
            const model = application.models[k];
            if (model.name == modelName) {
              if (application == modelNeighborApplication) {
                return model;
              }
            }
          }
        }
      }
      else {
        for (let ap = 0; ap < productLine.applicationEngineering.applications.length; ap++) {
          const application = productLine.applicationEngineering.applications[ap];
          for (let ad = 0; ad < application.adaptations.length; ad++) {
            const adaptation = application.adaptations[ad];
            for (let k = 0; k < adaptation.models.length; k++) {
              const model = adaptation.models[k];
              if (model.name == modelName) {
                if (adaptation == modelNeighborAdaptation) {
                  return model;
                }
              }
            }
          }
        }
      }
    }
    return null;
  }

  static findDomainFolder(project: Project, modelId: string) {
    let applicationModel = this.findApplicationFolder(project, modelId);
    for (let i = 0; i < project.productLines.length; i++) {
      const productLine = project.productLines[i];
      if (applicationModel) {
        for (let ap = 0; ap < productLine.applicationEngineering.applications.length; ap++) {
          const application = productLine.applicationEngineering.applications[ap];
          if (application == applicationModel) {
            return productLine.domainEngineering;
          }
        }
      } else {
        const domain = productLine.domainEngineering;
        for (let k = 0; k < domain.models.length; k++) {
          const model = domain.models[k];
          if (model.id == modelId) {
            return domain;
          }
        }
      }
    }
  }

  static findApplicationFolder(project: Project, modelId: string) {
    for (let i = 0; i < project.productLines.length; i++) {
      const productLine = project.productLines[i];
      for (let ap = 0; ap < productLine.applicationEngineering.applications.length; ap++) {
        const application = productLine.applicationEngineering.applications[ap];
        for (let k = 0; k < application.models.length; k++) {
          const model = application.models[k];
          if (model.id == modelId) {
            return application;
          }
        }
        for (let ad = 0; ad < application.adaptations.length; ad++) {
          const adaptation = application.adaptations[ad];
          for (let k = 0; k < adaptation.models.length; k++) {
            const model = adaptation.models[k];
            if (model.id == modelId) {
              return application;
            }
          }
        }
      }
    }
  }

  static findAdaptationFolder(project: Project, modelId: string) {
    for (let i = 0; i < project.productLines.length; i++) {
      const productLine = project.productLines[i];
      for (let ap = 0; ap < productLine.applicationEngineering.applications.length; ap++) {
        const application = productLine.applicationEngineering.applications[ap];
        for (let ad = 0; ad < application.adaptations.length; ad++) {
          const adaptation = application.adaptations[ad];
          for (let k = 0; k < adaptation.models.length; k++) {
            const model = adaptation.models[k];
            if (model.id == modelId) {
              return adaptation;
            }
          }
        }
      }
    }
  }

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
    // let modelName = this.findLanguage(LanguageType);

    let relationship: Relationship = new Relationship(ProjectUseCases.generateId(), name, type, sourceId, targetId, points, min, max, properties);
    model.relationships.push(relationship);

    //Ejecutar el consumo de mxGraph.

    return relationship;
  }

  deleteTreeItemSelected(
    project: Project,
    language: string,
    productLine: number,
    application: number,
    adaptation: number,
    itemDelete: string | number
  ) { }

  saveProject(project: Project): void {
    // Save data to sessionStorage
    sessionStorage.setItem("Project", JSON.stringify(project));
  }

  deleteProject() {
    // Remove saved data from sessionStorage
    sessionStorage.removeItem("Project");

    // Remove all saved data from sessionStorage
    sessionStorage.clear();
  }

  static generateId(): string {
    var dt = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
    return uuid;
  }

  static findModelElementById(model: Model, uid: any) {
    if (model) {
      for (let i = 0; i < model.elements.length; i++) {
        const element: any = model.elements[i];
        if (element.id == uid) {
          return element;
        }
      }
    }
    return null;
  }

  static findModelRelationshipById(model: Model, uid: any) {
    let me = this;
    if (model) {
      for (let i = 0; i < model.relationships.length; i++) {
        const relationship: any = model.relationships[i];
        if (relationship.id == uid) {
          return relationship;
        }
      }
    }
    return null;
  }

  static findModelElementByIdInProject(project: Project, id: any) {
    for (let i = 0; i < project.productLines.length; i++) {
      const productLine = project.productLines[i];
      for (let k = 0; k < productLine.domainEngineering.models.length; k++) {
        const model = productLine.domainEngineering.models[k];
        const element = this.findModelElementById(model, id);
        if (element) {
          return element;
        }
      }
      for (let ap = 0; ap < productLine.applicationEngineering.applications.length; ap++) {
        const application = productLine.applicationEngineering.applications[ap];
        for (let k = 0; k < application.models.length; k++) {
          const model = application.models[k];
          const element = this.findModelElementById(model, id);
          if (element) {
            return element;
          }
        }
        for (let ad = 0; ad < application.adaptations.length; ad++) {
          const adaptation = application.adaptations[ad];
          for (let k = 0; k < adaptation.models.length; k++) {
            const model = adaptation.models[k];
            const element = this.findModelElementById(model, id);
            if (element) {
              return element;
            }
          }
        }
      }
    }
    return null;
  }

  static removeModelElementById(model: Model, uid: any) {
    if (model) {
      for (let i = 0; i < model.elements.length; i++) {
        const element: any = model.elements[i];
        if (element.id == uid) {
          model.elements.splice(i, 1);
          this.removeModelRelationshipsOfElement(model, uid);
          return;
        }
      }
    }
  }

  static removeModelRelationshipById(model: Model, uid: any) {
    if (model) {
      for (let i = 0; i < model.relationships.length; i++) {
        const relationship: any = model.relationships[i];
        if (relationship.id == uid) {
          model.relationships.splice(i, 1);
          return;
        }
      }
    }
  }

  static removeModelRelationshipsOfElement(model: Model, uid: any) {
    if (model) {
      for (let i = model.relationships.length - 1; i >= 0; i--) {
        const relationship: any = model.relationships[i];
        if (relationship.sourceId == uid || relationship.targetId == uid) {
          model.relationships.splice(i, 1);
        }
      }
    }
  }

  _findProperty(propName: string, element: Element){
    const property = element.properties.find(p => p.name === propName);
    return property;
  }

  // Perform a reset of the selection state of all elements in the currently
  // active model
  resetSelection(modelLookupResult: ModelLookupResult) {
    if (modelLookupResult.model) {
      for (const element of modelLookupResult.model.elements) {
        this._findProperty('Selected', element).value = "Undefined";
      }
    } else {
      console.error("Model not found");
    }
  }


  // find a specific model based on the currently active model
  findModel(project: Project, modelId: string): ModelLookupResult | null {
    for (const [plIdx, productLine] of project.productLines.entries()) {
      for (const [modelIdx, model] of productLine.domainEngineering.models.entries()) {
        if (model.id === modelId) {
          return {model, modelType: ModelType.Domain, plIdx: plIdx, modelIdx: modelIdx};
        }
      }
      for (const [appEngIdx, appEngModel] of productLine.applicationEngineering.models.entries()) {
        if (appEngModel.id === modelId) {
          return {model: appEngModel, modelType: ModelType.ApplicationEng, plIdx: plIdx, modelIdx: appEngIdx};
        }
      }
      for (const [applicationIdx, application] of productLine.applicationEngineering.applications.entries()) {
        for (const [modelIdx, model] of application.models.entries()) {
          if (model.id === modelId) {
            return {model, modelType: ModelType.Application, plIdx: plIdx, modelIdx: modelIdx, appIdx: applicationIdx};
          }
        }
        for (const [adaptationIdx, adaptation] of application.adaptations.entries()) {
          for (const [modelIdx, model] of adaptation.models.entries()) {
            if (model.id === modelId) {
              return {model, modelType: ModelType.Adaptation, plIdx: plIdx, modelIdx: modelIdx, appIdx: applicationIdx, adapIdx: adaptationIdx};
            }
          }
        }
      }
    }
    return null;
  }
}
