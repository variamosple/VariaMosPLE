import { Project } from "./Project";

export class ProjectInformation {
  id: string;
  name: string; 
  project: Project; 
  template: boolean; 

  constructor(id: string, name: string, project: Project, template: boolean) {
    this.id = id;
    this.name = name;
    this.project = project;
    this.template = template;
  }
}
