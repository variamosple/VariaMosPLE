import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";

type StructuredElement = {
  id: string;
  name: string;
  type: "RootFeature" | "Feature" | "Group" | "Constraint";
  properties: Array<{ id: string; name: string; value: any; type: string; display: boolean }>;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId: string | null;
};

type StructuredRelationship = {
  id: string;
  name: string;
  type: "RootFeature_Child" | "Feature_Child" | "Group_Feature";
  sourceId: string;
  targetId: string;
  min: number;
  max: number;
  points: any[];
  properties: Array<{ id: string; name: string; value: any; type: string; display: boolean }>;
};

type ParsedFeature = {
  element: StructuredElement;
  indent: number;
};

type ParsedGroup = {
  element?: StructuredElement;
  indent: number;
  kind: "mandatory" | "optional" | "or" | "alternative" | "cardinality";
  parent: StructuredElement;
};

const UVL_ELEMENT_TYPES = new Set(["RootFeature", "Feature", "Group", "Constraint"]);
const TYPE_KEYWORDS = new Set(["Boolean", "Integer", "Real", "String"]);

function stableId(prefix: string, value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}_${(hash >>> 0).toString(36)}`;
}

function property(ownerId: string, name: string, value: any) {
  return { id: stableId("prop", `${ownerId}:${name}`), name, value, type: "String", display: true };
}

function indentation(raw: string): number {
  return (raw.match(/^[ \t]*/)?.[0] ?? "").replace(/\t/g, "    ").length;
}

function splitFeatureDeclaration(declaration: string) {
  let rest = declaration.trim();
  let featureType = "Untyped";
  const typeMatch = rest.match(/^(Boolean|Integer|Real|String)\s+/);
  if (typeMatch) {
    featureType = typeMatch[1];
    rest = rest.slice(typeMatch[0].length);
  }

  const nameMatch = rest.match(/^("[^"]+"|[A-Za-z][A-Za-z0-9_#§%?\\'äüöß;]*)/);
  if (!nameMatch) return null;
  const rawName = nameMatch[1];
  const name = rawName.startsWith('"') ? rawName.slice(1, -1) : rawName;
  rest = rest.slice(rawName.length).trim();

  const cardinalityMatch = rest.match(/^cardinality\s+(\[[^\]]+\])/);
  const cardinality = cardinalityMatch?.[1] ?? "";
  if (cardinalityMatch) rest = rest.slice(cardinalityMatch[0].length).trim();
  const attributes = rest.startsWith("{") && rest.endsWith("}") ? rest : "";
  return { name, featureType, cardinality, attributes };
}

function makeElement(modelId: string, type: StructuredElement["type"], name: string, order: number, values: Record<string, any>) {
  const id = stableId("uvl", `${modelId}:${type}:${order}:${name}`);
  return {
    id,
    name,
    type,
    properties: [
      ...Object.entries(values).map(([key, value]) => property(id, key, value)),
      property(id, "UVLOrder", order),
    ],
    x: 40 + (order % 4) * 180,
    y: 40 + Math.floor(order / 4) * 90,
    width: type === "Constraint" ? 180 : 130,
    height: 50,
    parentId: null,
  } as StructuredElement;
}

function makeRelationship(modelId: string, type: StructuredRelationship["type"], source: StructuredElement, target: StructuredElement, order: number, relation?: string) {
  const id = stableId("uvlrel", `${modelId}:${type}:${source.id}:${target.id}`);
  return {
    id,
    name: type,
    type,
    sourceId: source.id,
    targetId: target.id,
    min: 0,
    max: 9999999,
    points: [],
    properties: relation ? [property(id, "Relation", relation)] : [],
  } as StructuredRelationship;
}

function isSectionLine(trimmed: string): boolean {
  return /^(include|namespace|imports|features|constraints)\b/.test(trimmed);
}

function stripBlockComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\r\n]/g, " "));
}

export function parseUvlForChatbot(source: string, modelId: string) {
  const elements: StructuredElement[] = [];
  const relationships: StructuredRelationship[] = [];
  const featureStack: ParsedFeature[] = [];
  const groupStack: ParsedGroup[] = [];
  const lines = stripBlockComments(source).split(/\r?\n/);
  let section = "";
  let order = 0;
  let rootCount = 0;

  lines.forEach((raw) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*")) return;
    if (isSectionLine(trimmed) && indentation(raw) === 0) {
      section = trimmed.split(/\s+/)[0];
      return;
    }

    if (section === "constraints") {
      const constraint = makeElement(modelId, "Constraint", `Constraint ${elements.filter((item) => item.type === "Constraint").length + 1}`, order++, {
        Expression: trimmed,
      });
      elements.push(constraint);
      return;
    }
    if (section !== "features") return;

    const indent = indentation(raw);
    const groupMatch = trimmed.match(/^(mandatory|optional|or|alternative)$/);
    const cardinalityGroupMatch = trimmed.match(/^(\[[0-9]+\.\.(?:[0-9]+|\*)\])$/);
    if (groupMatch || cardinalityGroupMatch) {
      while (featureStack.length && featureStack[featureStack.length - 1].indent >= indent) featureStack.pop();
      while (groupStack.length && groupStack[groupStack.length - 1].indent >= indent) groupStack.pop();
      const parent = featureStack[featureStack.length - 1]?.element;
      if (!parent) return;
      const kind = groupMatch ? groupMatch[1] as ParsedGroup["kind"] : "cardinality";
      if (kind === "mandatory" || kind === "optional") {
        groupStack.push({ indent, kind, parent });
      } else {
        const groupName = `${parent.name} ${kind} group`;
        const group = makeElement(modelId, "Group", groupName, order++, {
          GroupType: kind === "or" ? "Or" : kind === "alternative" ? "Alternative" : "Cardinality",
          Cardinality: cardinalityGroupMatch?.[1] ?? (kind === "or" ? "[1..*]" : "[1..1]"),
        });
        elements.push(group);
        relationships.push(makeRelationship(modelId, parent.type === "RootFeature" ? "RootFeature_Child" : "Feature_Child", parent, group, order, "Optional"));
        groupStack.push({ indent, kind, parent, element: group });
      }
      return;
    }

    const parsed = splitFeatureDeclaration(trimmed);
    if (!parsed) return;
    while (featureStack.length && featureStack[featureStack.length - 1].indent >= indent) featureStack.pop();
    while (groupStack.length && groupStack[groupStack.length - 1].indent >= indent) groupStack.pop();
    const activeGroup = groupStack[groupStack.length - 1];
    const elementType: StructuredElement["type"] = rootCount === 0 ? "RootFeature" : "Feature";
    const feature = makeElement(modelId, elementType, parsed.name, order++, {
      FeatureType: parsed.featureType,
      Cardinality: parsed.cardinality,
      Attributes: parsed.attributes,
    });
    elements.push(feature);
    if (elementType === "RootFeature") {
      rootCount++;
    } else if (activeGroup?.element) {
      relationships.push(makeRelationship(modelId, "Group_Feature", activeGroup.element, feature, order));
    } else {
      const parent = activeGroup?.parent ?? featureStack[featureStack.length - 1]?.element;
      if (parent) {
        const relation = activeGroup?.kind === "mandatory" ? "Mandatory" : "Optional";
        relationships.push(makeRelationship(modelId, parent.type === "RootFeature" ? "RootFeature_Child" : "Feature_Child", parent, feature, order, relation));
      }
    }
    featureStack.push({ indent, element: feature });
  });

  return { elements, relationships, valid: rootCount === 1 };
}

function getProperty(element: any, name: string, fallback: any = "") {
  return element?.properties?.find((item: any) => item?.name === name)?.value ?? fallback;
}

function quoteReference(name: string): string {
  return /^[A-Za-z][A-Za-z0-9_#§%?\\'äüöß;]*$/.test(name) ? name : `"${String(name).replace(/"/g, "")}"`;
}

