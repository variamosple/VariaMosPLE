import { Relationship } from "./Relationship";
import { Element } from "./Element";

export class SourceModelElement {
  modelId: string;
  elementId: string; 
  constructor(
    modelId: string,
    elementId: string
  ) {
    this.modelId = modelId;
    this.elementId = elementId;
  }
}