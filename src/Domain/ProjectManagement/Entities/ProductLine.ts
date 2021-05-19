import { ApplicationEngineering } from "./ApplicationEngineering";
import { DomainEngineering } from "./DomainEngineering";

export class ProductLine {
  productLineName: string;
  domainEngineering?: DomainEngineering;
  applicationEngineering?: ApplicationEngineering;

  constructor(
    productLineName: string,
    domainEngineering?: DomainEngineering,
    applicationEngineering?: ApplicationEngineering
  ) {
    this.productLineName = productLineName;
    this.domainEngineering = domainEngineering;
    this.applicationEngineering = applicationEngineering;
  }
}
