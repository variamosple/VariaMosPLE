// Contrato que el LLM debe cumplir: { ops: PatchOp[] }
export type PatchEnvelope = { ops: PatchOp[] };

export type PatchOp =
  | { op: "renameElement"; selector: { id: string }; newName: string }
  | {
      op: "setProp";
      on: "element" | "relationship";
      selector: { id: string };
      prop: string;
      value: string | number | boolean | null;
    }
  | {
      op: "deleteProp";
      on: "element" | "relationship";
      selector: { id: string };
      prop: string;
    }
  | {
      op: "createElement";
      type: string;
      name?: string;
      parentId?: string | null;
      properties?: Array<{ name: string; value: string }>;
      geometry?: { x?: number; y?: number; width?: number; height?: number };
    }
  | { op: "deleteElement"; selector: { id: string } }
  | {
      op: "connect";
      type: string;
      source: { id: string };
      target: { id: string };
      min?: number;
      max?: number;
      properties?: Array<{ name: string; value: string }>;
    }
  | { op: "deleteRelationship"; selector: { id: string } };
