import { Model } from "./Model";

export class Adaptation {
  id: string;
  name: string;
  models: Model[] = [];
  constructor(id: string, name: string, models: Model[] = []) {
    this.id = id;
    this.name = name;
    this.models = models;
  }
}
