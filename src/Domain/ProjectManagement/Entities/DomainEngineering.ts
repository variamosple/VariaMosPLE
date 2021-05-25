import { Model } from "../../LanguageManagement/Entities/Model";

export class DomainEngineering {
  models: Model[] = [];
  languagesAllowed: string[] = [];
  constructor(models: Model[] = [], languagesAllowed: string[] = []) {
    this.models = models;
    this.languagesAllowed = languagesAllowed;
  }
}
