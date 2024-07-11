import { ProductLine } from "./ProductLine";

export class Project {
  id: string;
  name: string; 
  enable: boolean = false;
  productLines: ProductLine[] = [];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name; 
  }
}
