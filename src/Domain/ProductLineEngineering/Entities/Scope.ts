import { Model } from "./Model";

export class Scope {
  models: Model[] = [];
  languagesAllowed: string[] = [];
  constructor(models: Model[] = [], languagesAllowed: string[] = []) {
    this.models = models;
    this.languagesAllowed = languagesAllowed;
  }
}
