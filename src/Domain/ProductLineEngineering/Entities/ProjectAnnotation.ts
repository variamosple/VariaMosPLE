export class ProjectAnnotation {
  id?: string;

  projectId: string;
  modelId: string;

  userId?: string;

  annotation: any;

  isResolved: boolean;

  createdAt?: Date;
  updatedAt?: Date;

  constructor(
    projectId: string,
    modelId: string,
    annotation: any
  ) {
    this.projectId = projectId;
    this.modelId = modelId;
    this.annotation = annotation;
    this.isResolved = false;
  }
}