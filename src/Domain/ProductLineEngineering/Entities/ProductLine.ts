import { ApplicationEngineering } from "./ApplicationEngineering";
import { DomainEngineering } from "./DomainEngineering";

export class ProductLine {
  name: string;
  domainEngineering?: DomainEngineering;
  applicationEngineering?: ApplicationEngineering;

  constructor(
    name: string,
    domainEngineering?: DomainEngineering,
    applicationEngineering?: ApplicationEngineering
  ) {
    this.name = name;
    this.domainEngineering = domainEngineering;
    this.applicationEngineering = applicationEngineering;
  }
}
