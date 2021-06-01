import { Adaptation } from "../Entities/Adaptation";
import { Application } from "../Entities/Application";
import { ApplicationEngineering } from "../Entities/ApplicationEngineering";
import { DomainEngineering } from "../Entities/DomainEngineering";
import { Model } from "../Entities/Model";
import { ProductLine } from "../Entities/ProductLine";
import { Project } from "../Entities/Project";

export default class ProjectUseCases {
  // constructor() {
  // }

  createProject(projectName: string): Project {
    let project = new Project(this.generateId(), projectName);
    return project;
  }

  createLps(project: Project, producLineName: string): ProductLine {
    let productLine: ProductLine = new ProductLine(producLineName);
    productLine.domainEngineering = new DomainEngineering();
    productLine.applicationEngineering = new ApplicationEngineering();
    project.productLines.push(productLine);
    return productLine;
  }

  createApplication(
    project: Project,
    applicationName: string,
    productLine: number
  ): Application {
    let application: Application = new Application(applicationName);

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
    let adaptation: Adaptation = new Adaptation(adaptationName);
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
    // let modelName = this.findLanguage(LanguageType);

    let model: Model = new Model(languageType);
    project.productLines[productLine].domainEngineering?.models.push(model);

    //Ejecutar el consumo de mxGraph.

    return model;
  }

  createApplicationEngineeringModel(
    project: Project,
    languageType: string,
    productLine: number
  ): Model {
    // let modelName = this.findLanguage(LanguageType);
    let model: Model = new Model(languageType);

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

    let model: Model = new Model(languageType);

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

    let model: Model = new Model(languageType);

    project.productLines[productLine].applicationEngineering?.applications[
      application
    ].adaptations[adaptation].models.push(model);

    //Ejecutar el consumo de mxGraph.

    return model;
  }

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
