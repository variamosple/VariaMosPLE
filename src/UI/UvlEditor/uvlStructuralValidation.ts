/**
 * Structural rules shared by the UVL editor, the chatbot adapter and the
 * exporters.  The text linter in UvlEditor.tsx checks lexical/boolean syntax;
 * this module checks the graph that represents a UVL feature model.
 */

export type UvlPropertyLike = {
  id?: string;
  name?: string;
  value?: unknown;
  [key: string]: unknown;
};

export type UvlElementLike = {
  id?: string;
  name?: string;
  type?: string;
  parentId?: string | null;
  properties?: UvlPropertyLike[];
  [key: string]: unknown;
};

export type UvlRelationshipLike = {
  id?: string;
  name?: string;
  type?: string;
  sourceId?: string;
  targetId?: string;
  min?: number;
  max?: number;
  properties?: UvlPropertyLike[];
  [key: string]: unknown;
};

export type UvlStructuredModelLike = {
  id?: string;
  elements?: UvlElementLike[];
  relationships?: UvlRelationshipLike[];
  [key: string]: unknown;
};

export type UvlStructuralIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
  elementId?: string;
  elementName?: string;
  relationshipId?: string;
  line?: number;
  colStart?: number;
  colEnd?: number;
};

export type UvlStructuralValidation = {
  valid: boolean;
  issues: UvlStructuralIssue[];
  errors: UvlStructuralIssue[];
  warnings: UvlStructuralIssue[];
};

export type UvlCardinality = {
  min: number;
  max: number | "*";
};

export const UVL_ELEMENT_TYPES = new Set(["RootFeature", "Feature", "Group", "Constraint"]);
export const UVL_FEATURE_TYPES = ["Untyped", "Boolean", "Integer", "Real", "String"] as const;
export const UVL_GROUP_TYPES = ["Or", "Alternative", "Cardinality"] as const;
export const UVL_RELATION_TYPES = new Set(["RootFeature_Child", "Feature_Child", "Group_Feature"]);
export const UVL_RELATION_VALUES = ["Mandatory", "Optional"] as const;

const structuralRelationTypes = new Set(["RootFeature_Child", "Feature_Child", "Group_Feature"]);

