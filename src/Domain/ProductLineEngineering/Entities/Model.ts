import { Relationship } from "./Relationship";
import { Element } from "./Element";
import { SourceModelElement } from "./SourceModelElement";

export class Model {
  id: string;
  name: string;
  type: string;
  languageId: string;
  inconsistent: boolean;
  consistencyError: string;
  elements: Element[] = [];
  relationships: Relationship[] = [];
  typeEngineering?: string;
  constraints?: string;
  sourceModelIds: string[] = [];
  description?: string;
  author?: string;
  source?: string;
  constructor(
    id: string,
    name: string,
    type: string, 
    languageId: string,
    description: string = "",
    author: string = "", 
    source: string = "",
    elements: Element[] = [],
    relationships: Relationship[] = [],
    typeEngineering?: string,
    constraints: string = ""
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.languageId=languageId;
    this.inconsistent = false;
    this.consistencyError = null;
    this.elements = elements;
    this.relationships = relationships;
    this.typeEngineering = typeEngineering;
    this.constraints = constraints;
    this.description=description;
    this.author=author;
    this.source=source;
  }
}