export class Model {
  name: string;
  type?: string;
  elements: Element[] = [];
  typeEngineering?: string;

  constructor(
    name: string,
    type?: string,
    elements: Element[] = [],
    typeEngineering?: string,
  ) {
    this.name = name;
    this.type = type;
    this.elements = elements;
    this.typeEngineering = typeEngineering;
  }
}
