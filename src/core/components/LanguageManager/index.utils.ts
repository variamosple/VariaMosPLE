import config from "../../../Infraestructure/config.json";
export function getServiceUrl(...services) {
  const service = services.join("/")
  return [config.urlBackEndLanguage, service].join("/");
}
