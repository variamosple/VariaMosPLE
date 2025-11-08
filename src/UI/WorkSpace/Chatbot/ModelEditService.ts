import { PatchEnvelope, PatchOp } from "./Patch";
import { Model } from "../../../Domain/ProductLineEngineering/Entities/Model";
import { Property } from "../../../Domain/ProductLineEngineering/Entities/Property";
import ProjectService from "../../../Application/Project/ProjectService";

type SnapProp = { name: string; value: any };
type SnapElement = {
  id: string;
  name: string;
  type: string;
  parentId?: string | null;
  properties: SnapProp[];
  x?: number; y?: number; width?: number; height?: number;
};
type SnapRelationship = {
  id: string;
  name: string;
  type: string;
  sourceId: string;
  targetId: string;
  properties: SnapProp[];
};
export type ModelSnapshot = {
  id: string; name: string; type: string;
  elements: SnapElement[];
  relationships: SnapRelationship[];
};

// ---------- Snapshot reducido (ids, name, type, props, relaciones)
export function buildSnapshot(model: Model): ModelSnapshot {
  return {
    id: model.id,
    name: model.name,
    type: model.type,
    elements: model.elements.map((el: any) => ({
      id: el.id,
      name: el.name,
      type: el.type,
      parentId: el.parentId ?? null,
      properties: (el.properties ?? []).map((p: any) => ({ name: p.name, value: p.value })),
      x: el.x, y: el.y, width: el.width, height: el.height,
    })),
    relationships: model.relationships.map((r: any) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      sourceId: r.sourceId,
      targetId: r.targetId,
      properties: (r.properties ?? []).map((p: any) => ({ name: p.name, value: p.value })),
    })),
  };
}

// ---------- Helpers props
function upsertProp(list: any[], name: string, value: any) {
  const found = list.find((p: any) => p.name === name);
  if (found) { found.value = value; }
  else { list.push(new Property(name, value, "string", "", "", "", false, true, "", "", "", "", "", "", "")); }
}
function deleteProp(list: any[], name: string) {
  const idx = list.findIndex((p: any) => p.name === name);
  if (idx >= 0) list.splice(idx, 1);
}

// ---------- Crear elemento (intenta usar ProjectService si lo provee)
function createElement(
  ps: ProjectService, model: Model,
  type: string, name?: string, parentId?: string | null,
  properties?: Array<{ name: string; value: any }>,
  geometry?: { x?: number; y?: number; width?: number; height?: number }
) {
  // Si ProjectService expone createElement, úsalo:
  const anyPs = ps as any;
  if (typeof anyPs.createElement === "function") {
    const el = anyPs.createElement(model, type, name ?? type, properties ?? []);
    if (parentId) el.parentId = parentId;
    if (geometry) {
      el.x = geometry.x ?? el.x; el.y = geometry.y ?? el.y;
      el.width = geometry.width ?? el.width; el.height = geometry.height ?? el.height;
    }
    return el;
  }

  // Fallback: insertar a mano
  const id = "el_" + Math.random().toString(36).slice(2, 10);
  const el: any = {
    id, type, name: name ?? type, parentId: parentId ?? null,
    x: geometry?.x ?? 40, y: geometry?.y ?? 40, width: geometry?.width ?? 120, height: geometry?.height ?? 60,
    properties: (properties ?? []).map(p => new Property(p.name, p.value, "string", "", "", "", false, true, "", "", "", "", "", "", ""))
  };
  (model.elements as any[]).push(el);
  return el;
}

