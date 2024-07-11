import { Project } from "./Project";

export class ConfigurationInformation {
  id: string;
  name: string;
  id_feature_model: string;
  config_name: string;
  project_json: Project;

  constructor(id: string,  config_name: string, id_feature_model: string, project_json: Project) {
    this.id = id;
    this.name = config_name;
    this.config_name = config_name; 
    this.id_feature_model = id_feature_model;
    this.project_json = project_json;
  }
}
