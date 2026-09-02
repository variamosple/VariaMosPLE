import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import {
  parseAndValidateUvl,
  uvlAttributesToJson,
  type UvlFeature,
  type UvlGroup,
  type UvlImport,
  type UvlParseResult,
} from "./uvlParser";
import {
  composeUvlDocument,
  uvlSubmodelSourcesToRecord,
  type UvlCompositionDiagnostic,
  type UvlSubmodelSources,
} from "./uvlComposition";
import {
  UVL_ELEMENT_TYPES as STRUCTURAL_UVL_ELEMENT_TYPES,
  getUvlProperty,
  materializeUvlParentRelationships,
  normalizeUvlStructuredModel,
  normalizeUvlCardinality,
  parseUvlCardinality,
  validateUvlStructuredModel,
  type UvlStructuralIssue,
  type UvlStructuralValidation,
} from "./uvlStructuralValidation";

export {
  getUvlProperty,
  materializeUvlParentRelationships,
  normalizeUvlStructuredModel,
  normalizeUvlCardinality,
  parseUvlCardinality,
  validateUvlStructuredModel,
};
export type { UvlStructuralIssue, UvlStructuralValidation } from "./uvlStructuralValidation";
export {
  parseAndValidateUvl,
  uvlAttributesToJson,
} from "./uvlParser";
export {
  composeUvlDocument,
  composeUvlSource,
  composeUvlSources,
  normalizeUvlSubmodelPath,
  resolveUvlImportSource,
  serializeUvlExpression,
  uvlSubmodelSourcesToRecord,
} from "./uvlComposition";
export type {
  UvlCompositionDiagnostic,
  UvlCompositionResult,
  UvlResolvedImport,
  UvlSubmodelSource,
  UvlSubmodelSources,
} from "./uvlComposition";
export type {
  UvlAttribute,
  UvlAttributeValue,
  UvlCardinality,
  UvlConstraintLine,
  UvlDiagnostic,
  UvlDocument,
  UvlExpression,
  UvlFeature,
  UvlGroup,
  UvlImport,
  UvlLanguageLevel,
  UvlParseResult,
  UvlReference,
  UvlSourceLocation,
} from "./uvlParser";

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

export type UvlSourceMetadata = {
  namespace?: string;
  includes: string[];
  imports: Array<{ namespace: string; alias?: string }>;
  resolvedImports?: Array<{ namespace: string; alias?: string; path?: string; missing: boolean }>;
};

const UVL_ELEMENT_TYPES = STRUCTURAL_UVL_ELEMENT_TYPES;
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
    min: type === "Group_Feature" ? 1 : 0,
    max: 9999999,
    points: [],
    properties: relation ? [property(id, "Relation", relation)] : [],
  } as StructuredRelationship;
}

function cardinalityText(cardinality: { min: number; max: number | "*" } | undefined): string {
  return cardinality ? `[${cardinality.min}..${cardinality.max}]` : "";
}

function sourceMetadata(result: UvlParseResult, resolvedImports?: UvlSourceMetadata["resolvedImports"]): UvlSourceMetadata {
  return {
    namespace: result.document.namespace?.name,
    includes: result.document.includes.map((level) => level.raw),
    imports: result.document.imports.map((item: UvlImport) => ({
      namespace: item.namespace.name,
      alias: item.alias?.name,
    })),
    ...(resolvedImports ? { resolvedImports } : {}),
  };
}

/**
 * Converts the parser AST into the graph shape consumed by the chatbot.  The
 * previous implementation reparsed lines and consequently lost typed
 * attributes, qualified references and nested group structure.  Keeping this
 * conversion on top of the AST makes text-to-model and validation share one
 * grammar and one set of semantics.
 */
