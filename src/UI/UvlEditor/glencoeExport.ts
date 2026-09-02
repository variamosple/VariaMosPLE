import { BooleanExpression, parseBooleanExpression } from "./booleanExpression";
import type { SplotExportNode } from "./splotExport";

type GlencoeExportNode = SplotExportNode;

type FeatureInfo = {
  name: string;
  optional: boolean;
  type: "FEATURE" | "XOR" | "OR" | "GENOR";
  note: string;
  min?: number;
  max?: number;
};

type TreeInfo = {
  id: string;
  children?: TreeInfo[];
};

const GROUP_RELATIONS = new Set(["or", "alternative", "cardinality"]);

/** Glencoe's identifier alphabet is deliberately conservative. */
export function glencoeSafeName(name: string): string {
  if (name.startsWith("'") && name.endsWith("'")) return name;
  if (name.includes(".")) {
    return name
      .split(".")
      .map((part) => glencoeSafeSimpleName(part))
      .join(".");
  }
  return glencoeSafeSimpleName(name);
}

function glencoeSafeSimpleName(name: string): string {
  return Array.from(name).map((character) => /[A-Za-z0-9_]/.test(character) ? character : "_").join("");
}

function collectNodes(nodes: GlencoeExportNode[]): GlencoeExportNode[] {
  return nodes.flatMap((node) => [node, ...collectNodes(node.children)]);
}

function createFeatureNames(nodes: GlencoeExportNode[]): Map<string, string> {
  const byName = new Map<string, string>();
  const used = new Set<string>();
  collectNodes(nodes).forEach((node) => {
    if (byName.has(node.name)) {
      throw new Error(`Glencoe export requires unique feature names; '${node.name}' is duplicated.`);
    }
    const safeName = glencoeSafeName(node.name);
    if (!safeName) throw new Error(`Glencoe export cannot represent an empty feature name.`);
    if (used.has(safeName)) {
      throw new Error(
        `Glencoe export cannot distinguish '${node.name}' after identifier sanitisation (name '${safeName}').`
      );
    }
    used.add(safeName);
    byName.set(node.name, safeName);
  });
  return byName;
}

type GroupProfile = {
  relation: "or" | "alternative" | "cardinality";
  children: GlencoeExportNode[];
  min: number;
  max: number;
};

function getGroupProfile(node: GlencoeExportNode): GroupProfile | null {
  const groupChildren = node.children.filter((child) => GROUP_RELATIONS.has(child.relation));
  if (groupChildren.length === 0) return null;

  const relation = groupChildren[0].relation as GroupProfile["relation"];
  const groupId = groupChildren[0].groupId ?? "__implicit_group__";
  const sameGroup = groupChildren.every(
    (child) => child.relation === relation && (child.groupId ?? "__implicit_group__") === groupId
  );
  if (!sameGroup || groupChildren.length !== node.children.length) {
    throw new Error(
      `Glencoe cannot represent mixed or multiple child relations under '${node.name}'. ` +
      "Use one homogeneous mandatory/optional relation or one group per parent."
    );
  }

  const declared = groupChildren[0].groupCardinality;
  const min = declared?.min ?? 1;
  const max = declared?.max === "*"
    ? groupChildren.length
    : declared?.max ?? (relation === "alternative" ? 1 : groupChildren.length);
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < min || max > groupChildren.length) {
    throw new Error(
      `Glencoe group under '${node.name}' has invalid cardinality [${min},${declared?.max ?? max}].`
    );
  }
  groupChildren.forEach((child) => {
    const childCardinality = child.groupCardinality;
    const childMax = childCardinality?.max === "*"
      ? groupChildren.length
      : childCardinality?.max;
    if (childCardinality && (childCardinality.min !== min || childMax !== max)) {
      throw new Error(`Glencoe group under '${node.name}' has inconsistent cardinality declarations.`);
    }
  });
  return { relation, children: groupChildren, min, max };
}

function getFeatureType(node: GlencoeExportNode): { type: FeatureInfo["type"]; group?: GroupProfile } {
  const group = getGroupProfile(node);
  if (!group) {
    const hasInvalidRelation = node.children.some(
      (child) => child.relation !== "mandatory" && child.relation !== "optional"
    );
    if (hasInvalidRelation) {
      throw new Error(`Glencoe found an unsupported child relation under '${node.name}'.`);
    }
    return { type: "FEATURE" };
  }
  return {
    type: group.relation === "alternative"
      ? "XOR"
      : group.relation === "or"
        ? "OR"
        : "GENOR",
    group,
  };
}

