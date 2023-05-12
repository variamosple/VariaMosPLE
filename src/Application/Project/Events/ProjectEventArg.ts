import { Project } from "../../../Domain/ProductLineEngineering/Entities/Project";

export class ProjectEventArg {
  public target: any;
  public project: Project;
  public modelSelectedId:string;

  constructor(target: any, project: Project, modelSelectedId:string) {
    this.target = target;
    this.project = project;
    this.modelSelectedId = modelSelectedId;
  }
}