function preservedPreamble(source: string): string[] {
  const lines = source.split(/\r?\n/);
  const featureIndex = lines.findIndex((line) => /^features\b/.test(line.trim()) && indentation(line) === 0);
  const preamble = (featureIndex >= 0 ? lines.slice(0, featureIndex) : lines.filter((line) => /^(namespace|include|imports)\b/.test(line.trim())))
    .filter((line, index, all) => line.trim() || (index > 0 && all[index - 1].trim()));
  return preamble.length ? preamble : ["namespace generated"];
}

function materializeParentRelationships(model: Model, elements: any[]): void {
  const relationships = model.relationships as any[];
  const byId = new Map(elements.map((element) => [String(element.id), element]));
  const incomingTargets = new Set(
    relationships
      .filter((relationship) => byId.has(String(relationship.sourceId)) && byId.has(String(relationship.targetId)))
      .map((relationship) => String(relationship.targetId))
  );

  elements.forEach((child, index) => {
    const parentId = child?.parentId == null ? "" : String(child.parentId);
    if (!parentId) return;

    // parentId is an auxiliary hint emitted by some chatbot PATCHes. Once a
    // real relationship exists it must be cleared, otherwise deleting that
    // relationship later would recreate it on the next serialization.
    if (incomingTargets.has(String(child.id))) {
      child.parentId = null;
      return;
    }

    const parent = byId.get(parentId);
    if (!parent || parent === child) return;

    let relationshipType: StructuredRelationship["type"] | null = null;
    let relation: string | undefined;
    if (parent.type === "Group" && child.type === "Feature") {
      relationshipType = "Group_Feature";
    } else if (
      (parent.type === "RootFeature" || parent.type === "Feature") &&
      (child.type === "Feature" || child.type === "Group")
    ) {
      relationshipType = parent.type === "RootFeature" ? "RootFeature_Child" : "Feature_Child";
      relation = "Optional";
    }
    if (!relationshipType) return;

    relationships.push(
      makeRelationship(
        String(model.id),
        relationshipType,
        parent as StructuredElement,
        child as StructuredElement,
        index,
        relation
      )
    );
    incomingTargets.add(String(child.id));
    child.parentId = null;
  });
}

