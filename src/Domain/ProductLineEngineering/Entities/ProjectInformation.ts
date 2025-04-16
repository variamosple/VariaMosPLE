import { Project } from "./Project";

export class ProjectInformation {
  id: string;
  owner_id: string;
  name: string; 
  project: Project; 
  template: boolean; 
  description: string;
  source: string;
  author: string;
  date: Date;
  is_collaborative: boolean

  constructor(id: string, owner_id: string, name: string, project: Project, template: boolean, description: string, source: string, author: string, date: Date, is_collaborative: boolean) {
    this.id = id;
    this.owner_id = owner_id;
    this.name = name;
    this.project = project;
    this.template = template;
    this.description = description;
    this.source = source;
    this.author = author;
    this.date = date;
    this.is_collaborative = is_collaborative;
  }
}