function createFeaturesInfo(nodes: GlencoeExportNode[], names: Map<string, string>): Record<string, FeatureInfo> {
  const result: Record<string, FeatureInfo> = {};
  collectNodes(nodes)
    .sort((left, right) => (names.get(left.name) ?? "").localeCompare(names.get(right.name) ?? ""))
    .forEach((node) => {
      const featureName = names.get(node.name);
      if (!featureName) throw new Error(`Glencoe export cannot resolve feature '${node.name}'.`);
      const { type, group } = getFeatureType(node);
      const info: FeatureInfo = {
        name: featureName,
        // This follows the Glencoe/FlamaPy convention: a feature is optional
        // unless its relation to its parent is explicitly mandatory.
        optional: node.relation !== "mandatory",
        type,
        note: "",
      };
      if (group && type === "GENOR") {
        info.min = group.min;
        info.max = group.max;
      }
      result[featureName] = info;
    });
  return result;
}

function createTreeInfo(node: GlencoeExportNode, names: Map<string, string>): TreeInfo {
  const id = names.get(node.name);
  if (!id) throw new Error(`Glencoe export cannot resolve feature '${node.name}'.`);
  const children = node.children
    .slice()
    .sort((left, right) => (names.get(left.name) ?? "").localeCompare(names.get(right.name) ?? ""))
    .map((child) => createTreeInfo(child, names));
  return children.length ? { id, children } : { id };
}

function constraintToGlencoe(expression: BooleanExpression, names: Map<string, string>): Record<string, unknown> {
  if (expression.kind === "literal") {
    const id = names.get(expression.name);
    if (!id) throw new Error(`Glencoe export cannot find feature '${expression.name}' used in a constraint.`);
    return { type: "FeatureTerm", operands: [id] };
  }
  if (expression.kind === "not") {
    return { type: "NotTerm", operands: [constraintToGlencoe(expression.expression, names)] };
  }
  const typeByKind: Record<Exclude<BooleanExpression["kind"], "literal" | "not">, string> = {
    and: "AndTerm",
    or: "OrTerm",
    implies: "ImpliesTerm",
    equivalent: "EquivalentTerm",
    excludes: "ExcludesTerm",
    xor: "XorTerm",
  };
  return {
    type: typeByKind[expression.kind],
    operands: [
      constraintToGlencoe(expression.left, names),
      constraintToGlencoe(expression.right, names),
    ],
  };
}

export function getGlencoeCompatibilityWarnings(source: string): string[] {
  const warnings: string[] = [];
  let section = "";
  source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\r\n]/g, " "))
    .split(/\r?\n/)
    .forEach((raw, index) => {
      const trimmed = raw.trim();
      if (!trimmed || trimmed.startsWith("//")) return;
      const sectionMatch = trimmed.match(/^(namespace|include|imports|features|constraints)\b/);
      if (sectionMatch && raw.search(/\S/) === 0) {
        section = sectionMatch[1];
        if (section === "imports") {
          warnings.push(`Line ${index + 1}: imported UVL models are not embedded in one Glencoe file.`);
        }
        return;
      }
      if (section !== "features") return;
      if (/^(Integer|Real|String)\s+/.test(trimmed)) {
        warnings.push(`Line ${index + 1}: typed UVL feature values are not representable in Glencoe GFM JSON.`);
      }
      if (/\bcardinality\s+\[[^\]]+\]/.test(trimmed)) {
        warnings.push(`Line ${index + 1}: feature cardinality is not representable in Glencoe GFM JSON.`);
      }
      if (/\{[^}]+\}/.test(trimmed)) {
        warnings.push(`Line ${index + 1}: UVL modifiers/attributes are not representable in Glencoe GFM JSON.`);
      }
    });
  return Array.from(new Set(warnings));
}

/** Build the standard Glencoe Feature Model JSON (GFM JSON) document. */
export function buildGlencoeGfmJson(
  _modelName: string,
  nodes: GlencoeExportNode[],
  constraints: string[]
): string {
  if (nodes.length !== 1) throw new Error("Glencoe export requires exactly one root feature.");
  const names = createFeatureNames(nodes);
  const root = nodes[0];
  const constraintsInfo: Record<string, Record<string, unknown>> = {};
  constraints.forEach((source, index) => {
    constraintsInfo[`Constraint ${index}`] = constraintToGlencoe(
      parseBooleanExpression(source, "Glencoe export"),
      names
    );
  });

  const rootName = names.get(root.name);
  if (!rootName) throw new Error(`Glencoe export cannot resolve root '${root.name}'.`);
  const document = {
    id: `FM_${rootName}`,
    name: `FM_${rootName}`,
    features: createFeaturesInfo(nodes, names),
    tree: createTreeInfo(root, names),
    constraints: constraintsInfo,
  };
  return JSON.stringify(document, null, 4);
}

// Friendly aliases for callers that refer to the format simply as Glencoe or
// JSON.  The canonical function name documents that this is GFM JSON, whose
// standard extension is `.gfm.json`.
export const buildGlencoe = buildGlencoeGfmJson;
export const buildGlencoeJson = buildGlencoeGfmJson;
