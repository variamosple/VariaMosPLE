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
  Adaptation = "Adaptation",
}

export type ModelLookupResult = {
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

    let model = ProjectUseCases.findModelById(project, idItem);
    if (model) {
      model.name = newName;
      return project;
    }

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

  getItemProjectName(project: Project, idItem: string): string {
    let currentLP = 0;
    let currentAp = 0;
    let currentAdapt = 0;

    let model = ProjectUseCases.findModelById(project, idItem);
    if (model) {
      return model.name;
    }
    for (let pl = 0; pl < project.productLines.length; pl++) {
      const productLine = project.productLines[pl];
      // search productLine
      if (productLine.id === idItem) {
        return project.productLines[currentLP].name;
      }
      for (
        let ae = 0;
        ae < productLine.applicationEngineering.applications.length;
        ae++
      ) {
        const application = productLine.applicationEngineering.applications[ae];
        // search application
        if (application.id === idItem) {
          return project.productLines[currentLP].applicationEngineering
            .applications[currentAp].name;
        }
        for (let ad = 0; ad < application.adaptations.length; ad++) {
          const adaptation = application.adaptations[ad];
          // search adaptation
          if (adaptation.id === idItem) {
            return project.productLines[currentLP].applicationEngineering
              .applications[currentAp].adaptations[currentAdapt].name;
          }
          currentAdapt = currentAdapt + 1;
        }
        currentAp = currentAp + 1;
      }
      currentLP = currentLP + 1;
    }
    return null;
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

  createLps(
    project: Project,
    producLineName: string,
    type: string,
    domain: string
  ): ProductLine {
    let productLine: ProductLine = new ProductLine(
      ProjectUseCases.generateId(),
      producLineName,
      type,
      domain
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
    productLine: number,
    name: string
  ): Model {
    let model: Model = new Model(
      ProjectUseCases.generateId(),
      name,
      languageType
    );
    project.productLines[productLine].domainEngineering?.models.push(model);

    //Ejecutar el consumo de mxGraph.

    return model;
  }

  createApplicationEngineeringModel(
    project: Project,
    languageType: string,
    productLine: number,
    name: string
  ): Model {
    let model: Model = new Model(
      ProjectUseCases.generateId(),
      name,
      languageType
    );
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
    application: number,
    name: string
  ): Model {
    // let modelName = this.findLanguage(LanguageType);

    let model: Model = new Model(
      ProjectUseCases.generateId(),
      name,
      languageType
    );

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
    adaptation: number,
    name: string
  ): Model {
    // let modelName = this.findLanguage(LanguageType);

    let model: Model = new Model(
      ProjectUseCases.generateId(),
      name,
      languageType
    );

    project.productLines[productLine].applicationEngineering.applications[
      application
    ].adaptations[adaptation].models.push(model);

    //Ejecutar el consumo de mxGraph.

    return model;
  }

  static findModelByName(
    project: Project,
    type: string,
    modelName: string,
    modelNeighborId: string
  ): Model {
    //encuentra un modelo por nombre y tipo cercano a otro a nivel de carpeta
    let modelNeighborDomain = this.findDomainFolder(project, modelNeighborId);
    let modelNeighborApplication = this.findApplicationFolder(
      project,
      modelNeighborId
    );
    let modelNeighborAdaptation = this.findAdaptationFolder(
      project,
      modelNeighborId
    );

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
      } else if (type == "Application") {
        for (
          let ap = 0;
          ap < productLine.applicationEngineering.applications.length;
          ap++
        ) {
          const application =
            productLine.applicationEngineering.applications[ap];
          for (let k = 0; k < application.models.length; k++) {
            const model = application.models[k];
            if (model.name == modelName) {
              if (application == modelNeighborApplication) {
                return model;
              }
            }
          }
        }
      } else {
        for (
          let ap = 0;
          ap < productLine.applicationEngineering.applications.length;
          ap++
        ) {
          const application =
            productLine.applicationEngineering.applications[ap];
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
        for (
          let ap = 0;
          ap < productLine.applicationEngineering.applications.length;
          ap++
        ) {
          const application =
            productLine.applicationEngineering.applications[ap];
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
      for (
        let ap = 0;
        ap < productLine.applicationEngineering.applications.length;
        ap++
      ) {
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
      for (
        let ap = 0;
        ap < productLine.applicationEngineering.applications.length;
        ap++
      ) {
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

    let relationship: Relationship = new Relationship(
      ProjectUseCases.generateId(),
      name,
      type,
      sourceId,
      targetId,
      points,
      min,
      max,
      properties
    );
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
  ) {}

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

  static findModelById(project: Project, uid: any) {
    if (project && uid) {
      for (let pl = 0; pl < project.productLines.length; pl++) {
        const productLine: ProductLine = project.productLines[pl];
        for (let m = 0; m < productLine.domainEngineering.models.length; m++) {
          const model: Model = productLine.domainEngineering.models[m];
          if (model.id == uid) {
            return model;
          }
        }
        for (
          let m = 0;
          m < productLine.applicationEngineering.models.length;
          m++
        ) {
          const model: Model = productLine.applicationEngineering.models[m];
          if (model.id == uid) {
            return model;
          }
        }
        for (
          let ap = 0;
          ap < productLine.applicationEngineering.applications.length;
          ap++
        ) {
          const application: Application =
            productLine.applicationEngineering.applications[ap];
          for (let m = 0; m < application.models.length; m++) {
            const model: Model = application.models[m];
            if (model.id == uid) {
              return model;
            }
          }
          for (let ad = 0; ad < application.adaptations.length; ad++) {
            const adaptation: Adaptation = application.adaptations[ad];
            for (let m = 0; m < adaptation.models.length; m++) {
              const model: Model = adaptation.models[m];
              if (model.id == uid) {
                return model;
              }
            }
          }
        }
      }
    }
    return null;
  }

  static findModelElementById(model: Model, uid: any) {
    if (model) {
      for (let i = 0; i < model.elements.length; i++) {
        const element: Element = model.elements[i];
        if (element.id === uid) {
          return element;
        }
      }
    }
    return null;
  }

  static findModelElementPropertyById(model: Model, uid: any) {
    if (model) {
      for (const elem of model.elements) {
        for (const prop of elem.properties) {
          if (prop.id === uid) {
            return [elem, prop];
          }
        }
      }
    }
    return null;
  }

  static findModelElementPropertyByIdInProject(project: Project, id: any) {
    for (let i = 0; i < project.productLines.length; i++) {
      const productLine = project.productLines[i];
      for (let k = 0; k < productLine.domainEngineering.models.length; k++) {
        const model = productLine.domainEngineering.models[k];
        const [element, elementProperty] = this.findModelElementPropertyById(
          model,
          id
        );
        if (element && elementProperty) {
          return [element, elementProperty];
        }
      }
      for (
        let ap = 0;
        ap < productLine.applicationEngineering.applications.length;
        ap++
      ) {
        const application = productLine.applicationEngineering.applications[ap];
        for (let k = 0; k < application.models.length; k++) {
          const model = application.models[k];
          const [element, elementProperty] = this.findModelElementPropertyById(
            model,
            id
          );
          if (element && elementProperty) {
            return [element, elementProperty];
          }
        }
        for (let ad = 0; ad < application.adaptations.length; ad++) {
          const adaptation = application.adaptations[ad];
          for (let k = 0; k < adaptation.models.length; k++) {
            const model = adaptation.models[k];
            const [element, elementProperty] =
              this.findModelElementPropertyById(model, id);
            if (element && elementProperty) {
              return [element, elementProperty];
            }
          }
        }
      }
    }
    return null;
  }
  static findModelElementByName(model: Model, name: any) {
    if (model) {
      for (let i = 0; i < model.elements.length; i++) {
        const element: any = model.elements[i];
        if (element.name == name) {
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
      for (
        let ap = 0;
        ap < productLine.applicationEngineering.applications.length;
        ap++
      ) {
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

  _findProperty(propName: string, element: Element) {
    const property = element.properties.find((p) => p.name === propName);
    return property;
  }

  // Perform a reset of the selection state of all elements in the currently
  // active model
  resetSelection(modelLookupResult: ModelLookupResult) {
    if (modelLookupResult.model) {
      for (const element of modelLookupResult.model.elements) {
        const property = this._findProperty("Selected", element);
        if (property) {
          property.value = "Undefined";
        }
      }
    } else {
      console.error("Model not found");
    }
  }

  //Update the selection state of all elements in the currently active model
  //based on an incoming project response from the translator backend
  updateSelection(project: Project, response: Project, modelId: string) {
    const currentModelLookupResult = this.findModel(project, modelId);
    const incomingModelLookupResult = this.findModel(response, modelId);
    if (currentModelLookupResult && incomingModelLookupResult) {
      const currentModel = currentModelLookupResult.model;
      const incomingModel = incomingModelLookupResult.model;
      for (const currentElement of currentModel.elements) {
        const incomingElement = incomingModel.elements.find(
          (e) => e.id === currentElement.id
        );
        for (const prop of currentElement.properties) {
          const currentSelectedProperty = this._findProperty(
            prop.name,
            currentElement
          );
          const incomingSelectedProperty = this._findProperty(
            prop.name,
            incomingElement
          );
          if (currentSelectedProperty && incomingSelectedProperty) {
            currentSelectedProperty.value = incomingSelectedProperty.value;
          }
        }
        // if (incomingElement) {
        //   const currentSelectedProperty = this._findProperty('Selected', currentElement);
        //   const incomingSelectedProperty = this._findProperty('Selected', incomingElement);
        //   if (currentSelectedProperty && incomingSelectedProperty) {
        //     currentSelectedProperty.value = incomingSelectedProperty.value;
        //   }
        // }
      }
    }
    return currentModelLookupResult;
  }

  // find a specific model based on the currently active model
  findModel(project: Project, modelId: string): ModelLookupResult | null {
    for (const [plIdx, productLine] of project.productLines.entries()) {
      for (const [
        modelIdx,
        model,
      ] of productLine.domainEngineering.models.entries()) {
        if (model.id === modelId) {
          return {
            model,
            modelType: ModelType.Domain,
            plIdx: plIdx,
            modelIdx: modelIdx,
          };
        }
      }
      for (const [
        appEngIdx,
        appEngModel,
      ] of productLine.applicationEngineering.models.entries()) {
        if (appEngModel.id === modelId) {
          return {
            model: appEngModel,
            modelType: ModelType.ApplicationEng,
            plIdx: plIdx,
            modelIdx: appEngIdx,
          };
        }
      }
      for (const [
        applicationIdx,
        application,
      ] of productLine.applicationEngineering.applications.entries()) {
        for (const [modelIdx, model] of application.models.entries()) {
          if (model.id === modelId) {
            return {
              model,
              modelType: ModelType.Application,
              plIdx: plIdx,
              modelIdx: modelIdx,
              appIdx: applicationIdx,
            };
          }
        }
        for (const [
          adaptationIdx,
          adaptation,
        ] of application.adaptations.entries()) {
          for (const [modelIdx, model] of adaptation.models.entries()) {
            if (model.id === modelId) {
              return {
                model,
                modelType: ModelType.Adaptation,
                plIdx: plIdx,
                modelIdx: modelIdx,
                appIdx: applicationIdx,
                adapIdx: adaptationIdx,
              };
            }
          }
        }
      }
    }
    return null;
  }
}
