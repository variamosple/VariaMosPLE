import { Adaptation } from "./Adaptation";
import { Model } from "./Model";

export class Application {
  id: string;
  applicationName: string;
  models: Model[] = [];
  adaptations: Adaptation[] = [];

  constructor(
    id: string,
    applicationName: string,
    models: Model[] = [],
    adaptations: Adaptation[] = []
  ) {
    this.id = id;
    this.applicationName = applicationName;
    this.models = models;
    this.adaptations = adaptations;
  }
}
