import { Config } from "../../../Config";

export function getServiceUrl(...services) {  
  const service = services.join("/")
  return [Config.SERVICES.urlBackEndLanguage, service].join("/");
}
