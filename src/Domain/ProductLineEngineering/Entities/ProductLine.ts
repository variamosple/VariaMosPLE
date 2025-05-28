import { ApplicationEngineering } from "./ApplicationEngineering";
import { DomainEngineering } from "./DomainEngineering";
import { Scope } from "./Scope";

export class ProductLine {
  id: string;
  name: string;
  type: string; //System or Software
  domain: string; //Medical, Transportation, etc.
  scope: Scope = new Scope();
  domainEngineering: DomainEngineering = new DomainEngineering();
  applicationEngineering: ApplicationEngineering = new ApplicationEngineering();

  constructor(
    id: string,
    name: string,
    type: string, //System or Software
    domain: string, //Medical, Transportation, etc.
    domainEngineering: DomainEngineering = new DomainEngineering(),
    applicationEngineering: ApplicationEngineering = new ApplicationEngineering(),
    scope: Scope = new Scope()
  ) {
    this.id = id;
    this.name = name;
    this.type=type;
    this.domain=domain;
    this.domainEngineering = domainEngineering;
    this.scope = scope;
    this.applicationEngineering = applicationEngineering;
  }
}