function stableId(prefix: string, value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}_${(hash >>> 0).toString(36)}`;
}

function text(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function canonicalValue(value: unknown, values: readonly string[]): string | null {
  const token = text(value).toLowerCase();
  if (!token) return null;
  return values.find((candidate) => candidate.toLowerCase() === token) ?? null;
}

export function parseUvlCardinality(value: unknown): UvlCardinality | null {
  const raw = text(value).replace(/\s+/g, "");
  // UVL accepts both ranges (`[min..max]`) and an exact cardinality
  // (`[n]`).  Internally an exact cardinality is represented as the range
  // `[n..n]` so exporters and the diagram can use one representation.
  const match = raw.match(/^\[(\d+)(?:\.\.(\d+|\*))?\]$/);
  if (!match) return null;

  const min = Number(match[1]);
  const max = match[2] == null ? min : match[2] === "*" ? "*" : Number(match[2]);
  if (!Number.isInteger(min) || min < 0) return null;
  if (typeof max === "number" && (!Number.isInteger(max) || max < min)) return null;
  return { min, max };
}

export function normalizeUvlCardinality(value: unknown, fallback = "[1..1]"): string {
  const parsed = parseUvlCardinality(value);
  if (!parsed) return fallback;
  return `[${parsed.min}..${parsed.max}]`;
}

function propertyIndex(element: UvlElementLike | UvlRelationshipLike): Map<string, UvlPropertyLike> {
  const result = new Map<string, UvlPropertyLike>();
  (Array.isArray(element.properties) ? element.properties : []).forEach((item) => {
    const name = text(item?.name);
    if (name) result.set(name.toLowerCase(), item);
  });
  return result;
}

export function getUvlProperty(owner: UvlElementLike | UvlRelationshipLike, name: string, fallback = ""): string {
  return text(propertyIndex(owner).get(name.toLowerCase())?.value ?? fallback);
}

function setUvlProperty(owner: UvlElementLike | UvlRelationshipLike, name: string, value: unknown): void {
  if (!Array.isArray(owner.properties)) owner.properties = [];
  const existing = owner.properties.find((item) => text(item?.name).toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.name = name;
    existing.value = value;
    return;
  }
  const ownerId = text(owner.id) || "owner";
  owner.properties.push({
    id: stableId("uvlprop", `${ownerId}:${name}`),
    name,
    value,
    type: "String",
    display: true,
  });
}

function relationKind(source: UvlElementLike, target: UvlElementLike, type: string): boolean {
  if (type === "RootFeature_Child") return source.type === "RootFeature" && (target.type === "Feature" || target.type === "Group");
  if (type === "Feature_Child") return source.type === "Feature" && (target.type === "Feature" || target.type === "Group");
  if (type === "Group_Feature") return source.type === "Group" && target.type === "Feature";
  return false;
}

function issue(
  code: string,
  message: string,
  details: Partial<UvlStructuralIssue> = {}
): UvlStructuralIssue {
  return { code, message, severity: "error", ...details };
}

function addIssue(issues: UvlStructuralIssue[], next: UvlStructuralIssue): void {
  const key = `${next.code}|${next.elementId || next.relationshipId || ""}|${next.message}`;
  if (!issues.some((current) => `${current.code}|${current.elementId || current.relationshipId || ""}|${current.message}` === key)) {
    issues.push(next);
  }
}

/**
 * Applies deterministic defaults used by the textual adapter.  It also turns
 * valid parentId hints into real UVL relationships; callers can then validate
 * the resulting graph before it is persisted or exported.
 */
export function normalizeUvlStructuredModel(model: UvlStructuredModelLike): UvlStructuredModelLike {
  if (!Array.isArray(model.elements)) model.elements = [];
  if (!Array.isArray(model.relationships)) model.relationships = [];

  const elements = model.elements;
  elements.forEach((element, index) => {
    if (!Array.isArray(element.properties)) element.properties = [];
    const type = text(element.type);
    if (!UVL_ELEMENT_TYPES.has(type)) return;

    if (type === "RootFeature" || type === "Feature") {
      const rawFeatureType = getUvlProperty(element, "FeatureType");
      const featureType = rawFeatureType
        ? (canonicalValue(rawFeatureType, UVL_FEATURE_TYPES) || rawFeatureType)
        : "Untyped";
      setUvlProperty(element, "FeatureType", featureType);
      const rawCardinality = getUvlProperty(element, "Cardinality");
      setUvlProperty(element, "Cardinality", rawCardinality && parseUvlCardinality(rawCardinality)
        ? normalizeUvlCardinality(rawCardinality, "")
        : rawCardinality);
      setUvlProperty(element, "Attributes", getUvlProperty(element, "Attributes"));
      const attributeValuesProperty = element.properties.find((item) => text(item?.name).toLowerCase() === "attributevalues");
      const rawAttributeValues = attributeValuesProperty?.value;
      const normalizedAttributeValues = rawAttributeValues && typeof rawAttributeValues === "object"
        ? JSON.stringify(rawAttributeValues)
        : getUvlProperty(element, "AttributeValues");
      setUvlProperty(element, "AttributeValues", normalizedAttributeValues);
    }

    if (type === "Group") {
      const rawGroupType = getUvlProperty(element, "GroupType");
      const groupType = rawGroupType
        ? (canonicalValue(rawGroupType, UVL_GROUP_TYPES) || rawGroupType)
        : "Or";
      const fallback = groupType === "Alternative" ? "[1..1]" : "[1..*]";
      setUvlProperty(element, "GroupType", groupType);
      const rawCardinality = getUvlProperty(element, "Cardinality");
      setUvlProperty(element, "Cardinality", rawCardinality
        ? (parseUvlCardinality(rawCardinality) ? normalizeUvlCardinality(rawCardinality, fallback) : rawCardinality)
        : fallback);
    }

    if (type === "Constraint") {
      setUvlProperty(element, "Expression", getUvlProperty(element, "Expression"));
    }

    const rawOrder = getUvlProperty(element, "UVLOrder");
    const currentOrder = rawOrder === "" ? NaN : Number(rawOrder);
    setUvlProperty(element, "UVLOrder", Number.isFinite(currentOrder) ? currentOrder : index);
  });

  model.relationships.forEach((relationship, index) => {
    if (!Array.isArray(relationship.properties)) relationship.properties = [];
    const rawType = text(relationship.type);
    const canonicalType = Array.from(structuralRelationTypes).find((candidate) => candidate.toLowerCase() === rawType.toLowerCase());
    if (canonicalType) relationship.type = canonicalType;
    const defaultMin = relationship.type === "Group_Feature" ? 1 : 0;
    const rawMin = (relationship as any).min;
    const rawMax = (relationship as any).max;
    if (rawMin == null || String(rawMin).trim() === "") relationship.min = defaultMin;
    if (rawMax == null || String(rawMax).trim() === "") relationship.max = 9999999;
    if (relationship.type === "RootFeature_Child" || relationship.type === "Feature_Child") {
      const rawRelation = getUvlProperty(relationship, "Relation");
      const relation = rawRelation
        ? (canonicalValue(rawRelation, UVL_RELATION_VALUES) || rawRelation)
        : "Optional";
      setUvlProperty(relationship, "Relation", relation);
    }
    const rawOrder = getUvlProperty(relationship, "UVLOrder");
    const order = rawOrder === "" ? NaN : Number(rawOrder);
    setUvlProperty(relationship, "UVLOrder", Number.isFinite(order) ? order : index);
  });

  materializeUvlParentRelationships(model);
  return model;
}

/** Turn chatbot parentId hints into explicit graph relationships. */
export function materializeUvlParentRelationships(model: UvlStructuredModelLike): UvlStructuralIssue[] {
  if (!Array.isArray(model.elements)) model.elements = [];
  if (!Array.isArray(model.relationships)) model.relationships = [];

  const elements = model.elements;
  const relationships = model.relationships;
  const byId = new Map(elements.map((element) => [text(element.id), element]));
  const incomingTargets = new Set(
    relationships
      .filter((relationship) => byId.has(text(relationship.sourceId)) && byId.has(text(relationship.targetId)))
      .map((relationship) => text(relationship.targetId))
  );
  const issues: UvlStructuralIssue[] = [];

  elements.forEach((child, index) => {
    const parentId = text(child.parentId);
    if (!parentId) return;

    if (incomingTargets.has(text(child.id))) {
      child.parentId = null;
      return;
    }

    const parent = byId.get(parentId);
    if (!parent) {
      addIssue(issues, issue("PARENT_NOT_FOUND", `Parent '${parentId}' referenced by '${text(child.name)}' does not exist.`, {
        elementId: text(child.id), elementName: text(child.name),
      }));
      return;
    }
    if (parent === child) {
      addIssue(issues, issue("SELF_PARENT", `Element '${text(child.name)}' cannot be its own parent.`, {
        elementId: text(child.id), elementName: text(child.name),
      }));
      return;
    }

    let relationshipType: string | null = null;
    if (parent.type === "Group" && child.type === "Feature") {
      relationshipType = "Group_Feature";
    } else if ((parent.type === "RootFeature" || parent.type === "Feature") && (child.type === "Feature" || child.type === "Group")) {
      relationshipType = parent.type === "RootFeature" ? "RootFeature_Child" : "Feature_Child";
    }
    if (!relationshipType) {
      addIssue(issues, issue("INVALID_PARENT_TYPE", `Element '${text(child.name)}' cannot be a child of '${text(parent.name)}'.`, {
        elementId: text(child.id), elementName: text(child.name),
      }));
      return;
    }

    const duplicate = relationships.some((relationship) =>
      relationship.type === relationshipType &&
      text(relationship.sourceId) === text(parent.id) &&
      text(relationship.targetId) === text(child.id)
    );
    if (!duplicate) {
      const relationshipId = stableId("uvlrel", `${text(model.id)}:${relationshipType}:${text(parent.id)}:${text(child.id)}`);
      const next: UvlRelationshipLike = {
        id: relationshipId,
        name: relationshipType,
        type: relationshipType,
        sourceId: text(parent.id),
        targetId: text(child.id),
        min: relationshipType === "Group_Feature" ? 1 : 0,
        max: 9999999,
        points: [],
        properties: [],
      };
      if (relationshipType !== "Group_Feature") setUvlProperty(next, "Relation", "Optional");
      setUvlProperty(next, "UVLOrder", index);
      relationships.push(next);
    }
    incomingTargets.add(text(child.id));
    child.parentId = null;
  });

  return issues;
}

/** Validate the graph-level UVL invariants. No mutation is performed. */
export function validateUvlStructuredModel(model: UvlStructuredModelLike): UvlStructuralValidation {
  const allElements = Array.isArray(model.elements) ? model.elements : [];
  const elements = allElements.filter((element) => UVL_ELEMENT_TYPES.has(text(element.type)));
  const relationships = Array.isArray(model.relationships) ? model.relationships : [];
  const issues: UvlStructuralIssue[] = [];
  const byId = new Map<string, UvlElementLike>();
  const byName = new Map<string, UvlElementLike>();

  elements.forEach((element) => {
    const id = text(element.id);
    const name = text(element.name);
    if (!id) addIssue(issues, issue("ELEMENT_ID_MISSING", `UVL element '${name || "(unnamed)"}' has no id.`, { elementName: name }));
    else if (byId.has(id)) addIssue(issues, issue("ELEMENT_ID_DUPLICATE", `UVL element id '${id}' is duplicated.`, { elementId: id, elementName: name }));
    else byId.set(id, element);

    if (!name) {
      addIssue(issues, issue("ELEMENT_NAME_MISSING", "UVL elements must have a non-empty name.", { elementId: id }));
    } else if (element.type === "RootFeature" || element.type === "Feature") {
      const key = name.toLowerCase();
      const previous = byName.get(key);
      if (previous) {
        addIssue(issues, issue("ELEMENT_NAME_DUPLICATE", `UVL element name '${name}' is duplicated (names are case-insensitive).`, {
          elementId: id, elementName: name,
        }));
      } else byName.set(key, element);
    }

    if (element.type === "RootFeature" || element.type === "Feature") {
      const featureType = canonicalValue(getUvlProperty(element, "FeatureType"), UVL_FEATURE_TYPES);
      if (!featureType) addIssue(issues, issue("FEATURE_TYPE_INVALID", `Feature '${name || "(unnamed)"}' has an invalid FeatureType.`, { elementId: text(element.id), elementName: name }));
      const cardinality = getUvlProperty(element, "Cardinality");
      if (cardinality && !parseUvlCardinality(cardinality)) addIssue(issues, issue("FEATURE_CARDINALITY_INVALID", `Feature '${name || "(unnamed)"}' has invalid cardinality '${cardinality}'.`, { elementId: text(element.id), elementName: name }));
      const attributeValuesProperty = element.properties?.find((item) => text(item?.name).toLowerCase() === "attributevalues");
      const rawAttributeValues = attributeValuesProperty?.value;
      const attributeValues = typeof rawAttributeValues === "string" ? rawAttributeValues : rawAttributeValues && typeof rawAttributeValues === "object" ? rawAttributeValues : "";
      if (attributeValues) {
        try {
          const parsedAttributeValues = typeof attributeValues === "string" ? JSON.parse(attributeValues) : attributeValues;
          if (!parsedAttributeValues || typeof parsedAttributeValues !== "object" || Array.isArray(parsedAttributeValues)) throw new Error("not an object");
        } catch (_error) {
          addIssue(issues, issue("ATTRIBUTE_VALUES_INVALID", `Feature '${name || "(unnamed)"}' has invalid AttributeValues JSON.`, { elementId: text(element.id), elementName: name }));
        }
      }
    }

    if (element.type === "Group") {
      const groupType = canonicalValue(getUvlProperty(element, "GroupType"), UVL_GROUP_TYPES);
      if (!groupType) addIssue(issues, issue("GROUP_TYPE_INVALID", `Group '${name || "(unnamed)"}' must use Or, Alternative or Cardinality.`, { elementId: text(element.id), elementName: name }));
      const cardinality = getUvlProperty(element, "Cardinality");
      if (!parseUvlCardinality(cardinality)) addIssue(issues, issue("GROUP_CARDINALITY_INVALID", `Group '${name || "(unnamed)"}' has invalid cardinality '${cardinality}'.`, { elementId: text(element.id), elementName: name }));
    }

    if (element.type === "Constraint" && !getUvlProperty(element, "Expression")) {
      addIssue(issues, issue("CONSTRAINT_EMPTY", `Constraint '${name || "(unnamed)"}' has an empty expression.`, { elementId: text(element.id), elementName: name }));
    }
    if (text(element.parentId)) {
      addIssue(issues, issue("PARENT_HINT_UNMATERIALIZED", `Element '${name || "(unnamed)"}' still has an unresolved parentId hint.`, { elementId: text(element.id), elementName: name }));
    }
  });

  const roots = elements.filter((element) => element.type === "RootFeature");
  if (roots.length === 0) addIssue(issues, issue("ROOT_MISSING", "A UVL model requires exactly one RootFeature."));
  if (roots.length > 1) addIssue(issues, issue("ROOT_MULTIPLE", `A UVL model requires exactly one RootFeature, but found ${roots.length}.`));

  const incoming = new Map<string, UvlRelationshipLike[]>();
  const outgoing = new Map<string, UvlRelationshipLike[]>();
  const edgeKeys = new Set<string>();

  relationships.forEach((relationship) => {
    const relationshipType = text(relationship.type);
    if (!structuralRelationTypes.has(relationshipType)) {
      const touchesUvlElement = byId.has(text(relationship.sourceId)) || byId.has(text(relationship.targetId));
      if (!touchesUvlElement) return;
      addIssue(issues, issue("RELATION_TYPE_INVALID", `Relationship '${relationshipType || "(unnamed)"}' is not a supported UVL structural relationship.`, { relationshipId: text(relationship.id) }));
      return;
    }
    const source = byId.get(text(relationship.sourceId));
    const target = byId.get(text(relationship.targetId));
    if (!source || !target) {
      addIssue(issues, issue("RELATION_ENDPOINT_MISSING", `Relationship '${text(relationship.type)}' references a missing source or target.`, { relationshipId: text(relationship.id) }));
      return;
    }
    if (!relationKind(source, target, relationshipType)) {
      addIssue(issues, issue("RELATION_ENDPOINT_INVALID", `Relationship '${relationshipType}' cannot connect ${text(source.type)} '${text(source.name)}' to ${text(target.type)} '${text(target.name)}'.`, { relationshipId: text(relationship.id), elementName: text(target.name) }));
      return;
    }

    const key = `${relationshipType}|${text(source.id)}|${text(target.id)}`;
    if (edgeKeys.has(key)) addIssue(issues, issue("RELATION_DUPLICATE", `Relationship '${relationshipType}' between '${text(source.name)}' and '${text(target.name)}' is duplicated.`, { relationshipId: text(relationship.id) }));
    edgeKeys.add(key);

    const min = Number(relationship.min);
    const max = Number(relationship.max);
    const minimumAllowed = relationship.type === "Group_Feature" ? 1 : 0;
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < minimumAllowed || max < min) addIssue(issues, issue("RELATION_CARDINALITY_INVALID", `Relationship '${relationshipType}' has invalid min/max bounds.`, { relationshipId: text(relationship.id) }));

    if (relationshipType === "RootFeature_Child" || relationshipType === "Feature_Child") {
      const relation = canonicalValue(getUvlProperty(relationship, "Relation"), UVL_RELATION_VALUES);
      if (!relation) addIssue(issues, issue("RELATION_VALUE_INVALID", `Relationship '${text(relationship.type)}' must define Relation as Mandatory or Optional.`, { relationshipId: text(relationship.id) }));
    }

    const targetId = text(target.id);
    const sourceId = text(source.id);
    const targetIncoming = incoming.get(targetId) || [];
    targetIncoming.push(relationship);
    incoming.set(targetId, targetIncoming);
    const sourceOutgoing = outgoing.get(sourceId) || [];
    sourceOutgoing.push(relationship);
    outgoing.set(sourceId, sourceOutgoing);
  });

  elements.filter((element) => element.type === "Feature" || element.type === "Group").forEach((element) => {
    const parentRelations = (incoming.get(text(element.id)) || []).filter((relationship) => structuralRelationTypes.has(text(relationship.type)));
    if (parentRelations.length === 0) addIssue(issues, issue("RELATION_PARENT_MISSING", `Element '${text(element.name)}' is not connected to a parent feature or group.`, { elementId: text(element.id), elementName: text(element.name) }));
    if (parentRelations.length > 1) addIssue(issues, issue("RELATION_PARENT_MULTIPLE", `Element '${text(element.name)}' has more than one structural parent.`, { elementId: text(element.id), elementName: text(element.name) }));
  });

  roots.forEach((root) => {
    const parentRelations = incoming.get(text(root.id)) || [];
    if (parentRelations.length) addIssue(issues, issue("ROOT_HAS_PARENT", `RootFeature '${text(root.name)}' cannot have a parent relationship.`, { elementId: text(root.id), elementName: text(root.name) }));
  });

  elements.filter((element) => element.type === "Group").forEach((group) => {
    const members = (outgoing.get(text(group.id)) || []).filter((relationship) => text(relationship.type) === "Group_Feature");
    if (!members.length) {
      addIssue(issues, issue("GROUP_EMPTY", `Group '${text(group.name)}' must contain at least one Feature.`, { elementId: text(group.id), elementName: text(group.name) }));
      return;
    }
    const parsed = parseUvlCardinality(getUvlProperty(group, "Cardinality"));
    if (!parsed) return;
    const max = parsed.max === "*" ? members.length : parsed.max;
    if (parsed.min > members.length || max > members.length) addIssue(issues, issue("GROUP_CARDINALITY_EXCEEDS_MEMBERS", `Group '${text(group.name)}' cardinality [${parsed.min}..${parsed.max}] exceeds its ${members.length} member(s).`, { elementId: text(group.id), elementName: text(group.name) }));
    const groupType = canonicalValue(getUvlProperty(group, "GroupType"), UVL_GROUP_TYPES);
    if (groupType === "Alternative" && (parsed.min !== 1 || parsed.max !== 1)) addIssue(issues, issue("ALTERNATIVE_CARDINALITY_INVALID", `Alternative group '${text(group.name)}' must use cardinality [1..1].`, { elementId: text(group.id), elementName: text(group.name) }));
  });

  // Detect cycles in the structural feature graph.
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (elementId: string, path: string[]) => {
    if (visiting.has(elementId)) {
      const current = byId.get(elementId);
      addIssue(issues, issue("RELATION_CYCLE", `UVL structural relationships contain a cycle involving '${text(current?.name)}'.`, { elementId, elementName: text(current?.name) }));
      return;
    }
    if (visited.has(elementId)) return;
    visiting.add(elementId);
    (outgoing.get(elementId) || []).forEach((relationship) => {
      if (structuralRelationTypes.has(text(relationship.type))) visit(text(relationship.targetId), [...path, elementId]);
    });
    visiting.delete(elementId);
    visited.add(elementId);
  };
  roots.forEach((root) => visit(text(root.id), []));

  elements.filter((element) => element.type === "Feature" || element.type === "Group").forEach((element) => {
    if (!visited.has(text(element.id))) {
      addIssue(issues, issue("ELEMENT_DISCONNECTED", `Element '${text(element.name)}' is not reachable from the RootFeature.`, {
        elementId: text(element.id), elementName: text(element.name),
      }));
    }
  });

  // Run the same cycle check for disconnected components as well. This keeps
  // a cycle from being hidden merely because it has no path from the root.
  const cycleVisited = new Set<string>();
  const cycleVisiting = new Set<string>();
  const visitForCycles = (elementId: string) => {
    if (cycleVisiting.has(elementId)) {
      const current = byId.get(elementId);
      addIssue(issues, issue("RELATION_CYCLE", `UVL structural relationships contain a cycle involving '${text(current?.name)}'.`, { elementId, elementName: text(current?.name) }));
      return;
    }
    if (cycleVisited.has(elementId)) return;
    cycleVisiting.add(elementId);
    (outgoing.get(elementId) || []).forEach((relationship) => visitForCycles(text(relationship.targetId)));
    cycleVisiting.delete(elementId);
    cycleVisited.add(elementId);
  };
  elements.filter((element) => element.type === "RootFeature" || element.type === "Feature" || element.type === "Group")
    .forEach((element) => visitForCycles(text(element.id)));

  const errors = issues.filter((current) => current.severity === "error");
  const warnings = issues.filter((current) => current.severity === "warning");
  return { valid: errors.length === 0, issues, errors, warnings };
}
