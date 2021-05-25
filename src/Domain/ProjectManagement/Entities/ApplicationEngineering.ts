import { Application } from "./Application";
import { Model } from "../../LanguageManagement/Entities/Model";

export class ApplicationEngineering {
    models: Model[] = [];
    languagesAllowed: string[] = [];
    applications: Application[] = [];
  
    constructor(
      models: Model[] = [],
      languagesAllowed: string[] = [],
      applications: Application[] = []
    ) {
      this.models = models;
      this.languagesAllowed = languagesAllowed;
      this.applications = applications;
    }
  }