
import {
    cAdaptation,
    cApplication,
    cApplicationEngineering,
    cDomainEngineering,
    cModel,
    cMyProject,
    cProductLine,
} from "../Entities/ProjectModel";

export default class ProjectManager {

    constructor() {
    }

    createProject(ProjectName: string, ProducLineName: string): cMyProject {
        let myProject = new cMyProject(ProjectName);
        myProject.productLines.push(new cProductLine(ProducLineName));

        let myModels: cModel[] = [];
        myProject.productLines[0].domainEngineering = new cDomainEngineering(myModels);
        myProject.productLines[0].domainEngineering?.models?.push(
            new cModel("Model A")
        );

        myProject.productLines[0].applicationEngineering = new cApplicationEngineering(myModels);
        myProject.productLines[0].applicationEngineering?.models?.push(
            new cModel("Model B")
        );
        return myProject;
    }

    saveProject(myProject: cMyProject): void {
        // Save data to sessionStorage
        sessionStorage.setItem("myProject", JSON.stringify(myProject));
    }

    deleteProject() {
        // Remove saved data from sessionStorage
        sessionStorage.removeItem("myProject");

        // Remove all saved data from sessionStorage
        sessionStorage.clear();
    }
}