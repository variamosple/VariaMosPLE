export enum HistoryActionType {
  MODEL_CREATED = "MODEL_CREATED",
  MODEL_UPDATED = "MODEL_UPDATED",
  ITEM_CREATED = "ITEM_CREATED",
  ITEM_UPDATED = "ITEM_UPDATED",
  ITEM_DELETED = "ITEM_DELETED",
  MODEL_DELETED = "MODEL_DELETED",
}

export enum HistoryEntityType {
  MODEL = "model",
  ELEMENT = "element",
  RELATIONSHIP = "relationship",
  PRODUCT_LINE = "productLine",
  APPLICATION = "application",
  ADAPTATION = "adaptation",
}