export function parseUvlForChatbot(source: string, modelId: string, submodelSources?: UvlSubmodelSources) {
  const result = parseAndValidateUvl(source);
  const composition = composeUvlDocument(result.document, submodelSources, source);
  const diagnostics = [...result.diagnostics];
  const diagnosticKeys = new Set(diagnostics.map((item) => `${item.code}|${item.location?.line || 0}|${item.location?.column || 0}|${item.message}`));
  composition.diagnostics.forEach((item: UvlCompositionDiagnostic) => {
    const key = `${item.code}|${item.location?.line || 0}|${item.location?.column || 0}|${item.message}`;
    if (!diagnosticKeys.has(key)) {
      diagnostics.push(item);
      diagnosticKeys.add(key);
    }
  });
  const document = composition.document;
  const elements: StructuredElement[] = [];
  const relationships: StructuredRelationship[] = [];
  let order = 0;

  const appendFeature = (feature: UvlFeature, parent: StructuredElement | null, relation?: string, elementTypeOverride?: "RootFeature" | "Feature"): StructuredElement => {
    const elementType: StructuredElement["type"] = elementTypeOverride || (parent ? "Feature" : "RootFeature");
    const element = makeElement(modelId, elementType, feature.name, order++, {
      FeatureType: feature.featureType || "Untyped",
      Cardinality: cardinalityText(feature.cardinality),
      Attributes: feature.attributeText,
      AttributeValues: JSON.stringify(uvlAttributesToJson(feature.attributes)),
    });
    elements.push(element);
    if (parent) {
      const relationshipType = parent.type === "RootFeature" ? "RootFeature_Child" : "Feature_Child";
      relationships.push(makeRelationship(modelId, relationshipType, parent, element, order++, relation || "Optional"));
    }
    feature.groups.forEach((group) => appendGroup(group, element));
    return element;
  };

  const appendGroup = (group: UvlGroup, parent: StructuredElement): StructuredElement | null => {
    const isDirectRelationGroup = group.kind === "mandatory" || group.kind === "optional";
    if (isDirectRelationGroup) {
      group.features.forEach((feature) => appendFeature(feature, parent, group.kind === "mandatory" ? "Mandatory" : "Optional"));
      return null;
    }

    const groupType = group.kind === "or" ? "Or" : group.kind === "alternative" ? "Alternative" : "Cardinality";
    const groupElement = makeElement(modelId, "Group", `${parent.name} ${group.kind} group ${order + 1}`, order++, {
      GroupType: groupType,
      Cardinality: cardinalityText(group.cardinality || (group.kind === "alternative" ? { min: 1, max: 1 } : { min: 1, max: "*" })),
    });
    elements.push(groupElement);
    const parentRelationType = parent.type === "RootFeature" ? "RootFeature_Child" : "Feature_Child";
    relationships.push(makeRelationship(modelId, parentRelationType, parent, groupElement, order++, "Optional"));
    group.features.forEach((feature) => {
      const child = appendFeature(feature, null, undefined, "Feature");
      relationships.push(makeRelationship(modelId, "Group_Feature", groupElement, child, order++));
    });
    return groupElement;
  };

  if (document.root) appendFeature(document.root, null);
  document.constraints.forEach((constraint, index) => {
    const element = makeElement(modelId, "Constraint", `Constraint ${index + 1}`, order++, {
      Expression: constraint.raw,
    });
    elements.push(element);
  });

  // Group members are created as Features and attached to their Group after
  // their own descendants have been recursively projected.
  return {
    elements,
    relationships,
    valid: diagnostics.every((item) => item.severity !== "error"),
    diagnostics,
    document,
    metadata: sourceMetadata(result, composition.resolvedImports.map((item) => ({
      namespace: item.namespace,
      alias: item.alias,
      path: item.path,
      missing: item.missing,
    }))),
    composition,
  };
}

function locateStructuralIssue(source: string, structuralIssue: UvlStructuralIssue) {
  const lines = source.split(/\r?\n/);
  const elementName = structuralIssue.elementName ? String(structuralIssue.elementName) : "";
  const candidateIndex = elementName
    ? lines.findIndex((line) => line.toLowerCase().includes(elementName.toLowerCase()))
    : lines.findIndex((line) => /^\s*features\b/i.test(line));
  const lineIndex = candidateIndex >= 0 ? candidateIndex : 0;
  const line = lines[lineIndex] ?? "";
  const column = elementName
    ? Math.max(0, line.toLowerCase().indexOf(elementName.toLowerCase()))
    : Math.max(0, line.search(/\S/));
  return {
    line: lineIndex + 1,
    colStart: column + 1,
    colEnd: column + Math.max(2, elementName.length + 1) + 1,
  };
}

/**
 * Parse and validate the structural graph represented by a UVL source. The
 * returned locations allow the editor to highlight graph errors alongside
 * lexical errors from validateUVL().
 */
