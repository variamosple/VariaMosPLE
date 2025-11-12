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

  // Nuevo
  owner_id: string;  
  is_collaborative: boolean
  role?: string;
  currentUserRole?: string;
  collaborators?: Array<{ id: string; name: string; email: string; role: string }>;

  constructor(id: string, owner_id: string, name: string, project: Project, template: boolean, description: string, source: string, author: string, date: Date, is_collaborative?: boolean, role?: string, collaborators?: Array<{ id: string; name: string; email: string; role: string }>) {
    this.id = id;
    this.name = name;
    this.project = project;
    this.template = template;
    this.description = description;
    this.source = source;
    this.author = author;
    this.date = date;

    this.role = role;
    this.owner_id = owner_id;
    this.is_collaborative = is_collaborative;
    this.collaborators = collaborators;
  }
}
