export type SplotExportNode = {
  name: string;
  relation: string;
  children: SplotExportNode[];
  groupId?: string;
  groupCardinality?: {
    min: number;
    max: number | "*";
  };
};

type Literal = { name: string; negated: boolean };
type Expression =
  | { kind: "literal"; literal: Literal }
  | { kind: "and" | "or" | "implies" | "equivalent" | "excludes"; left: Expression; right: Expression }
  | { kind: "not"; expression: Expression };

const GROUP_RELATIONS = new Set(["or", "alternative", "cardinality"]);

type FeatureIds = {
  byNode: Map<SplotExportNode, string>;
  byName: Map<string, string>;
};

function stripBlockComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\r\n]/g, " "));
}

export function getSplotCompatibilityWarnings(source: string): string[] {
  const warnings: string[] = [];
  let section = "";

  stripBlockComments(source).split(/\r?\n/).forEach((raw, index) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("//")) return;

    const sectionMatch = trimmed.match(/^(namespace|include|imports|features|constraints)\b/);
    if (sectionMatch && raw.search(/\S/) === 0) {
      section = sectionMatch[1];
      if (section === "imports") {
        warnings.push(`Line ${index + 1}: imported UVL models are not embedded in a single SXFM file.`);
      }
      return;
    }
    if (section !== "features") return;

    const typeMatch = trimmed.match(/^(Integer|Real|String)\s+/);
    if (typeMatch) {
      warnings.push(
        `Line ${index + 1}: ${typeMatch[1]} feature '${trimmed}' will be exported as a Boolean SPLOT feature.`
      );
    }
    if (/\bcardinality\s+\[[^\]]+\]/.test(trimmed)) {
      warnings.push(`Line ${index + 1}: feature cardinality is not representable in SPLOT SXFM.`);
    }
    const attributes = trimmed.match(/\{([^}]*)\}/)?.[1].trim();
    if (attributes) {
      warnings.push(`Line ${index + 1}: UVL attributes/modifiers are not representable in SPLOT SXFM.`);
    }
  });

  return Array.from(new Set(warnings));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createFeatureIds(nodes: SplotExportNode[]): FeatureIds {
  const byNode = new Map<SplotExportNode, string>();
  const byName = new Map<string, string>();
  const usedIds = new Set<string>();

  const visit = (node: SplotExportNode) => {
    if (byName.has(node.name)) {
      throw new Error(`SPLOT SXFM requires unique feature names; '${node.name}' is duplicated.`);
    }
    let baseId = node.name.replace(/[^A-Za-z0-9_]/g, "_");
    if (!baseId || !/^[A-Za-z_]/.test(baseId)) baseId = `f_${baseId}`;
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) id = `${baseId}_${suffix++}`;
    usedIds.add(id);
    byNode.set(node, id);
    byName.set(node.name, id);
    node.children.forEach(visit);
  };

  nodes.forEach(visit);
  return { byNode, byName };
}

function resolveGroupCardinality(node: SplotExportNode, childCount: number) {
  const declared = node.groupCardinality;
  const min = declared?.min ?? 1;
  const rawMax = declared?.max ?? (node.relation === "alternative" ? 1 : childCount);
  const max = rawMax === "*" ? childCount : rawMax;

  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < min) {
    throw new Error(`SPLOT export found an invalid group cardinality [${min},${rawMax}].`);
  }
  if (min > childCount || max > childCount) {
    throw new Error(
      `SPLOT group [${min},${rawMax}] has only ${childCount} member(s); its bounds cannot exceed the group size.`
    );
  }
  return { min, max };
}

function renderFeatureTree(nodes: SplotExportNode[], ids: FeatureIds): string[] {
  const lines: string[] = [];

  const renderNode = (node: SplotExportNode, depth: number, marker: string) => {
    lines.push(`${"\t".repeat(depth)}${marker} ${escapeXml(node.name)} (${ids.byNode.get(node)})`);

    for (let index = 0; index < node.children.length;) {
      const child = node.children[index];
      if (GROUP_RELATIONS.has(child.relation)) {
        const groupId = child.groupId;
        const groupedChildren: SplotExportNode[] = [];
        while (
          index < node.children.length &&
          node.children[index].relation === child.relation &&
          node.children[index].groupId === groupId
        ) {
          groupedChildren.push(node.children[index++]);
        }
        const cardinality = resolveGroupCardinality(child, groupedChildren.length);
        lines.push(`${"\t".repeat(depth + 1)}:g [${cardinality.min},${cardinality.max}]`);
        groupedChildren.forEach((groupChild) => renderNode(groupChild, depth + 2, ":"));
      } else {
        renderNode(child, depth + 1, child.relation === "mandatory" ? ":m" : ":o");
        index++;
      }
    }
  };

  nodes.forEach((node) => renderNode(node, 0, ":r"));
  return lines;
}

function tokenize(expression: string): string[] {
  const tokens = expression.match(/<=>|=>|&&|\|\||[()!&|]|"[^"\r\n]+"|[A-Za-z_][\w.#§%?\\'äüöß;]*/g) ?? [];
  const compactInput = expression.replace(/\s+/g, "");
  const compactTokens = tokens.join("").replace(/\s+/g, "");
  if (compactInput !== compactTokens) {
    throw new Error(`SPLOT export cannot parse constraint '${expression}'.`);
  }
  return tokens;
}