export function validateUvlSourceStructure(source: string, modelId = "validation", submodelSources?: UvlSubmodelSources): UvlStructuralValidation {
  const parsed = parseUvlForChatbot(source, modelId, submodelSources);
  const validation = validateUvlStructuredModel(parsed as any);
  const parserIssues: UvlStructuralIssue[] = (parsed.diagnostics || []).map((item: any) => {
    // Diagnostics originating in a selected submodel cannot be highlighted
    // at their original line in the root editor.  Point to the corresponding
    // import declaration while retaining the source path in the message.
    const importedPath = item.sourcePath ? String(item.sourcePath).toLowerCase().replace(/\\/g, "/") : "";
    const resolved = importedPath
      ? parsed.composition?.resolvedImports?.find((entry: any) => String(entry.path || "").toLowerCase().replace(/\\/g, "/") === importedPath)
      : undefined;
    const importLocation = resolved
      ? parsed.document.imports.find((entry: any) => entry.namespace.name === resolved.namespace)?.location
      : undefined;
    const location = importLocation || item.location;
    return {
      code: item.code,
      message: item.message,
      severity: item.severity,
      line: location?.line,
      colStart: location?.column,
      colEnd: location?.endColumn,
    };
  });
  const structuralIssues = validation.issues.map((structuralIssue) => ({
    ...structuralIssue,
    ...locateStructuralIssue(source, structuralIssue),
  }));
  // Keep the graph-facing diagnostic used by the editor for an additional
  // root candidate.  The parser reports the precise ROOT_MULTIPLE error; the
  // companion parent diagnostic makes it clear why the extra declaration
  // cannot be materialized as a child in the chatbot graph.
  if (parserIssues.some((item) => item.code === "ROOT_MULTIPLE") && !structuralIssues.some((item) => item.code === "RELATION_PARENT_MISSING")) {
    const rootIssue = parserIssues.find((item) => item.code === "ROOT_MULTIPLE");
    structuralIssues.push({
      code: "RELATION_PARENT_MISSING",
      message: "Additional root feature is not connected to a parent feature.",
      severity: "error",
      line: rootIssue?.line,
      colStart: rootIssue?.colStart,
      colEnd: rootIssue?.colEnd,
    });
  }
  const issues = [...parserIssues, ...structuralIssues].filter((current, index, all) => {
    const key = `${current.code}|${current.line || 0}|${current.colStart || 0}|${current.message}`;
    return all.findIndex((candidate) => `${candidate.code}|${candidate.line || 0}|${candidate.colStart || 0}|${candidate.message}` === key) === index;
  });
  const errors = issues.filter((current) => current.severity === "error");
  const warnings = issues.filter((current) => current.severity === "warning");
  return { valid: errors.length === 0, issues, errors, warnings };
}

function getProperty(element: any, name: string, fallback: any = "") {
  return element?.properties?.find((item: any) => item?.name === name)?.value ?? fallback;
}

