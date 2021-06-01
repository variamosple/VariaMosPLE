import { Application } from "../../../Domain/ProductLineEngineering/Entities/Application";
import { Project } from "../../../Domain/ProductLineEngineering/Entities/Project";

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
  