import { ProductLine } from "../../../Domain/ProductLineEngineering/Entities/ProductLine";
import { Project } from "../../../Domain/ProductLineEngineering/Entities/Project";


export class NewProductLineEventArg {
  public target: any;
  public project: Project;
  public productLine: ProductLine;

  constructor(target: any, project: Project, productLine: ProductLine) {
    this.target = target;
    this.project = project;
    this.productLine = productLine;
  }
}
