import { BooleanExpression, parseBooleanExpression } from "./booleanExpression";
import type { SplotExportNode } from "./splotExport";

type AfmExportNode = SplotExportNode;

const GROUP_RELATIONS = new Set(["or", "alternative", "cardinality"]);
const AFM_RESERVED_WORDS = new Set([
  "AND",
  "OR",
  "NOT",
  "IFF",
  "IMPLIES",
  "REQUIRES",
  "EXCLUDES",
  "MIN",
  "MAX",
  "SUM",
  "COS",
  "SIN",
  "INTEGER",
]);

/**
 * AFM (FAMA) identifiers are WORD tokens in the FlamaPy grammar.  Unlike
 * UVL, that grammar does not accept spaces, punctuation or underscores in a
 * feature name and reserves lower-case words for attributes/operators, so
 * names are normalised deterministically and collisions are reported instead
 * of producing an ambiguous model.
 */
export function afmSafeName(name: string): string {
  const normalised = Array.from(name)
    .map((character) => /[A-Za-z0-9]/.test(character) ? character : "X")
    .join("");
  if (!normalised) return "Feature";
  // AFM's WORD token starts with an upper-case letter (lower-case words are
  // reserved for attribute names and operators).
  const candidate = /^[A-Z]/.test(normalised) ? normalised : `F${normalised}`;
  return AFM_RESERVED_WORDS.has(candidate.toUpperCase()) ? `F${candidate}` : candidate;
}

function collectNodes(nodes: AfmExportNode[]): AfmExportNode[] {
  return nodes.flatMap((node) => [node, ...collectNodes(node.children)]);
}

function createFeatureNames(nodes: AfmExportNode[]): Map<string, string> {
  const byName = new Map<string, string>();
  const used = new Set<string>();
  collectNodes(nodes).forEach((node) => {
    if (byName.has(node.name)) {
      throw new Error(`AFM export requires unique feature names; '${node.name}' is duplicated.`);
    }
    const safeName = afmSafeName(node.name);
    if (used.has(safeName)) {
      throw new Error(
        `AFM export cannot distinguish '${node.name}' after identifier sanitisation (name '${safeName}').`
      );
    }
    used.add(safeName);
    byName.set(node.name, safeName);
  });
  return byName;
}

function groupCardinality(node: AfmExportNode, childCount: number): { min: number; max: number } {
  const declared = node.groupCardinality;
  const min = declared?.min ?? 1;
  const max = declared?.max === "*"
    ? childCount
    : declared?.max ?? (node.relation === "alternative" ? 1 : childCount);
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < min || max > childCount) {
    throw new Error(
      `AFM group '${node.name}' has invalid cardinality [${min},${declared?.max ?? max}] for ${childCount} member(s).`
    );
  }
  return { min, max };
}

function renderRelations(node: AfmExportNode, names: Map<string, string>): string {
  const rendered: string[] = [];
  const emittedGroups = new Set<string>();
  for (let index = 0; index < node.children.length;) {
    const child = node.children[index];
    const childName = names.get(child.name);
    if (!childName) throw new Error(`AFM export cannot resolve feature '${child.name}'.`);

    if (!GROUP_RELATIONS.has(child.relation)) {
      if (child.relation === "mandatory") rendered.push(childName);
      else if (child.relation === "optional") rendered.push(`[${childName}]`);
      else throw new Error(`AFM found an unsupported relation '${child.relation}' under '${node.name}'.`);
      index++;
      continue;
    }

    const groupId = child.groupId ?? "__implicit_group__";
    const groupKey = `${child.relation}:${groupId}`;
    if (emittedGroups.has(groupKey)) {
      index++;
      continue;
    }
    emittedGroups.add(groupKey);
    // AFM relationship specifications are unordered, so members of a group
    // can be collected even if a source editor placed another relation between
    // them.  This avoids accidentally splitting one UVL group into two.
    const groupChildren = node.children.filter(
      (member) => member.relation === child.relation && (member.groupId ?? "__implicit_group__") === groupId
    );
    const cardinality = groupCardinality(child, groupChildren.length);
    groupChildren.forEach((member) => {
      const memberCardinality = member.groupCardinality;
      if (memberCardinality && (
        memberCardinality.min !== cardinality.min ||
        (memberCardinality.max === "*" ? groupChildren.length : memberCardinality.max) !== cardinality.max
      )) {
        throw new Error(`AFM group '${node.name}' has inconsistent cardinality declarations.`);
      }
    });
    const namesInGroup = groupChildren.map((member) => {
      const name = names.get(member.name);
      if (!name) throw new Error(`AFM export cannot resolve feature '${member.name}'.`);
      return name;
    });
    rendered.push(`[${cardinality.min},${cardinality.max}]{${namesInGroup.join(" ")}}`);
  }
  return rendered.join(" ");
}