function quoteReference(name: string): string {
  return String(name).split(".").map((part) => /^[A-Za-z][A-Za-z0-9_#§%?\\'äüöß;]*$/.test(part) ? part : `"${part.replace(/"/g, "")}"`).join(".");
}

function quoteAttributeString(value: string): string {
  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function jsonAttributeValueToUvl(value: unknown): string {
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.startsWith("constraint ") || value.startsWith("constraints ") ? value : quoteAttributeString(value);
  if (Array.isArray(value)) return `[${value.map((item) => jsonAttributeValueToUvl(item)).join(", ")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).map(([key, item]) => jsonAttributeEntryToUvl(key, item)).join(", ")}}`;
  }
  return "true";
}

function jsonAttributeEntryToUvl(key: string, value: unknown): string {
  const lowerKey = key.toLowerCase();
  if ((lowerKey === "constraint" || lowerKey === "constraints") && typeof value === "string" && value.toLowerCase().startsWith(`${lowerKey} `)) return value;
  return `${quoteReference(key)} ${jsonAttributeValueToUvl(value)}`;
}

function attributesFromElement(element: any): string {
  const raw = String(getProperty(element, "Attributes", "")).trim();
  if (raw) return raw.startsWith("{") ? raw : `{${raw}}`;
  const rawAttributeValues = getProperty(element, "AttributeValues", "");
  const serialized = typeof rawAttributeValues === "string" ? rawAttributeValues.trim() : "";
  if (!serialized && (!rawAttributeValues || typeof rawAttributeValues !== "object")) return "";
  try {
    const values = typeof rawAttributeValues === "string" ? JSON.parse(serialized) : rawAttributeValues;
    if (!values || typeof values !== "object" || Array.isArray(values)) return "";
    const entries = Object.entries(values as Record<string, unknown>);
    return entries.length
      ? `{${entries.map(([key, value]) => jsonAttributeEntryToUvl(key, value)).join(", ")}}`
      : "";
  } catch (_error) {
    return "";
  }
}

function metadataPreamble(metadata: UvlSourceMetadata | undefined): string[] {
  if (!metadata) return [];
  const lines: string[] = [];
  if (metadata.namespace) lines.push(`namespace ${quoteReference(metadata.namespace)}`);
  if (metadata.includes.length) {
    if (lines.length) lines.push("");
    lines.push("include", ...metadata.includes.map((level) => `    ${level}`));
  }
  if (metadata.imports.length) {
    if (lines.length) lines.push("");
    lines.push("imports");
    metadata.imports.forEach((item) => lines.push(`    ${quoteReference(item.namespace)}${item.alias ? ` as ${quoteReference(item.alias)}` : ""}`));
  }
  return lines;
}

function preservedPreamble(source: string, metadata?: UvlSourceMetadata): string[] {
  const lines = source.split(/\r?\n/);
  const featureIndex = lines.findIndex((line) => /^features\b/.test(line.trim()) && indentation(line) === 0);
  const preamble = (featureIndex >= 0 ? lines.slice(0, featureIndex) : lines.filter((line) => /^(namespace|include|imports)\b/.test(line.trim())))
    .filter((line, index, all) => line.trim() || (index > 0 && all[index - 1].trim()));
  return preamble.length ? preamble : (metadataPreamble(metadata).length ? metadataPreamble(metadata) : ["namespace generated"]);
}

function isImportedFeatureReference(name: string, metadata: UvlSourceMetadata | undefined): boolean {
  if (!metadata?.imports?.length) return false;
  const lowerName = String(name || "").toLowerCase();
  return metadata.imports.some((item) => {
    const prefixes = [item.alias, item.namespace, item.namespace?.split(".").pop()].filter(Boolean).map((value) => String(value).toLowerCase());
    return prefixes.some((prefix) => lowerName === prefix || lowerName.startsWith(`${prefix}.`));
  });
}

export function serializeChatbotModelToUvl(model: Model, previousSource = ""): string | null {
  normalizeUvlStructuredModel(model as any);
  materializeUvlParentRelationships(model as any);
  const elements = (Array.isArray(model.elements) ? model.elements : []).filter((element) => UVL_ELEMENT_TYPES.has(element?.type));
  const root = elements.find((element) => element.type === "RootFeature");
  if (!root) return null;
  const validation = validateUvlStructuredModel(model as any);
  if (!validation.valid) return null;
  const byId = new Map(elements.map((element) => [String(element.id), element]));
  const outgoing = new Map<string, any[]>();
  (Array.isArray(model.relationships) ? model.relationships : []).forEach((relationship) => {
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
    const attributes = attributesFromElement(element);
    return [TYPE_KEYWORDS.has(featureType) ? featureType : "", quoteReference(element.name), cardinality ? `cardinality ${cardinality}` : "", attributes]
      .filter(Boolean).join(" ");
  };

  const sourceMetadataValue = (model as any).uvlMetadata as UvlSourceMetadata | undefined;

  const renderFeature = (element: any, depth: number, ancestry: Set<string>): string[] => {
    if (ancestry.has(String(element.id))) return [];
    const nextAncestry = new Set(ancestry).add(String(element.id));
    const lines = [`${"    ".repeat(depth)}${declaration(element)}`];
    // Imported roots are references owned by another file.  Their composed
    // children remain available to the graph, but serializing those children
    // into the root file would silently duplicate the submodel definition.
    if (isImportedFeatureReference(element.name, sourceMetadataValue)) return lines;
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
      const groupCardinality = normalizeUvlCardinality(getProperty(group, "Cardinality", "[1..*]"), groupType === "Alternative" ? "[1..1]" : "[1..*]");
      const groupLabel = groupType === "Alternative"
        ? "alternative"
        : groupType === "Cardinality" || groupCardinality !== "[1..*]"
          ? groupCardinality
          : "or";
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
  const serialized = [
    ...preservedPreamble(previousSource, sourceMetadataValue),
    "",
    "features",
    ...renderFeature(root, 1, new Set()),
    ...(constraints.length ? ["", "constraints", ...constraints.map((constraint) => `    ${constraint}`)] : []),
    "",
  ].join("\n");

  const sourceValidation = validateUvlSourceStructure(serialized, String(model.id));
  return sourceValidation.valid ? serialized : null;
}

export function syncUvlSourceToModel(model: Model, source: string, submodelSources?: UvlSubmodelSources): boolean {
  const parsed = parseUvlForChatbot(source, String(model.id), submodelSources);
  const validation = validateUvlStructuredModel(parsed as any);
  if (!parsed.valid || !validation.valid) return false;
  model.elements = parsed.elements as any;
  model.relationships = parsed.relationships as any;
  normalizeUvlStructuredModel(model as any);
  (model as any).uvl = source;
  (model as any).uvlMetadata = parsed.metadata;
  (model as any).uvlDiagnostics = parsed.diagnostics;
  (model as any).uvlResolvedImports = (parsed.composition?.resolvedImports || []).map((item: any) => ({
    namespace: item.namespace,
    alias: item.alias,
    path: item.path,
    parentPath: item.parentPath,
    missing: item.missing,
  }));
  if (submodelSources !== undefined) {
    (model as any).uvlSubmodels = uvlSubmodelSourcesToRecord(submodelSources);
  }
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
