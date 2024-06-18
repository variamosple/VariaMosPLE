import { Project } from "./Project";

export class ConfigurationInformation {
  project_json: Project;
  id_feature_model: string;
  config_name: string;

  constructor(id_feature_model: string, config_name: string, project_json: Project) {
    this.id_feature_model = id_feature_model;
    this.config_name = config_name;
    this.project_json = project_json;
  }
}
