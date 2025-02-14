import { ApplicationEngineering } from "./ApplicationEngineering";
import { DomainEngineering } from "./DomainEngineering";
import { ScopeSPL } from "./ScopeSPL";

export class ProductLine {
  id: string;
  name: string;
  type: string; //System or Software
  domain: string; //Medical, Transportation, etc.
  scope: ScopeSPL = new ScopeSPL();
  domainEngineering: DomainEngineering = new DomainEngineering();
  applicationEngineering: ApplicationEngineering = new ApplicationEngineering();

  constructor(
    id: string,
    name: string,
    type: string, //System or Software
    domain: string, //Medical, Transportation, etc.
    domainEngineering: DomainEngineering = new DomainEngineering(),
    applicationEngineering: ApplicationEngineering = new ApplicationEngineering(),
    scope: ScopeSPL = new ScopeSPL()
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