function renderRelationshipBlock(root: AfmExportNode, names: Map<string, string>): string {
  if (root.children.length === 0) {
    throw new Error("AFM export requires the root feature to have at least one child relationship.");
  }
  const lines: string[] = [];
  const visit = (node: AfmExportNode) => {
    // AFM relationship specifications introduce a feature when it appears as
    // a child; leaf features therefore do not need (and cannot have) their
    // own empty specification.
    if (node !== root && node.children.length === 0) return;
    const name = names.get(node.name);
    if (!name) throw new Error(`AFM export cannot resolve feature '${node.name}'.`);
    const relations = renderRelations(node, names);
    // The AFM grammar requires the optional SPACE token after the colon,
    // including for a leaf feature with no relationship specifications.
    lines.push(`${name} : ${relations};`);
    node.children.forEach(visit);
  };
  visit(root);
  return lines.join("\n");
}

function renderConstraint(expression: BooleanExpression, names: Map<string, string>): string {
  if (expression.kind === "literal") {
    const name = names.get(expression.name);
    if (!name) throw new Error(`AFM export cannot find feature '${expression.name}' used in a constraint.`);
    return name;
  }
  // Parenthesise the unary expression.  AFM's grammar does not accept a
  // bare NOT as the right operand of a binary operator (e.g. `A IFF NOT B`).
  if (expression.kind === "not") return `(NOT ${renderConstraint(expression.expression, names)})`;

  const operators: Record<Exclude<BooleanExpression["kind"], "literal" | "not" | "xor">, string> = {
    and: "AND",
    or: "OR",
    implies: "REQUIRES",
    equivalent: "IFF",
    excludes: "EXCLUDES",
  };
  if (expression.kind === "xor") {
    throw new Error("AFM export does not define a portable XOR constraint operator.");
  }
  return `(${renderConstraint(expression.left, names)} ${operators[expression.kind]} ${renderConstraint(expression.right, names)})`;
}

export function getAfmCompatibilityWarnings(source: string): string[] {
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
          warnings.push(`Line ${index + 1}: imported UVL models are not embedded in one AFM file.`);
        }
        return;
      }
      if (section !== "features") return;
      if (/^(Integer|Real|String)\s+/.test(trimmed)) {
        warnings.push(`Line ${index + 1}: typed feature values are not exported as AFM attributes.`);
      }
      if (/\bcardinality\s+\[[^\]]+\]/.test(trimmed)) {
        warnings.push(`Line ${index + 1}: feature cardinality is not representable in the AFM relationship block.`);
      }
      if (/\{[^}]+\}/.test(trimmed)) {
        warnings.push(`Line ${index + 1}: UVL modifiers/attributes are not represented by the AFM tree writer.`);
      }
    });
  return Array.from(new Set(warnings));
}

/** Build a standards-compatible AFM text document. */
export function buildAfm(
  _modelName: string,
  nodes: AfmExportNode[],
  constraints: string[]
): string {
  if (nodes.length !== 1) throw new Error("AFM export requires exactly one root feature.");
  const names = createFeatureNames(nodes);
  const root = nodes[0];
  const relationshipBlock = renderRelationshipBlock(root, names);
  const constraintLines = constraints.map((source) => renderConstraint(
    parseBooleanExpression(source, "AFM export"),
    names
  ));

  return [
    "%Relationships",
    relationshipBlock,
    "",
    "%Attributes",
    "",
    "%Constraints",
    ...constraintLines.map((line) => `${line};`),
    "",
  ].join("\n");
}

export const buildAfmExport = buildAfm;
