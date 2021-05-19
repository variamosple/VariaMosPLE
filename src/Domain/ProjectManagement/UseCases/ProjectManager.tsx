import { Adaptation } from "../Entities/Adaptation";
import { Application } from "../Entities/Application";
import { ApplicationEngineering } from "../Entities/ApplicationEngineering";
import { DomainEngineering } from "../Entities/DomainEngineering";
import { Model } from "../Entities/Model";
import { ProductLine } from "../Entities/ProductLine";
import { Project } from "../Entities/Project";

export default class ProjectManager {
  // constructor() {
  // }

  createProject(ProjectName: string): Project {
    let project = new Project(ProjectName);
    return project;
  }

  createLps(Project: Project, ProducLineName: string): ProductLine {
    let productLine: ProductLine = new ProductLine(ProducLineName);
    productLine.domainEngineering = new DomainEngineering();
    productLine.applicationEngineering = new ApplicationEngineering();
    Project.productLines.push(productLine);
    return productLine;
  }

  createApplication(
    Project: Project,
    ApplicationName: string,
    ProductLine: number
  ): Project {
    Project.productLines[ProductLine].applicationEngineering?.applications.push(
      new Application(ApplicationName)
    );

    return Project;
  }

  createAdaptation(
    Project: Project,
    AdaptationName: string,
    ProductLine: number,
    Application: number
  ): Project {
    Project.productLines[ProductLine].applicationEngineering?.applications[
      Application
    ].adaptations?.push(new Adaptation(AdaptationName));

    return Project;
  }

  createDomainEngineeringModel(
    Project: Project,
    LanguageType: string,
    ProductLine: number
  ): Project {
    let modelName = this.findLanguage(LanguageType);

    Project.productLines[ProductLine].domainEngineering?.models?.push(
      new Model(modelName)
    );

    //Ejecutar el consumo de mxGraph.

    return Project;
  }

  findLanguage(LanguageType: string) {
    return "FeatureModel";
  }

  createApplicationEngineeringModel(
    Project: Project,
    LanguageType: string,
    ProductLine: number
  ): Project {
    let modelName = this.findLanguage(LanguageType);

    Project.productLines[ProductLine].applicationEngineering?.models?.push(
      new Model(modelName)
    );

    //Ejecutar el consumo de mxGraph.

    return Project;
  }

  createApplicationModel(
    Project: Project,
    LanguageType: string,
    ProductLine: number,
    Application: number
  ): Project {
    let modelName = this.findLanguage(LanguageType);

    Project.productLines[ProductLine].applicationEngineering?.applications[
      Application
    ].models?.push(new Model(modelName));

    //Ejecutar el consumo de mxGraph.

    return Project;
  }

  createAdaptationModel(
    Project: Project,
    LanguageType: string,
    ProductLine: number,
    Application: number,
    Adaptation: number
  ): Project {
    let modelName = this.findLanguage(LanguageType);

    Project.productLines[ProductLine].applicationEngineering?.applications[
      Application
    ].adaptations[Adaptation].models?.push(new Model(modelName));

    //Ejecutar el consumo de mxGraph.

    return Project;
  }

  saveProject(myProject: Project): void {
    // Save data to sessionStorage
    sessionStorage.setItem("Project", JSON.stringify(myProject));
  }

  deleteProject() {
    // Remove saved data from sessionStorage
    sessionStorage.removeItem("Project");

    // Remove all saved data from sessionStorage
    sessionStorage.clear();
  }
}