function parseExpression(source: string): Expression {
  const tokens = tokenize(source);
  let cursor = 0;

  const parsePrimary = (): Expression => {
    const token = tokens[cursor++];
    if (!token) throw new Error(`SPLOT export found an incomplete constraint '${source}'.`);
    if (token === "(" ) {
      const expression = parseEquivalent();
      if (tokens[cursor++] !== ")") throw new Error(`SPLOT export found unmatched parentheses in '${source}'.`);
      return expression;
    }
    if (token === "!" || token.toLowerCase() === "not") {
      return { kind: "not", expression: parsePrimary() };
    }
    const isQuotedIdentifier = /^"[^"\r\n]+"$/.test(token);
    if (!isQuotedIdentifier && !/^[A-Za-z_][\w.#§%?\\'äüöß;]*$/.test(token)) {
      throw new Error(`SPLOT export found unexpected token '${token}'.`);
    }
    const name = isQuotedIdentifier ? token.slice(1, -1) : token;
    return { kind: "literal", literal: { name, negated: false } };
  };

  const parseAnd = (): Expression => {
    let left = parsePrimary();
    while (["&", "&&", "and"].includes((tokens[cursor] ?? "").toLowerCase())) {
      cursor++;
      left = { kind: "and", left, right: parsePrimary() };
    }
    return left;
  };

  const parseOr = (): Expression => {
    let left = parseAnd();
    while (["|", "||", "or"].includes((tokens[cursor] ?? "").toLowerCase())) {
      cursor++;
      left = { kind: "or", left, right: parseAnd() };
    }
    return left;
  };

  const parseImplies = (): Expression => {
    let left = parseOr();
    while (["=>", "implies", "requires", "excludes"].includes((tokens[cursor] ?? "").toLowerCase())) {
      const operator = tokens[cursor++].toLowerCase();
      const kind = operator === "excludes" ? "excludes" : "implies";
      left = { kind, left, right: parseOr() };
    }
    return left;
  };

  const parseEquivalent = (): Expression => {
    let left = parseImplies();
    while (tokens[cursor] === "<=>") {
      cursor++;
      left = { kind: "equivalent", left, right: parseImplies() };
    }
    return left;
  };

  const result = parseEquivalent();
  if (cursor !== tokens.length) throw new Error(`SPLOT export found unexpected token '${tokens[cursor]}'.`);
  return result;
}

function eliminateOperators(expression: Expression): Expression {
  if (expression.kind === "literal") return expression;
  if (expression.kind === "not") return { kind: "not", expression: eliminateOperators(expression.expression) };
  const left = eliminateOperators(expression.left);
  const right = eliminateOperators(expression.right);
  if (expression.kind === "implies") return { kind: "or", left: { kind: "not", expression: left }, right };
  if (expression.kind === "excludes") {
    return { kind: "or", left: { kind: "not", expression: left }, right: { kind: "not", expression: right } };
  }
  if (expression.kind === "equivalent") {
    return {
      kind: "and",
      left: { kind: "or", left: { kind: "not", expression: left }, right },
      right: { kind: "or", left: { kind: "not", expression: right }, right: left },
    };
  }
  return { kind: expression.kind, left, right };
}

function toNegationNormalForm(expression: Expression, negated = false): Expression {
  if (expression.kind === "literal") {
    return { kind: "literal", literal: { ...expression.literal, negated: expression.literal.negated !== negated } };
  }
  if (expression.kind === "not") return toNegationNormalForm(expression.expression, !negated);
  if (expression.kind !== "and" && expression.kind !== "or") throw new Error("Internal SPLOT conversion error.");
  const kind = negated ? (expression.kind === "and" ? "or" : "and") : expression.kind;
  return {
    kind,
    left: toNegationNormalForm(expression.left, negated),
    right: toNegationNormalForm(expression.right, negated),
  };
}

function toCnf(expression: Expression): Literal[][] {
  if (expression.kind === "literal") return [[expression.literal]];
  if (expression.kind !== "and" && expression.kind !== "or") throw new Error("Internal SPLOT CNF conversion error.");
  const left = toCnf(expression.left);
  const right = toCnf(expression.right);
  if (expression.kind === "and") return [...left, ...right];
  const distributed: Literal[][] = [];
  left.forEach((leftClause) => {
    right.forEach((rightClause) => distributed.push([...leftClause, ...rightClause]));
  });
  if (distributed.length > 1000) throw new Error("SPLOT export stopped because CNF expansion exceeds 1000 clauses.");
  return distributed;
}

function renderConstraints(constraints: string[], ids: FeatureIds): string[] {
  let constraintNumber = 1;
  const rendered: string[] = [];
  constraints.forEach((source) => {
    const expression = toNegationNormalForm(eliminateOperators(parseExpression(source)));
    toCnf(expression).forEach((clause) => {
      const literals = clause.map((literal) => {
        const id = ids.byName.get(literal.name);
        if (!id) throw new Error(`SPLOT export cannot find feature '${literal.name}' used in a constraint.`);
        return `${literal.negated ? "~" : ""}${id}`;
      });
      rendered.push(`\tC${constraintNumber++}: ${literals.join(" or ")}`);
    });
  });
  return rendered;
}

export function buildSplotSxfm(
  modelName: string,
  nodes: SplotExportNode[],
  constraints: string[]
): string {
  if (nodes.length !== 1) throw new Error("SPLOT SXFM requires exactly one root feature.");
  const ids = createFeatureIds(nodes);
  const featureTree = renderFeatureTree(nodes, ids);
  const renderedConstraints = renderConstraints(constraints, ids);

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    `<feature_model name="${escapeXml(modelName)}">`,
    "<meta>",
    '<data name="description">Exported from VariaMos PLE UVL Editor</data>',
    "</meta>",
    "<feature_tree>",
    ...featureTree,
    "</feature_tree>",
    "<constraints>",
    ...renderedConstraints,
    "</constraints>",
    "</feature_model>",
    "",
  ].join("\n");
}