// ---------- Aplicador de patch
export function applyPatch(ps: ProjectService, model: Model, envelope: PatchEnvelope) {
  const touched = { el: new Set<string>(), rel: new Set<string>() };

  for (const op of envelope.ops) {
    switch (op.op) {
      case "renameElement": {
        const el = ps.findModelElementById(model, op.selector.id);
        if (el) { el.name = op.newName; touched.el.add(el.id); }
        break;
      }
      case "setProp": {
        if (op.on === "element") {
          const el = ps.findModelElementById(model, op.selector.id);
          if (el) { upsertProp(el.properties, op.prop, op.value); touched.el.add(el.id); }
        } else {
          const r = ps.findModelRelationshipById(model, op.selector.id);
          if (r) { upsertProp(r.properties, op.prop, op.value); touched.rel.add(r.id); }
        }
        break;
      }
      case "deleteProp": {
        if (op.on === "element") {
          const el = ps.findModelElementById(model, op.selector.id);
          if (el) { deleteProp(el.properties, op.prop); touched.el.add(el.id); }
        } else {
          const r = ps.findModelRelationshipById(model, op.selector.id);
          if (r) { deleteProp(r.properties, op.prop); touched.rel.add(r.id); }
        }
        break;
      }
      case "createElement": {
        const el = createElement(ps, model, op.type, op.name, op.parentId ?? null, op.properties, op.geometry);
        touched.el.add(el.id);
        break;
      }
      case "deleteElement": {
        ps.removeModelElementById(model, op.selector.id);
        break;
      }
      case "connect": {
        // Nota: min/max y properties se usan si tu lenguaje los ocupa
        const rel = ps.createRelationship(
          model,
          op.type,
          op.type,
          op.source.id,
          op.target.id,
          [],
          op.min ?? 0,
          op.max ?? 1,
          (op.properties ?? []).map(p => new Property(p.name, p.value, "string", "", "", "", false, true, "", "", "", "", "", "", ""))
        );
        touched.rel.add(rel.id);
        break;
      }
      case "deleteRelationship": {
        ps.removeModelRelationshipById(model, op.selector.id);
        break;
      }
    }
  }

  // 🔔 Una sola notificación para refrescar MxGEditor
  const anyTouched = [...touched.el, ...touched.rel];
  if (anyTouched.length > 0) {
    const anyId = anyTouched[0];
    // Busca cualquiera para usar en raiseEventUpdatedElement
    const el = ps.findModelElementById(model, anyId);
    const r = el ? null : ps.findModelRelationshipById(model, anyId);
    ps.raiseEventUpdatedElement(model, el ?? r);
  } else {
    // fallback: recarga por proyecto
    if ((ps as any).raiseEventUpdateProject) {
      (ps as any).raiseEventUpdateProject({ project: ps.project, modelSelectedId: model.id });
    }
  }
}

// ---------- Prompt para el LLM (modo Editar)
export function buildEditPrompt({ snapshot, userGoal, patchSchema }: {
  snapshot: ModelSnapshot; userGoal: string; patchSchema: string;
}) {
  return `
You are an assistant that edits a software model using a JSON Patch schema (NOT RFC6902). 
Return ONLY valid JSON matching this TypeScript type: { "ops": PatchOp[] }.

PatchOp types:
${patchSchema}

Current model snapshot (ids, name, type, properties, relationships):
${JSON.stringify(snapshot, null, 2)}

User request (edit this model, preserving everything else):
${userGoal}

Return only JSON (no prose).
  `.trim();
}

// ---------- Prompt para el LLM (modo Crear)
export function buildCreatePrompt({ languageName, userGoal, patchSchema }: {
  languageName: string; userGoal: string; patchSchema: string;
}) {
  return `
You will create a NEW model in "${languageName}" using JSON Patch ops that add elements and relationships.
Return ONLY valid JSON matching: { "ops": PatchOp[] }.

PatchOp types:
${patchSchema}

Goal (build a minimal valid model for this request):
${userGoal}

Constraints:
- Use createElement and connect ops to scaffold the model.
- Provide sensible default properties where needed.
- Prefer small, consistent models.

Return only JSON.
  `.trim();
}

// ---------- Texto del esquema (para meterlo en el prompt)
export const PATCH_SCHEMA_TEXT = `
type PatchOp =
  | { op: "renameElement"; selector: { id: string }; newName: string }
  | { op: "setProp"; on: "element"|"relationship"; selector: { id: string }; prop: string; value: string|number|boolean|null }
  | { op: "deleteProp"; on: "element"|"relationship"; selector: { id: string }; prop: string }
  | { op: "createElement"; type: string; name?: string; parentId?: string|null; properties?: {name:string;value:string}[]; geometry?: {x?:number;y?:number;width?:number;height?:number} }
  | { op: "deleteElement"; selector: { id: string } }
  | { op: "connect"; type: string; source: { id: string }; target: { id: string }; min?: number; max?: number; properties?: {name:string;value:string}[] }
  | { op: "deleteRelationship"; selector: { id: string } };
`.trim();
