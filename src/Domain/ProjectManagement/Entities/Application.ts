import { Adaptation } from "./Adaptation";
import { Model } from "../../LanguageManagement/Entities/Model";

export class Application {
    applicationName: string;
    models: Model[] = [];
    adaptations: Adaptation[] = [];
  
    constructor(
      applicationName: string,
      models: Model[] = [],
      adaptations: Adaptation[] = []
    ) {
      this.applicationName = applicationName;
      this.models = models;
      this.adaptations = adaptations;
    }
  }
  