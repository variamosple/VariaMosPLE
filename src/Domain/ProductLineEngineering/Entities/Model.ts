export class Model {
  id: string;
  name: string;
  type?: string;
  elements: Element[] = [];
  typeEngineering?: string;

  constructor(
    id: string,
    name: string,
    type?: string,
    elements: Element[] = [],
    typeEngineering?: string,
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.elements = elements;
    this.typeEngineering = typeEngineering;
  }
}