export function serializeChatbotModelToUvl(model: Model, previousSource = ""): string | null {
  const elements = (model.elements as any[]).filter((element) => UVL_ELEMENT_TYPES.has(element?.type));
  const root = elements.find((element) => element.type === "RootFeature");
  if (!root) return null;
  materializeParentRelationships(model, elements);
  const byId = new Map(elements.map((element) => [String(element.id), element]));
  const outgoing = new Map<string, any[]>();
  (model.relationships as any[]).forEach((relationship) => {
    if (!byId.has(String(relationship.sourceId)) || !byId.has(String(relationship.targetId))) return;
    const list = outgoing.get(String(relationship.sourceId)) ?? [];
    list.push(relationship);
    outgoing.set(String(relationship.sourceId), list);
  });
  const sortByOrder = (left: any, right: any) => Number(getProperty(byId.get(String(left.targetId)), "UVLOrder", 999999)) - Number(getProperty(byId.get(String(right.targetId)), "UVLOrder", 999999));
  outgoing.forEach((list) => list.sort(sortByOrder));

  const declaration = (element: any) => {
    const featureType = String(getProperty(element, "FeatureType", "Untyped"));
    const cardinality = String(getProperty(element, "Cardinality", ""));
    const attributes = String(getProperty(element, "Attributes", ""));
    return [TYPE_KEYWORDS.has(featureType) ? featureType : "", quoteReference(element.name), cardinality ? `cardinality ${cardinality}` : "", attributes]
      .filter(Boolean).join(" ");
  };

  const renderFeature = (element: any, depth: number, ancestry: Set<string>): string[] => {
    if (ancestry.has(String(element.id))) return [];
    const nextAncestry = new Set(ancestry).add(String(element.id));
    const lines = [`${"    ".repeat(depth)}${declaration(element)}`];
    const children = outgoing.get(String(element.id)) ?? [];
    const directMandatory = children.filter((relationship) => byId.get(String(relationship.targetId))?.type === "Feature" && String(getProperty(relationship, "Relation", "Optional")).toLowerCase() === "mandatory");
    const directOptional = children.filter((relationship) => byId.get(String(relationship.targetId))?.type === "Feature" && !directMandatory.includes(relationship));
    const renderRelationGroup = (label: string, relations: any[]) => {
      if (!relations.length) return;
      lines.push(`${"    ".repeat(depth + 1)}${label}`);
      relations.forEach((relationship) => lines.push(...renderFeature(byId.get(String(relationship.targetId)), depth + 2, nextAncestry)));
    };
    renderRelationGroup("mandatory", directMandatory);
    renderRelationGroup("optional", directOptional);
    children.filter((relationship) => byId.get(String(relationship.targetId))?.type === "Group").forEach((relationship) => {
      const group = byId.get(String(relationship.targetId));
      const groupType = String(getProperty(group, "GroupType", "Or"));
      const groupLabel = groupType === "Alternative" ? "alternative" : groupType === "Cardinality" ? String(getProperty(group, "Cardinality", "[1..*]")) : "or";
      lines.push(`${"    ".repeat(depth + 1)}${groupLabel}`);
      (outgoing.get(String(group.id)) ?? []).forEach((memberRelationship) => {
        const member = byId.get(String(memberRelationship.targetId));
        if (member?.type === "Feature") lines.push(...renderFeature(member, depth + 2, nextAncestry));
      });
    });
    return lines;
  };

  const constraints = elements
    .filter((element) => element.type === "Constraint")
    .sort((a, b) => Number(getProperty(a, "UVLOrder", 999999)) - Number(getProperty(b, "UVLOrder", 999999)))
    .map((element) => String(getProperty(element, "Expression", "")).trim())
    .filter(Boolean);
  return [
    ...preservedPreamble(previousSource),
    "",
    "features",
    ...renderFeature(root, 1, new Set()),
    ...(constraints.length ? ["", "constraints", ...constraints.map((constraint) => `    ${constraint}`)] : []),
    "",
  ].join("\n");
}

export function syncUvlSourceToModel(model: Model, source: string): boolean {
  const parsed = parseUvlForChatbot(source, String(model.id));
  if (!parsed.valid) return false;
  model.elements = parsed.elements as any;
  model.relationships = parsed.relationships as any;
  (model as any).uvl = source;
  (model as any).__uvlStructured = true;
  return true;
}

export function isUvlStructuredModel(model: Model): boolean {
  return !!(model as any).__uvlStructured || (model.elements as any[]).some((element) => UVL_ELEMENT_TYPES.has(element?.type));
}

export function getUvlStructuredSignature(model: Model): string {
  const elementSignature = (model.elements as any[])
    .filter((element) => UVL_ELEMENT_TYPES.has(element?.type))
    .map((element) => [element.id, element.name, element.type, (element.properties ?? []).map((item: any) => [item.name, item.value])]);
  const relationshipSignature = (model.relationships as any[])
    .filter((relationship) => ["RootFeature_Child", "Feature_Child", "Group_Feature"].includes(relationship?.type))
    .map((relationship) => [relationship.id, relationship.type, relationship.sourceId, relationship.targetId, (relationship.properties ?? []).map((item: any) => [item.name, item.value])]);
  return JSON.stringify([elementSignature, relationshipSignature]);
}
