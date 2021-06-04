import { Adaptation } from "./Adaptation";
import { Model } from "./Model";

export class Application {
  id: string;
  name: string;
  models: Model[] = [];
  adaptations: Adaptation[] = [];

  constructor(
    id: string,
    name: string,
    models: Model[] = [],
    adaptations: Adaptation[] = []
  ) {
    this.id = id;
    this.name = name;
    this.models = models;
    this.adaptations = adaptations;
  }
}
