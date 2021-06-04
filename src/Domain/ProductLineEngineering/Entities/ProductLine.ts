import { ApplicationEngineering } from "./ApplicationEngineering";
import { DomainEngineering } from "./DomainEngineering";

export class ProductLine {
  id: string;
  name: string;
  domainEngineering: DomainEngineering = new DomainEngineering();
  applicationEngineering: ApplicationEngineering = new ApplicationEngineering();

  constructor(
    id: string,
    name: string,
    domainEngineering: DomainEngineering = new DomainEngineering(),
    applicationEngineering: ApplicationEngineering = new ApplicationEngineering()
  ) {
    this.id = id;
    this.name = name;
    this.domainEngineering = domainEngineering;
    this.applicationEngineering = applicationEngineering;
  }
}
