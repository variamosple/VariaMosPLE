import { Project } from "./Project";

export class ProjectInformation {
  id: string;
  name: string; 
  project: Project; 
  template: boolean; 
  description: string;
  source: string;
  author: string;
  date: Date;

  constructor(id: string, name: string, project: Project, template: boolean, description: string, source: string, author: string, date: Date) {
    this.id = id;
    this.name = name;
    this.project = project;
    this.template = template;
    this.description = description;
    this.source = source;
    this.author = author;
    this.date = date;
  }
}
