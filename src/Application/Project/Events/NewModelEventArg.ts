import { Model } from "../../../Domain/ProjectManagement/Entities/Model";
import { Project } from "../../../Domain/ProjectManagement/Entities/Project";

export class NewModelEventArg {
    public target: any;
    public project: Project;
    public model: Model;
  
    constructor(target: any, project: Project, model: Model) {
      this.target = target;
      this.project = project;
      this.model = model;
    }
  }