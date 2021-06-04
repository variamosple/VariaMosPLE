import { Model } from "./Model";

export class Adaptation {
  id: string;
  adaptationName: string;
  models: Model[] = [];
  constructor(id: string, adaptationName: string, models: Model[] = []) {
    this.id = id;
    this.adaptationName = adaptationName;
    this.models = models;
  }
}
