export class Model {
  name: string;
  type?: languageType;
  elements?: Element[];
  typeEngineering?: typeEngineering;
  diagram?: any;

  constructor(
    name: string,
    type?: languageType,
    elements: Element[] = [],
    typeEngineering?: typeEngineering,
    diagram?: any
  ) {
    this.name = name;
    this.type = type;
    this.elements = elements;
    this.typeEngineering = typeEngineering;
    this.diagram = diagram;
  }
}

//Generar clase y/o generar parametro cómo string y traer tipo de la base de datos. LanguageModelTypeName
enum languageType {
  architecture,
  feature,
  iStar,
}

enum typeEngineering {
  domainEngineering,
  applicationEngineering,
}
