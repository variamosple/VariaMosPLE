import { getLanguages } from "../../../DataProvider/Services/languageService";
import {
  cAdaptation,
  cApplication,
  cApplicationEngineering,
  cDomainEngineering,
  cModel,
  cMyProject,
  cProductLine,
} from "../Entities/ProjectModel";
import { saveProject } from "./ProjectManagement";

export let myProject: cMyProject = initializerProject("", "", false);

export function initializerProject(
  ProjectName: string,
  ProducLineName: string,
  projectEnable: boolean
): cMyProject {
  try {
    let myProject = getProject();
    return myProject;
  } catch (e) {
    // let myProductLines: cProductLine[] = [];

    // let myProject = new cMyProject(ProjectName, myProductLines);
    // myProject.productLines.push(new cProductLine(ProducLineName));

    // *******TEST DEMO TREE************
    // getLanguages(); 
    let myProject = new cMyProject("Demo Project");
    myProject.productLines.push(new cProductLine("Product Line A"));
    myProject.productLines.push(new cProductLine("Product Line B"));

     let myModels: cModel[] = [];
    myProject.productLines[0].domainEngineering = new cDomainEngineering(myModels);
    myProject.productLines[0].domainEngineering?.models?.push(
      new cModel("Model A")
    );

    myProject.productLines[0].applicationEngineering = new cApplicationEngineering(myModels);
    myProject.productLines[0].applicationEngineering?.models?.push(
      new cModel("Model B")
    );

    if (projectEnable) {
      myProject.projectEnable = true;
      saveProject(myProject);
    }

    return myProject;
  }
}

export function getProject(): cMyProject {
  // Get saved data from sessionStorage
  let Project: cMyProject;
  try {
    Project = JSON.parse(window.sessionStorage.Project);
    return Project;
  } catch (e) {
    throw e;
  }
}
