import { Model } from "../../LanguageManagement/Entities/Model";

export class Adaptation {
    adaptationName: string;
    models: Model[] = [];
    constructor(adaptationName: string, models: Model[] = []) {
      this.adaptationName = adaptationName;
      this.models = models;
    }
  }