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
    elements: cElement[]=[],
    modelTypeEngineering?: eTypeEngineering
  ) {
    this.modelName = modelName;
    this.modelType = modelType;
    this.elements = elements;
    this.modelTypeEngineering = modelTypeEngineering;
  }
}

export class cElement {
  id: string;
  type: string;
  name: string;
  properties: cProperty[];
  constructor(name: string, type: string, properties: cProperty[] = []) {
    this.id= generateId();
    this.type=type;
    this.name = name;
    this.properties = properties;
  }
}

export class cProperty {
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
 
function generateId(): string {
  var dt = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c=='x' ? r :(r&0x3|0x8)).toString(16);
  });
  return uuid;
}

