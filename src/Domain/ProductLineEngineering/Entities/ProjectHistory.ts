export class ProjectHistory {
  id?: string;

  projectId?: string;
  modelId?: string;

  userId?: string;
  author?: string;

  actionType?: string;
  entityType?: string;

  entityId?: string;
  entityName?: string;

  oldValue?: any;
  newValue?: any;

  description?: string;
  createdAt?: Date;

  constructor(
    id?: string,
    projectId?: string,
    modelId?: string,
    userId?: string,
    author?: string,
    actionType?: string,
    entityType?: string,
    entityId?: string,
    entityName?: string,
    oldValue?: any,
    newValue?: any,
    description?: string,
    createdAt?: Date
  ) {
    this.id = id;
    this.projectId = projectId;
    this.modelId = modelId;
    this.userId = userId;
    this.author = author;
    this.actionType = actionType;
    this.entityType = entityType;
    this.entityId = entityId;
    this.entityName = entityName;
    this.oldValue = oldValue;
    this.newValue = newValue;
    this.description = description;
    this.createdAt = createdAt;
  }
}