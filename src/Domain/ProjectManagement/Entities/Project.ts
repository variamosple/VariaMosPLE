import { ProductLine } from "./ProductLine";


export class Project {
  projectName: string = "My Project";
  projectEnable: boolean = false;
  productLines: ProductLine[] = [];

  constructor(projectName: string) {
    this.projectName = projectName;
  }
}
