import { Adaptation } from "../Entities/Adaptation";
import { Application } from "../Entities/Application";
import { Model } from "../Entities/Model";
import { ProductLine } from "../Entities/ProductLine";
import { Project } from "../Entities/Project";
import { Relationship } from "../Entities/Relationship";
import { Point } from "../Entities/Point";
import { Property } from "../Entities/Property";

export default class ProjectUseCases {
  // constructor() {
  // }

  createProject(projectName: string): Project {
    let project = new Project(this.generateId(), projectName);
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
      this.generateId(),
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
      this.generateId(),
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
      this.generateId(),
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
    let model: Model = new Model(this.generateId(), languageType);
    project.productLines[productLine].domainEngineering?.models.push(model);

    //Ejecutar el consumo de mxGraph.

    return model;
  }

  createApplicationEngineeringModel(
    project: Project,
    languageType: string,
    productLine: number
  ): Model {
    let model: Model = new Model(this.generateId(), languageType);
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

    let model: Model = new Model(this.generateId(), languageType);

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

    let model: Model = new Model(this.generateId(), languageType);

    project.productLines[productLine].applicationEngineering.applications[
      application
    ].adaptations[adaptation].models.push(model);

    //Ejecutar el consumo de mxGraph.

    return model;
  }

  createRelationship(
    model: Model,
    name: string,
    sourceId: string,
    targetId: string,
    points: Point[] = [],
    min: number,
    max: number,
    properties: Property[] 
  ): Relationship {
    // let modelName = this.findLanguage(LanguageType);

    let relationship: Relationship = new Relationship(this.generateId(), name, sourceId, targetId, points, min, max, properties );
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

  generateId(): string {
    var dt = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
    return uuid;
  }
}
