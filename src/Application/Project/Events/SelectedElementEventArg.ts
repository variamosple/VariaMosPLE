import { Model } from "../../../Domain/ProductLineEngineering/Entities/Model";
import { Element } from "../../../Domain/ProductLineEngineering/Entities/Element";
export class SelectedElementEventArg {
    public target: any;
    public model: Model|undefined;
    public element: Element|undefined;
  
    constructor(target: any, model: Model|undefined, element: Element|undefined) {
      this.target = target;
      this.model=model;
      this.element = element;
    }
  }