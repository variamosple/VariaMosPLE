import { Project } from "../../../Domain/ProductLineEngineering/Entities/Project";

export class ProjectEventArg {
  public target: any;
  public project: Project;

  constructor(target: any, project: Project) {
    this.target = target;
    this.project = project;
  }
}
