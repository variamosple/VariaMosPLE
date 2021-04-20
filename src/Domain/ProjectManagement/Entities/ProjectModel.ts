// export * from "../../../UI/ProjectManagement/ProjectManagement";

export class cMyProject {
  projectName: string = "My Project";
  projectEnable: boolean = false;
  productLines: cProductLine[]= [];

  constructor(projectName: string) {
    this.projectName = projectName;
  }
}

export class cProductLine {
  productLineName: string;
  domainEngineering?: cDomainEngineering;
  applicationEngineering?: cApplicationEngineering;

  constructor(
    productLineName: string,
    domainEngineering?: cDomainEngineering,
    applicationEngineering?: cApplicationEngineering
  ) {
    this.productLineName = productLineName;
    this.domainEngineering = domainEngineering;
    this.applicationEngineering = applicationEngineering;
  }
}

export class cDomainEngineering {
  models?: cModel[] = [];
  languagesAllowed?: string[] = [];
  constructor(models?: cModel[], languagesAllowed?: string[]) {
    this.models = models;
    this.languagesAllowed = languagesAllowed;
  }
}

export class cApplicationEngineering {
  models?: cModel[] = [];
  languagesAllowed?: string[] = [];
  applications?: cApplication[] = [];

  constructor(
    models?: cModel[],
    languagesAllowed?: string[],
    applications?: cApplication[]
  ) {
    this.models = models;
    this.languagesAllowed = languagesAllowed;
    this.applications = applications;
  }
}

export class cApplication {
  applicationName: string;
  models?: cModel[];
  adaptations?: cAdaptation[];

  constructor(
    applicationName: string,
    models?: cModel[],
    adaptations?: cAdaptation[]
  ) {
    this.applicationName = applicationName;
    this.models = models;
    this.adaptations = adaptations;
  }
}

export class cAdaptation {
  adaptationName: string;
  models?: cModel[];
  constructor(adaptationName: string, models?: cModel[]) {
    this.adaptationName = adaptationName;
    this.models = models;
  }
}

export class cModel {
  modelName: string;
  modelType?: eModelType;
  elements?: cElement[];
  modelTypeEngineering?: eTypeEngineering;

  constructor(
    modelName: string,
    modelType?: eModelType,
    elements?: cElement[],
    modelTypeEngineering?: eTypeEngineering
  ) {
    this.modelName = modelName;
    this.modelType = modelType;
    this.elements = elements;
    this.modelTypeEngineering = modelTypeEngineering;
  }
}

export class cElement {
  elementName: string;
  properties: cPropertie[];
  constructor(elementName: string, properties: cPropertie[]) {
    this.elementName = elementName;
    this.properties = properties;
  }
}

class cPropertie {
  propertieName: string;
  constructor(propertieName: string) {
    this.propertieName = propertieName;
  }
}

enum eTypeEngineering {
  domainEngineering,
  applicationEngineering,
}

//Generar clase y/o generar parametro cómo string y traer tipo de la base de datos. LanguageModelTypeName
enum eModelType {
  architecture,
  feature,
  iStar,
}
