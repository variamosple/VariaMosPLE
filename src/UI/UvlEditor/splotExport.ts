export type SplotExportNode = {
  name: string;
  relation: string;
  children: SplotExportNode[];
};

type Literal = { name: string; negated: boolean };
type Expression =
  | { kind: "literal"; literal: Literal }
  | { kind: "and" | "or" | "implies" | "equivalent" | "excludes"; left: Expression; right: Expression }
  | { kind: "not"; expression: Expression };

const GROUP_RELATIONS = new Set(["or", "alternative"]);

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createFeatureIds(nodes: SplotExportNode[]): Map<string, string> {
  const ids = new Map<string, string>();
  const usedIds = new Set<string>();

  const visit = (node: SplotExportNode) => {
    let baseId = node.name.replace(/[^A-Za-z0-9_]/g, "_");
    if (!baseId || !/^[A-Za-z_]/.test(baseId)) baseId = `f_${baseId}`;
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) id = `${baseId}_${suffix++}`;
    usedIds.add(id);
    if (!ids.has(node.name)) ids.set(node.name, id);
    node.children.forEach(visit);
  };

  nodes.forEach(visit);
  return ids;
}

function renderFeatureTree(nodes: SplotExportNode[], ids: Map<string, string>): string[] {
  const lines: string[] = [];

  const renderNode = (node: SplotExportNode, depth: number, marker: string) => {
    lines.push(`${"\t".repeat(depth)}${marker} ${escapeXml(node.name)} (${ids.get(node.name)})`);

    for (let index = 0; index < node.children.length;) {
      const child = node.children[index];
      if (GROUP_RELATIONS.has(child.relation)) {
        const relation = child.relation;
        const groupedChildren: SplotExportNode[] = [];
        while (index < node.children.length && node.children[index].relation === relation) {
          groupedChildren.push(node.children[index++]);
        }
        lines.push(`${"\t".repeat(depth + 1)}:g ${relation === "alternative" ? "[1,1]" : "[1,*]"}`);
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
  const tokens = expression.match(/<=>|=>|&&|\|\||[()!&|]|[A-Za-z_][\w.]*/g) ?? [];
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
    if (!/^[A-Za-z_][\w.]*$/.test(token)) throw new Error(`SPLOT export found unexpected token '${token}'.`);
    return { kind: "literal", literal: { name: token, negated: false } };
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

function renderConstraints(constraints: string[], ids: Map<string, string>): string[] {
  let constraintNumber = 1;
  const rendered: string[] = [];
  constraints.forEach((source) => {
    const expression = toNegationNormalForm(eliminateOperators(parseExpression(source)));
    toCnf(expression).forEach((clause) => {
      const literals = clause.map((literal) => {
        const id = ids.get(literal.name);
        if (!id) throw new Error(`SPLOT export cannot find feature '${literal.name}' used in a constraint.`);
        return `${literal.negated ? "~" : ""}${id}`;
      });
      rendered.push(`c${constraintNumber++}: ${literals.join(" or ")}`);
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
    '<?xml version="1.0" encoding="UTF-8"?>',
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
