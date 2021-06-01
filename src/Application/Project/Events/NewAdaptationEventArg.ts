import { Adaptation } from "../../../Domain/ProductLineEngineering/Entities/Adaptation";
import { Project } from "../../../Domain/ProductLineEngineering/Entities/Project";

export class NewAdaptationEventArg {
    public target: any;
    public project: Project;
    public adaptation: Adaptation;
  
    constructor(target: any, project: Project, adaptation: Adaptation) {
      this.target = target;
      this.project = project;
      this.adaptation = adaptation;
    }
  }
  