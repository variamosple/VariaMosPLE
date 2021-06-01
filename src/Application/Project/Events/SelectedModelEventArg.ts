import { Model } from "../../../Domain/ProductLineEngineering/Entities/Model";

export class SelectedModelEventArg {
    public target: any;
    public model: Model;
  
    constructor(target: any, model: Model) {
      this.target = target;
      this.model = model;
    }
  }