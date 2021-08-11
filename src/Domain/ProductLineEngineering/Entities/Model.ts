import { Relationship } from "./Relationship";
import { Element } from "./Element";

export class Model {
  id: string;
  name: string;
  type?: string;
  elements: Element[] = [];
  relationships: Relationship[] = [];
  typeEngineering?: string;

  constructor(
    id: string,
    name: string,
    type?: string,
    elements: Element[] = [],
    relationships: Relationship[] = [],
    typeEngineering?: string
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.elements = elements;
    this.relationships = relationships;
    this.typeEngineering = typeEngineering;
  }
}
