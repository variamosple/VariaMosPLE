// Patch.ts — contrato flexible para el pipeline LLM → sanitize → bind → apply

export type PatchEnvelope = { ops: PatchOp[] };
export type PatchProperty = { name: string; value: string };

// Referencias a elementos: por id o por nombre (antes del bind a ids)
export type ElementRef = { id?: string; name?: string };

// Selector de relación: por id directo o por (tipo + extremos)
export type RelationshipSelector = {
  id?: string;
  type?: string;    // alias habitual
  relType?: string; // algunos generadores usan 'relType'
  source?: ElementRef;
  target?: ElementRef;
};

// === Operaciones ===

export type RenameElementOp = {
  op: "renameElement";
  selector: ElementRef;
  newName: string;
};

export type SetPropOp = {
  op: "setProp";
  on: "element" | "relationship";
  selector: ElementRef | RelationshipSelector;
  prop: string;
  value: string | number | boolean | null;
};

export type DeletePropOp = {
  op: "deleteProp";
  on: "element" | "relationship";
  selector: ElementRef | RelationshipSelector;
  prop: string;
};

export type CreateElementOp = {
  op: "createElement";
  type: string;
  name: string; // tu pipeline siempre lo usa; si prefieres, puedes volverlo opcional
  parentId?: string | null;
  properties?: PatchProperty[];
  geometry?: { x?: number; y?: number; width?: number; height?: number };
};

export type DeleteElementOp = {
  op: "deleteElement";
  selector: ElementRef;
};

export type ConnectOp = {
  op: "connect";
  type?: string; // puede inferirse durante la sanitización
  source: ElementRef;
  target: ElementRef;
  min?: number;
  max?: number;
  properties?: PatchProperty[];
};

export type DeleteRelationshipOp = {
  op: "deleteRelationship";
  selector: RelationshipSelector;
};

// NUEVO: para cambios de tipo/posición/tamaño/parent del elemento
export type UpdateElementOp = {
  op: "updateElement";
  selector: ElementRef;
  changes: Partial<{
    type: string;
    x: number; y: number; width: number; height: number;
    parentId: string | null;
  }>;
};

// Unión completa
export type PatchOp =
  | RenameElementOp
  | SetPropOp
  | DeletePropOp
  | CreateElementOp
  | DeleteElementOp
  | ConnectOp
  | DeleteRelationshipOp
  | UpdateElementOp;
