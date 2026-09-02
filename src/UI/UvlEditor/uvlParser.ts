/**
 * A self-contained UVL parser and semantic checker.
 *
 * The editor used to inspect UVL with regular expressions only.  This module
 * follows the structure of the official UVL grammar (namespace, language
 * levels, imports, features and constraints) and exposes a typed AST.  It is
 * intentionally dependency-free so the browser editor and the chatbot can
 * use the same parser without adding a runtime parser package.
 */

export type UvlSourceLocation = {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
};

export type UvlDiagnosticSeverity = "error" | "warning";

export type UvlDiagnostic = {
  code: string;
  message: string;
  severity: UvlDiagnosticSeverity;
  location: UvlSourceLocation;
};

export type UvlCardinality = {
  min: number;
  max: number | "*";
};

export type UvlReference = {
  name: string;
  parts: string[];
  location: UvlSourceLocation;
};

export type UvlLanguageLevel = {
  major: "Boolean" | "Arithmetic" | "Type" | string;
  minor?: string;
  wildcard: boolean;
  raw: string;
  location: UvlSourceLocation;
};

export type UvlImport = {
  namespace: UvlReference;
  alias?: UvlReference;
  location: UvlSourceLocation;
};

export type UvlAttributeValue = {
  kind: "boolean" | "integer" | "float" | "string" | "vector" | "attributes" | "unknown";
  value: boolean | number | string | UvlAttributeValue[] | UvlAttribute[] | null;
  raw: string;
  location: UvlSourceLocation;
};

export type UvlAttribute = {
  key: string;
  value?: UvlAttributeValue;
  constraint?: UvlExpression;
  constraints?: UvlExpression[];
  raw: string;
  location: UvlSourceLocation;
};

export type UvlExpression =
  | {
      kind: "reference";
      reference: UvlReference;
      location: UvlSourceLocation;
    }
  | {
      kind: "boolean";
      value: boolean;
      raw: string;
      location: UvlSourceLocation;
    }
  | {
      kind: "number";
      value: number;
      raw: string;
      location: UvlSourceLocation;
    }
  | {
      kind: "string";
      value: string;
      raw: string;
      location: UvlSourceLocation;
    }
  | {
      kind: "aggregate";
      function: "sum" | "avg" | "len" | "floor" | "ceil";
      arguments: UvlReference[];
      location: UvlSourceLocation;
    }
  | {
      kind: "unary";
      operator: "!" | "-";
      operand: UvlExpression;
      location: UvlSourceLocation;
    }
  | {
      kind: "binary";
      operator: "&" | "|" | "=>" | "<=>" | "==" | "!=" | "<" | ">" | "<=" | ">=" | "+" | "-" | "*" | "/";
      left: UvlExpression;
      right: UvlExpression;
      location: UvlSourceLocation;
    }
  | {
      kind: "parenthesized";
      expression: UvlExpression;
      location: UvlSourceLocation;
    };

export type UvlGroup = {
  kind: "mandatory" | "optional" | "or" | "alternative" | "cardinality";
  cardinality?: UvlCardinality;
  features: UvlFeature[];
  location: UvlSourceLocation;
};

export type UvlFeature = {
  name: string;
  reference: UvlReference;
  featureType?: "Boolean" | "Integer" | "Real" | "String";
  cardinality?: UvlCardinality;
  attributes: UvlAttribute[];
  attributeText: string;
  groups: UvlGroup[];
  location: UvlSourceLocation;
};

export type UvlConstraintLine = {
  raw: string;
  expression?: UvlExpression;
  location: UvlSourceLocation;
};

export type UvlDocument = {
  source: string;
  namespace?: UvlReference;
  includes: UvlLanguageLevel[];
  imports: UvlImport[];
  root?: UvlFeature;
  constraints: UvlConstraintLine[];
  diagnostics: UvlDiagnostic[];
};

export type UvlParseResult = {
  document: UvlDocument;
  diagnostics: UvlDiagnostic[];
  errors: UvlDiagnostic[];
  warnings: UvlDiagnostic[];
  valid: boolean;
};

type SourceLine = {
  text: string;
  trimmed: string;
  indent: number;
  line: number;
  firstColumn: number;
  mixedIndentation: boolean;
};

type ExpressionToken = {
  kind: "identifier" | "number" | "string" | "operator" | "open" | "close" | "comma" | "dot";
  value: string;
  start: number;
  end: number;
};

const LANGUAGE_LEVELS: Record<string, Set<string>> = {
  Boolean: new Set(["group-cardinality"]),
  Arithmetic: new Set(["aggregate-function", "feature-cardinality"]),
  Type: new Set(["numeric-constraints", "string-constraints"]),
};
const AGGREGATE_FUNCTIONS = new Set(["sum", "avg", "len", "floor", "ceil"]);
const BOOLEAN_OPERATORS = new Set(["&", "|", "=>", "<=>"]);
const COMPARISON_OPERATORS = new Set(["==", "!=", "<", ">", "<=", ">="]);
const ARITHMETIC_OPERATORS = new Set(["+", "-", "*", "/"]);

function location(line: number, column: number, length = 1): UvlSourceLocation {
  return { line, column, endLine: line, endColumn: column + Math.max(1, length) };
}

function mergeLocation(left: UvlSourceLocation, right: UvlSourceLocation): UvlSourceLocation {
  return {
    line: left.line,
    column: left.column,
    endLine: right.endLine,
    endColumn: right.endColumn,
  };
}

function diagnostic(
  diagnostics: UvlDiagnostic[],
  code: string,
  message: string,
  sourceLocation: UvlSourceLocation,
  severity: UvlDiagnosticSeverity = "error"
): void {
  diagnostics.push({ code, message, severity, location: sourceLocation });
}

function stripComments(source: string): string {
  let result = "";
  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  let inBlockComment = false;

  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    const next = source[index + 1];

    if (inBlockComment) {
      if (character === "*" && next === "/") {
        result += "  ";
        index++;
        inBlockComment = false;
      } else {
        result += character === "\n" || character === "\r" ? character : " ";
      }
      continue;
    }

    if (!inSingle && !inDouble && character === "/" && next === "*") {
      result += "  ";
      index++;
      inBlockComment = true;
      continue;
    }

    if (!inSingle && !inDouble && character === "/" && next === "/") {
      result += "  ";
      index++;
      while (index + 1 < source.length && source[index + 1] !== "\n" && source[index + 1] !== "\r") {
        index++;
        result += " ";
      }
      continue;
    }

    if (character === "\\" && (inSingle || inDouble) && !escaped) {
      escaped = true;
      result += character;
      continue;
    }
    if (character === "'" && !inDouble && !escaped) inSingle = !inSingle;
    if (character === '"' && !inSingle && !escaped) inDouble = !inDouble;
    result += character;
    escaped = false;
  }

  return result;
}

function sourceLines(source: string, diagnostics: UvlDiagnostic[]): SourceLine[] {
  return stripComments(source).split(/\r?\n/).map((raw, index) => {
    let cursor = 0;
    let indent = 0;
    let sawSpace = false;
    let sawTab = false;
    while (cursor < raw.length && (raw[cursor] === " " || raw[cursor] === "\t")) {
      if (raw[cursor] === " ") {
        sawSpace = true;
        indent++;
      } else {
        sawTab = true;
        indent += 4;
      }
      cursor++;
    }
    const trimmed = raw.slice(cursor).trim();
    const currentLine = {
      text: raw,
      trimmed,
      indent,
      line: index + 1,
      firstColumn: cursor + 1,
      mixedIndentation: sawSpace && sawTab,
    };
    if (trimmed && currentLine.mixedIndentation) {
      diagnostic(
        diagnostics,
        "INDENTATION_MIXED",
        "Do not mix tabs and spaces in UVL indentation.",
        location(index + 1, 1, cursor + 1)
      );
    }
    return currentLine;
  }).filter((line) => !!line.trimmed);
}

function firstToken(text: string): string {
  return text.match(/^[A-Za-z_][A-Za-z0-9_-]*/)?.[0] ?? "";
}

function readQuoted(text: string, start: number, quote: string): { value: string; end: number } | null {
  if (text[start] !== quote) return null;
  let escaped = false;
  for (let index = start + 1; index < text.length; index++) {
    const character = text[index];
    if (character === quote && !escaped) return { value: text.slice(start + 1, index), end: index + 1 };
    escaped = character === "\\" && !escaped;
    if (character !== "\\") escaped = false;
  }
  return null;
}

function isIdentifierStart(character: string | undefined): boolean {
  return !!character && /[A-Za-z]/.test(character);
}

function isIdentifierPart(character: string | undefined): boolean {
  return !!character && /[A-Za-z0-9_#§%?\\'äüöß;]/.test(character);
}

function readReference(text: string, start = 0): { name: string; parts: string[]; end: number } | null {
  let cursor = start;
  const parts: string[] = [];
  while (cursor < text.length) {
    let part = "";
    if (text[cursor] === '"') {
      const quoted = readQuoted(text, cursor, '"');
      // ID_NOT_STRICT in the UVL grammar cannot be empty or contain a dot;
      // dots delimit qualified references, so accepting them inside quotes
      // would make the AST ambiguous.
      if (!quoted || !quoted.value || quoted.value.includes(".")) return null;
      part = quoted.value;
      cursor = quoted.end;
    } else {
      if (!isIdentifierStart(text[cursor])) return null;
      const partStart = cursor++;
      while (cursor < text.length && isIdentifierPart(text[cursor])) cursor++;
      part = text.slice(partStart, cursor);
    }
    parts.push(part);
    if (text[cursor] !== ".") break;
    cursor++;
  }
  if (!parts.length) return null;
  return { name: parts.join("."), parts, end: cursor };
}

function cardinalityFromText(text: string): UvlCardinality | null {
  const compact = text.replace(/\s+/g, "");
  const match = compact.match(/^\[(\d+)(?:\.\.(\d+|\*))?\]$/);
  if (!match) return null;
  const min = Number(match[1]);
  const max = match[2] == null ? min : match[2] === "*" ? "*" : Number(match[2]);
  if (!Number.isInteger(min) || min < 0) return null;
  if (typeof max === "number" && (!Number.isInteger(max) || max < min)) return null;
  return { min, max };
}

function findBalancedEnd(text: string, start: number, open: string, close: string): number {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  for (let index = start; index < text.length; index++) {
    const character = text[index];
    if (character === "\\" && (inSingle || inDouble) && !escaped) {
      escaped = true;
      continue;
    }
    if (character === "'" && !inDouble && !escaped) inSingle = !inSingle;
    if (character === '"' && !inSingle && !escaped) inDouble = !inDouble;
    escaped = false;
    if (inSingle || inDouble) continue;
    if (character === open) depth++;
    if (character === close) {
      depth--;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function splitTopLevel(text: string, separator: string): Array<{ text: string; start: number }> {
  const result: Array<{ text: string; start: number }> = [];
  let start = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;
  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === "\\" && (inSingle || inDouble) && !escaped) {
      escaped = true;
      continue;
    }
    if (character === "'" && !inDouble && !escaped) inSingle = !inSingle;
    if (character === '"' && !inSingle && !escaped) inDouble = !inDouble;
    escaped = false;
    if (inSingle || inDouble) continue;
    if (character === "{") braceDepth++;
    else if (character === "}") braceDepth--;
    else if (character === "[") bracketDepth++;
    else if (character === "]") bracketDepth--;
    else if (character === "(") parenDepth++;
    else if (character === ")") parenDepth--;
    else if (character === separator && braceDepth === 0 && bracketDepth === 0 && parenDepth === 0) {
      result.push({ text: text.slice(start, index), start });
      start = index + 1;
    }
  }
  result.push({ text: text.slice(start), start });
  return result;
}

function parseReferenceAt(
  text: string,
  start: number,
  line: number,
  column: number,
  diagnostics: UvlDiagnostic[]
): UvlReference | null {
  const parsed = readReference(text, start);
  if (!parsed) {
    diagnostic(diagnostics, "REFERENCE_INVALID", "Expected a valid UVL reference.", location(line, column));
    return null;
  }
  return {
    name: parsed.name,
    parts: parsed.parts,
    location: location(line, column + start, parsed.end - start),
  };
}

function tokenizeExpression(text: string, diagnostics: UvlDiagnostic[], line: number, baseColumn: number): ExpressionToken[] {
  const tokens: ExpressionToken[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    if (/\s/.test(text[cursor])) {
      cursor++;
      continue;
    }
    const start = cursor;
    const three = text.slice(cursor, cursor + 3);
    const two = text.slice(cursor, cursor + 2);
    if (three === "<=>") {
      tokens.push({ kind: "operator", value: three, start, end: cursor + 3 });
      cursor += 3;
      continue;
    }
    if (["=>", "==", "!=", "<=", ">="].includes(two)) {
      tokens.push({ kind: "operator", value: two, start, end: cursor + 2 });
      cursor += 2;
      continue;
    }
    const character = text[cursor];
    if (["&", "|", "!", "<", ">", "+", "-", "*", "/"].includes(character)) {
      tokens.push({ kind: "operator", value: character, start, end: cursor + 1 });
      cursor++;
      continue;
    }
    if (character === "(") {
      tokens.push({ kind: "open", value: character, start, end: cursor + 1 });
      cursor++;
      continue;
    }
    if (character === ")") {
      tokens.push({ kind: "close", value: character, start, end: cursor + 1 });
      cursor++;
      continue;
    }
    if (character === ",") {
      tokens.push({ kind: "comma", value: character, start, end: cursor + 1 });
      cursor++;
      continue;
    }
    if (character === ".") {
      tokens.push({ kind: "dot", value: character, start, end: cursor + 1 });
      cursor++;
      continue;
    }
    if (character === "'" || character === '"') {
      const quoted = readQuoted(text, cursor, character);
      if (!quoted) {
        diagnostic(diagnostics, "STRING_UNTERMINATED", "The string literal is not closed.", location(line, baseColumn + cursor));
        break;
      }
      if (character === "'" && !quoted.value) {
        diagnostic(diagnostics, "STRING_EMPTY", "UVL string literals must contain at least one character.", location(line, baseColumn + cursor, quoted.end - cursor));
      }
      tokens.push({ kind: character === "'" ? "string" : "identifier", value: quoted.value, start, end: quoted.end });
      cursor = quoted.end;
      continue;
    }
    if (/[0-9]/.test(character) || (character === "." && /[0-9]/.test(text[cursor + 1] || ""))) {
      const numeric = text.slice(cursor).match(/^(?:(?:0|[1-9][0-9]*)(?:\.[0-9]+)?|\.[0-9]+)/);
      if (numeric) {
        tokens.push({ kind: "number", value: numeric[0], start, end: cursor + numeric[0].length });
        cursor += numeric[0].length;
        continue;
      }
    }
    if (isIdentifierStart(character)) {
      cursor++;
      while (cursor < text.length && isIdentifierPart(text[cursor])) cursor++;
      tokens.push({ kind: "identifier", value: text.slice(start, cursor), start, end: cursor });
      continue;
    }
    diagnostic(
      diagnostics,
      "EXPRESSION_TOKEN_INVALID",
      `Unexpected token '${character}' in the constraint expression.`,
      location(line, baseColumn + cursor)
    );
    cursor++;
  }
  return tokens;
}

function parseExpression(
  text: string,
  diagnostics: UvlDiagnostic[],
  line: number,
  baseColumn: number
): UvlExpression | undefined {
  const tokens = tokenizeExpression(text, diagnostics, line, baseColumn);
  let cursor = 0;
  const tokenLocation = (token: ExpressionToken | undefined): UvlSourceLocation =>
    token ? location(line, baseColumn + token.start, token.end - token.start) : location(line, baseColumn + text.length);

  const reference = (): UvlReference | null => {
    const first = tokens[cursor];
    if (!first || first.kind !== "identifier") return null;
    const parts = [first.value];
    const start = first.start;
    cursor++;
    while (tokens[cursor]?.kind === "dot") {
      cursor++;
      const next = tokens[cursor];
      if (!next || next.kind !== "identifier") {
        diagnostic(diagnostics, "REFERENCE_INVALID", "A reference segment must follow '.'.", tokenLocation(next || tokens[cursor - 1]));
        break;
      }
      parts.push(next.value);
      cursor++;
    }
    return {
      name: parts.join("."),
      parts,
      location: location(line, baseColumn + start, (tokens[cursor - 1]?.end ?? first.end) - start),
    };
  };

  const primary = (): UvlExpression | undefined => {
    const token = tokens[cursor];
    if (!token) return undefined;
    if (token.kind === "open") {
      cursor++;
      const inner = equivalent();
      if (tokens[cursor]?.kind !== "close") {
        diagnostic(diagnostics, "PARENTHESIS_UNMATCHED", "Opening parenthesis is not closed.", tokenLocation(token));
      } else {
        const close = tokens[cursor++];
        if (inner) return { kind: "parenthesized", expression: inner, location: mergeLocation(tokenLocation(token), tokenLocation(close)) };
      }
      return inner;
    }
    if (token.kind === "number") {
      cursor++;
      return { kind: "number", value: Number(token.value), raw: token.value, location: tokenLocation(token) };
    }
    if (token.kind === "string") {
      cursor++;
      return { kind: "string", value: token.value, raw: `'${token.value}'`, location: tokenLocation(token) };
    }
    if (token.kind !== "identifier") {
      diagnostic(diagnostics, "EXPRESSION_OPERAND_MISSING", "Expected a feature reference or literal.", tokenLocation(token));
      cursor++;
      return undefined;
    }
    if (token.value === "true" || token.value === "false") {
      cursor++;
      return { kind: "boolean", value: token.value === "true", raw: token.value, location: tokenLocation(token) };
    }
    if (AGGREGATE_FUNCTIONS.has(token.value) && tokens[cursor + 1]?.kind === "open") {
      const functionToken = token;
      cursor += 2;
      const args: UvlReference[] = [];
      const firstReference = reference();
      if (firstReference) args.push(firstReference);
      if (tokens[cursor]?.kind === "comma") {
        cursor++;
        const secondReference = reference();
        if (secondReference) args.push(secondReference);
      }
      if (tokens[cursor]?.kind === "close") cursor++;
      else diagnostic(diagnostics, "PARENTHESIS_UNMATCHED", `Function '${functionToken.value}' is not closed.`, tokenLocation(functionToken));
      const fn = token.value as "sum" | "avg" | "len" | "floor" | "ceil";
      const expected = fn === "sum" || fn === "avg" ? 1 : 1;
      if (args.length < expected || args.length > (fn === "sum" || fn === "avg" ? 2 : 1)) {
        diagnostic(diagnostics, "AGGREGATE_ARGUMENTS_INVALID", `Function '${functionToken.value}' has an invalid number of arguments.`, tokenLocation(functionToken));
      }
      return { kind: "aggregate", function: fn, arguments: args, location: tokenLocation(functionToken) };
    }
    const parsedReference = reference();
    if (!parsedReference) return undefined;
    return { kind: "reference", reference: parsedReference, location: parsedReference.location };
  };

  const unary = (): UvlExpression | undefined => {
    const token = tokens[cursor];
    if (token?.kind === "operator" && (token.value === "!" || token.value === "-")) {
      cursor++;
      const operand = unary();
      if (!operand) {
        diagnostic(diagnostics, "EXPRESSION_OPERAND_MISSING", `Operator '${token.value}' needs an operand.`, tokenLocation(token));
        return undefined;
      }
      return { kind: "unary", operator: token.value as "!" | "-", operand, location: mergeLocation(tokenLocation(token), operand.location) };
    }
    return primary();
  };

  const multiplicative = (): UvlExpression | undefined => {
    let left = unary();
    while (ARITHMETIC_OPERATORS.has(tokens[cursor]?.value || "") && ["*", "/"].includes(tokens[cursor]?.value || "")) {
      const operator = tokens[cursor++];
      const right = unary();
      if (!left || !right) break;
      left = { kind: "binary", operator: operator.value as Extract<UvlExpression, { kind: "binary" }>["operator"], left, right, location: mergeLocation(left.location, right.location) };
    }
    return left;
  };

  const additive = (): UvlExpression | undefined => {
    let left = multiplicative();
    while (["+", "-"].includes(tokens[cursor]?.value || "")) {
      const operator = tokens[cursor++];
      const right = multiplicative();
      if (!left || !right) break;
      left = { kind: "binary", operator: operator.value as Extract<UvlExpression, { kind: "binary" }>["operator"], left, right, location: mergeLocation(left.location, right.location) };
    }
    return left;
  };

  const comparison = (): UvlExpression | undefined => {
    let left = additive();
    if (COMPARISON_OPERATORS.has(tokens[cursor]?.value || "")) {
      const operator = tokens[cursor++];
      const right = additive();
      if (left && right) left = { kind: "binary", operator: operator.value as Extract<UvlExpression, { kind: "binary" }>["operator"], left, right, location: mergeLocation(left.location, right.location) };
    }
    return left;
  };

  const and = (): UvlExpression | undefined => {
    let left = comparison();
    while (tokens[cursor]?.value === "&") {
      cursor++;
      const right = comparison();
      if (!left || !right) break;
      left = { kind: "binary", operator: "&", left, right, location: mergeLocation(left.location, right.location) };
    }
    return left;
  };

  const or = (): UvlExpression | undefined => {
    let left = and();
    while (tokens[cursor]?.value === "|") {
      cursor++;
      const right = and();
      if (!left || !right) break;
      left = { kind: "binary", operator: "|", left, right, location: mergeLocation(left.location, right.location) };
    }
    return left;
  };

  const implication = (): UvlExpression | undefined => {
    const left = or();
    if (tokens[cursor]?.value === "=>") {
      cursor++;
      const right = implication();
      if (left && right) return { kind: "binary", operator: "=>", left, right, location: mergeLocation(left.location, right.location) };
    }
    return left;
  };

  const equivalent = (): UvlExpression | undefined => {
    let left = implication();
    while (tokens[cursor]?.value === "<=>") {
      cursor++;
      const right = implication();
      if (!left || !right) break;
      left = { kind: "binary", operator: "<=>", left, right, location: mergeLocation(left.location, right.location) };
    }
    return left;
  };

  const result = equivalent();
  if (!result && text.trim()) {
    diagnostic(diagnostics, "CONSTRAINT_EMPTY", "The constraint expression is empty or incomplete.", location(line, baseColumn, Math.max(1, text.length)));
  }
  if (cursor < tokens.length) {
    diagnostic(diagnostics, "EXPRESSION_TRAILING_TOKEN", `Unexpected token '${tokens[cursor].value}' after the expression.`, tokenLocation(tokens[cursor]));
  }
  return result;
}

function valueLocation(line: number, column: number, raw: string): UvlSourceLocation {
  return location(line, column, raw.length);
}

function parseAttributeValue(
  raw: string,
  line: number,
  column: number,
  diagnostics: UvlDiagnostic[]
): UvlAttributeValue | undefined {
  const text = raw.trim();
  const offset = raw.indexOf(text);
  const valueColumn = column + Math.max(0, offset);
  if (!text) return undefined;
  if (text === "true" || text === "false") {
    return { kind: "boolean", value: text === "true", raw: text, location: valueLocation(line, valueColumn, text) };
  }
  if (/^(?:0|[1-9][0-9]*)$/.test(text)) {
    return { kind: "integer", value: Number(text), raw: text, location: valueLocation(line, valueColumn, text) };
  }
  if (/^-?(?:(?:0|[1-9][0-9]*)\.[0-9]+|\.[0-9]+)$/.test(text)) {
    return { kind: "float", value: Number(text), raw: text, location: valueLocation(line, valueColumn, text) };
  }
  if (/^-[1-9][0-9]*$/.test(text)) {
    return { kind: "integer", value: Number(text), raw: text, location: valueLocation(line, valueColumn, text) };
  }
  if (text.startsWith("'") && text.endsWith("'")) {
    if (text.length === 2) diagnostic(diagnostics, "STRING_EMPTY", "UVL string literals must contain at least one character.", valueLocation(line, valueColumn, text));
    return { kind: "string", value: text.slice(1, -1), raw: text, location: valueLocation(line, valueColumn, text) };
  }
  if (text.startsWith("{") && text.endsWith("}")) {
    const inner = text.slice(1, -1);
    const attributes = parseAttributes(inner, line, valueColumn + 1, diagnostics);
    return { kind: "attributes", value: attributes, raw: text, location: valueLocation(line, valueColumn, text) };
  }
  if (text.startsWith("[") && text.endsWith("]")) {
    const values: UvlAttributeValue[] = [];
    splitTopLevel(text.slice(1, -1), ",").forEach((part) => {
      if (!part.text.trim()) return;
      const parsed = parseAttributeValue(part.text, line, valueColumn + 1 + part.start, diagnostics);
      if (parsed) values.push(parsed);
    });
    return { kind: "vector", value: values, raw: text, location: valueLocation(line, valueColumn, text) };
  }
  diagnostic(diagnostics, "ATTRIBUTE_VALUE_INVALID", `Attribute value '${text}' is not a valid UVL value.`, valueLocation(line, valueColumn, text));
  return { kind: "unknown", value: null, raw: text, location: valueLocation(line, valueColumn, text) };
}

function parseAttributes(raw: string, line: number, column: number, diagnostics: UvlDiagnostic[]): UvlAttribute[] {
  const attributes: UvlAttribute[] = [];
  splitTopLevel(raw, ",").forEach((part) => {
    const fragment = part.text.trim();
    if (!fragment) {
      diagnostic(diagnostics, "ATTRIBUTE_EMPTY", "Empty attribute entries are not allowed.", location(line, column + part.start));
      return;
    }
    const keyMatch = fragment.match(/^("[^"]+"|[A-Za-z][A-Za-z0-9_#§%?\\'äüöß;]*)/);
    if (!keyMatch) {
      diagnostic(diagnostics, "ATTRIBUTE_KEY_INVALID", "Attribute keys must be UVL identifiers.", location(line, column + part.start));
      return;
    }
    const rawKey = keyMatch[1];
    const key = rawKey.startsWith('"') ? rawKey.slice(1, -1) : rawKey;
    if (rawKey.startsWith('"') && (!key || key.includes("."))) {
      diagnostic(diagnostics, "ATTRIBUTE_KEY_INVALID", "Quoted attribute keys cannot be empty or contain '.'.", location(line, column + part.start, rawKey.length));
      return;
    }
    const remainder = fragment.slice(rawKey.length).trim();
    const attrColumn = column + part.start + Math.max(0, part.text.indexOf(fragment));
    const attrLocation = valueLocation(line, attrColumn, fragment);
    if (key.toLowerCase() === "constraint") {
      if (!remainder) diagnostic(diagnostics, "ATTRIBUTE_CONSTRAINT_EMPTY", "A constraint attribute requires an expression.", attrLocation);
      const expressionColumn = attrColumn + fragment.indexOf(remainder);
      const expression = parseExpression(remainder, diagnostics, line, expressionColumn);
      attributes.push({ key, constraint: expression, raw: fragment, location: attrLocation });
      return;
    }
    if (key.toLowerCase() === "constraints") {
      if (!remainder.startsWith("[") || !remainder.endsWith("]")) {
        diagnostic(diagnostics, "ATTRIBUTE_CONSTRAINTS_INVALID", "The constraints attribute must contain a bracketed list.", attrLocation);
        attributes.push({ key, raw: fragment, location: attrLocation });
        return;
      }
      const expressions: UvlExpression[] = [];
      const listContent = remainder.slice(1, -1);
      splitTopLevel(listContent, ",").forEach((expressionPart) => {
        if (!expressionPart.text.trim()) {
          if (listContent.trim()) diagnostic(diagnostics, "ATTRIBUTE_CONSTRAINT_EMPTY", "Constraint lists cannot contain empty entries.", location(line, attrColumn + fragment.indexOf(remainder) + 1 + expressionPart.start));
          return;
        }
        const expression = parseExpression(
          expressionPart.text,
          diagnostics,
          line,
          attrColumn + fragment.indexOf(remainder) + 1 + expressionPart.start
        );
        if (expression) expressions.push(expression);
      });
      attributes.push({ key, constraints: expressions, raw: fragment, location: attrLocation });
      return;
    }
    const parsedValue = remainder ? parseAttributeValue(remainder, line, attrColumn + fragment.indexOf(remainder), diagnostics) : undefined;
    attributes.push({ key, value: parsedValue, raw: fragment, location: attrLocation });
  });
  return attributes;
}

function parseFeatureDeclaration(line: SourceLine, diagnostics: UvlDiagnostic[]): UvlFeature | null {
  const text = line.trimmed;
  let cursor = 0;
  let featureType: UvlFeature["featureType"];
  const typeMatch = text.match(/^(Boolean|Integer|Real|String)(?=\s)/);
  if (typeMatch) {
    featureType = typeMatch[1] as UvlFeature["featureType"];
    cursor = typeMatch[0].length;
    while (/\s/.test(text[cursor] || "")) cursor++;
  }
  const parsedReference = readReference(text, cursor);
  if (!parsedReference) {
    diagnostic(diagnostics, "FEATURE_DECLARATION_INVALID", "Expected a feature reference.", location(line.line, line.firstColumn));
    return null;
  }
  const reference: UvlReference = {
    name: parsedReference.name,
    parts: parsedReference.parts,
    location: location(line.line, line.firstColumn + cursor, parsedReference.end - cursor),
  };
  cursor = parsedReference.end;
  while (/\s/.test(text[cursor] || "")) cursor++;

  let featureCardinality: UvlCardinality | undefined;
  if (text.slice(cursor).startsWith("cardinality")) {
    const keywordEnd = cursor + "cardinality".length;
    if (text[keywordEnd] && !/\s/.test(text[keywordEnd])) {
      diagnostic(diagnostics, "CARDINALITY_KEYWORD_INVALID", "The cardinality keyword must be followed by whitespace.", location(line.line, line.firstColumn + cursor, "cardinality".length));
    }
    cursor = keywordEnd;
    while (/\s/.test(text[cursor] || "")) cursor++;
    const cardinalityMatch = text.slice(cursor).match(/^\[[^\]]+\]/)?.[0];
    if (!cardinalityMatch) {
      diagnostic(diagnostics, "CARDINALITY_INVALID", "Expected a cardinality such as [1..*] after 'cardinality'.", location(line.line, line.firstColumn + cursor));
    } else {
      featureCardinality = cardinalityFromText(cardinalityMatch);
      if (!featureCardinality) diagnostic(diagnostics, "CARDINALITY_INVALID", `Invalid feature cardinality '${cardinalityMatch}'.`, location(line.line, line.firstColumn + cursor, cardinalityMatch.length));
      cursor += cardinalityMatch.length;
    }
    while (/\s/.test(text[cursor] || "")) cursor++;
  }

  let attributes: UvlAttribute[] = [];
  let attributeText = "";
  if (text[cursor] === "{") {
    const end = findBalancedEnd(text, cursor, "{", "}");
    if (end < 0) {
      diagnostic(diagnostics, "ATTRIBUTE_BRACE_UNMATCHED", "Feature attributes are not closed.", location(line.line, line.firstColumn + cursor));
    } else {
      attributeText = text.slice(cursor, end + 1);
      attributes = parseAttributes(text.slice(cursor + 1, end), line.line, line.firstColumn + cursor + 1, diagnostics);
      cursor = end + 1;
    }
  }
  while (/\s/.test(text[cursor] || "")) cursor++;
  if (cursor < text.length) {
    diagnostic(diagnostics, "FEATURE_TRAILING_CONTENT", `Unexpected content after feature '${reference.name}'.`, location(line.line, line.firstColumn + cursor, text.length - cursor));
  }
  return {
    name: reference.name,
    reference,
    featureType,
    cardinality: featureCardinality,
    attributes,
    attributeText,
    groups: [],
    location: location(line.line, line.firstColumn, text.length),
  };
}

function parseLanguageLevel(line: SourceLine, diagnostics: UvlDiagnostic[]): UvlLanguageLevel | null {
  const raw = line.trimmed;
  const match = raw.match(/^([A-Za-z]+)(?:\.([A-Za-z-]+|\*))?$/);
  if (!match) {
    diagnostic(diagnostics, "LANGUAGE_LEVEL_INVALID", `Invalid UVL language level '${raw}'.`, location(line.line, line.firstColumn, raw.length));
    return null;
  }
  const major = match[1];
  const minor = match[2] && match[2] !== "*" ? match[2] : undefined;
  const wildcard = match[2] === "*";
  if (!Object.prototype.hasOwnProperty.call(LANGUAGE_LEVELS, major)) {
    diagnostic(diagnostics, "LANGUAGE_LEVEL_UNKNOWN", `Unknown UVL language level '${major}'.`, location(line.line, line.firstColumn, major.length));
  } else if (minor && !LANGUAGE_LEVELS[major].has(minor)) {
    diagnostic(diagnostics, "LANGUAGE_LEVEL_MINOR_UNKNOWN", `Unknown '${major}' language-level extension '${minor}'.`, location(line.line, line.firstColumn, raw.length));
  }
  return { major, minor, wildcard, raw, location: location(line.line, line.firstColumn, raw.length) };
}

function parseExpressionLine(line: SourceLine, diagnostics: UvlDiagnostic[]): UvlConstraintLine {
  const start = line.firstColumn;
  const expression = parseExpression(line.trimmed, diagnostics, line.line, start);
  return { raw: line.trimmed, expression, location: location(line.line, start, line.trimmed.length) };
}

function parseFeatureTree(lines: SourceLine[], start: number, diagnostics: UvlDiagnostic[]): { root?: UvlFeature; next: number } {
  if (start >= lines.length) return { next: start };
  const rootIndent = lines[start].indent;
  const rootLine = lines[start];
  const rootKeyword = rootLine.trimmed;
  if (["mandatory", "optional", "or", "alternative"].includes(rootKeyword) || cardinalityFromText(rootLine.trimmed)) {
    diagnostic(diagnostics, "ROOT_DECLARATION_INVALID", "The features section must start with a feature declaration, not a group header.", location(rootLine.line, rootLine.firstColumn, rootLine.trimmed.length));
    let next = start + 1;
    while (next < lines.length && lines[next].indent > rootIndent) next++;
    return { next };
  }
  const root = parseFeatureDeclaration(rootLine, diagnostics);
  let index = start + 1;
  if (!root) {
    while (index < lines.length && lines[index].indent > rootIndent) index++;
    return { next: index };
  }

  const parseGroups = (feature: UvlFeature, featureIndent: number): void => {
    while (index < lines.length && lines[index].indent > featureIndent) {
      const groupLine = lines[index];
      const groupIndent = groupLine.indent;
      const groupKeyword = groupLine.trimmed;
      const cardinality = cardinalityFromText(groupKeyword);
      const lower = groupKeyword;
      const isKeyword = ["mandatory", "optional", "or", "alternative"].includes(lower);
      if (!isKeyword && !cardinality) {
        // UVL examples in the wild also allow a feature declaration directly
        // below a feature (the shorthand means an optional child).  Model it
        // as an implicit optional group so the AST and graph keep one
        // consistent parent/relationship representation.
        const directFeature = parseFeatureDeclaration(groupLine, diagnostics);
        if (directFeature) {
          const implicitGroup: UvlGroup = {
            kind: "optional",
            features: [directFeature],
            location: location(groupLine.line, groupLine.firstColumn, groupLine.trimmed.length),
          };
          index++;
          parseGroups(directFeature, groupLine.indent);
          feature.groups.push(implicitGroup);
          continue;
        }
        diagnostic(diagnostics, "GROUP_INVALID", `Expected a UVL group under feature '${feature.name}'.`, location(groupLine.line, groupLine.firstColumn, groupLine.trimmed.length));
        index++;
        continue;
      }
      const group: UvlGroup = {
        kind: cardinality ? "cardinality" : lower as UvlGroup["kind"],
        cardinality: cardinality || (lower === "alternative" ? { min: 1, max: 1 } : lower === "or" ? { min: 1, max: "*" } : undefined),
        features: [],
        location: location(groupLine.line, groupLine.firstColumn, groupLine.trimmed.length),
      };
      index++;
      if (index >= lines.length || lines[index].indent <= groupIndent) {
        diagnostic(diagnostics, "GROUP_EMPTY", `Group '${groupKeyword}' must contain at least one feature.`, group.location);
        feature.groups.push(group);
        continue;
      }
      const childIndent = lines[index].indent;
      while (index < lines.length && lines[index].indent > groupIndent) {
        if (lines[index].indent !== childIndent) {
          diagnostic(diagnostics, "FEATURE_INDENT_INVALID", "Features in the same group must use the same indentation.", location(lines[index].line, lines[index].firstColumn));
          if (lines[index].indent < childIndent) break;
        }
        const child = parseFeatureDeclaration(lines[index], diagnostics);
        const childFeatureLine = lines[index];
        index++;
        if (!child) {
          while (index < lines.length && lines[index].indent > childFeatureLine.indent) index++;
          continue;
        }
        group.features.push(child);
        parseGroups(child, childFeatureLine.indent);
      }
      feature.groups.push(group);
    }
  };

  parseGroups(root, rootIndent);
  return { root, next: index };
}

function parseDocument(source: string): UvlDocument {
  const diagnostics: UvlDiagnostic[] = [];
  const lines = sourceLines(source, diagnostics);
  const document: UvlDocument = { source, includes: [], imports: [], constraints: [], diagnostics };
  const sectionOrder: Record<string, number> = { namespace: 0, include: 1, imports: 2, features: 3, constraints: 4 };
  let currentOrder = -1;
  let index = 0;
  const seenSections = new Set<string>();

  while (index < lines.length) {
    const line = lines[index];
    if (line.indent !== 0) {
      diagnostic(diagnostics, "TOP_LEVEL_INDENT_INVALID", "Top-level UVL sections must not be indented.", location(line.line, line.firstColumn, line.trimmed.length));
      index++;
      continue;
    }
    const section = firstToken(line.trimmed).toLowerCase();
    if (!(section in sectionOrder)) {
      diagnostic(diagnostics, "SECTION_UNKNOWN", `Unknown top-level section '${firstToken(line.trimmed)}'.`, location(line.line, line.firstColumn, line.trimmed.length));
      index++;
      continue;
    }
    if (seenSections.has(section)) diagnostic(diagnostics, "SECTION_DUPLICATE", `The '${section}' section is declared more than once.`, location(line.line, line.firstColumn, section.length));
    seenSections.add(section);
    if (sectionOrder[section] < currentOrder) diagnostic(diagnostics, "SECTION_ORDER_INVALID", `The '${section}' section is out of order.`, location(line.line, line.firstColumn, section.length));
    currentOrder = Math.max(currentOrder, sectionOrder[section]);

    if (section === "namespace") {
      const remainder = line.trimmed.slice(firstToken(line.trimmed).length).trim();
      const parsed = parseReferenceAt(remainder, 0, line.line, line.firstColumn + line.trimmed.indexOf(remainder), diagnostics);
      if (parsed && remainder.slice(parsed.location.endColumn - (line.firstColumn + line.trimmed.indexOf(remainder))).trim()) {
        diagnostic(diagnostics, "NAMESPACE_TRAILING_CONTENT", "Unexpected content after the namespace reference.", location(line.line, line.firstColumn, line.trimmed.length));
      }
      document.namespace = parsed || undefined;
      index++;
      continue;
    }

    if (section === "include" || section === "imports") {
      if (line.trimmed !== section) diagnostic(diagnostics, "SECTION_TRAILING_CONTENT", `The ${section} section header cannot have trailing content.`, location(line.line, line.firstColumn, line.trimmed.length));
      const expectedIndent = lines[index + 1]?.indent;
      index++;
      let count = 0;
      while (index < lines.length && lines[index].indent > 0) {
        const child = lines[index];
        if (expectedIndent != null && child.indent !== expectedIndent) {
          diagnostic(diagnostics, "SECTION_BODY_INDENT_INVALID", `Entries in '${section}' must use a consistent indentation.`, location(child.line, child.firstColumn));
        }
        if (section === "include") {
          const level = parseLanguageLevel(child, diagnostics);
          if (level) document.includes.push(level);
        } else {
          const asMatch = child.trimmed.match(/^(.*?)(?:\s+as\s+(.+))?$/);
          const namespaceText = asMatch?.[1]?.trim() || child.trimmed;
          const aliasText = asMatch?.[2]?.trim();
          const ns = parseReferenceAt(namespaceText, 0, child.line, child.firstColumn, diagnostics);
          const alias = aliasText ? parseReferenceAt(aliasText, 0, child.line, child.firstColumn + child.trimmed.indexOf(aliasText), diagnostics) : undefined;
          const parsedNamespace = readReference(namespaceText);
          if (parsedNamespace && namespaceText.slice(parsedNamespace.end).trim()) {
            diagnostic(diagnostics, "IMPORT_NAMESPACE_INVALID", "Unexpected content after the imported namespace.", location(child.line, child.firstColumn, child.trimmed.length));
          }
          const parsedAlias = aliasText ? readReference(aliasText) : null;
          if (aliasText && parsedAlias && aliasText.slice(parsedAlias.end).trim()) {
            diagnostic(diagnostics, "IMPORT_ALIAS_INVALID", "Unexpected content after the import alias.", location(child.line, child.firstColumn + child.trimmed.indexOf(aliasText), aliasText.length));
          }
          if (ns) document.imports.push({ namespace: ns, alias: alias || undefined, location: location(child.line, child.firstColumn, child.trimmed.length) });
        }
        count++;
        index++;
      }
      if (count === 0) diagnostic(diagnostics, "SECTION_EMPTY", `The '${section}' section contains no entries.`, location(line.line, line.firstColumn, line.trimmed.length), "warning");
      continue;
    }

    if (section === "features") {
      if (line.trimmed.length !== "features".length) diagnostic(diagnostics, "SECTION_TRAILING_CONTENT", "The features section header cannot have trailing content.", location(line.line, line.firstColumn, line.trimmed.length));
      index++;
      const parsedTree = parseFeatureTree(lines, index, diagnostics);
      document.root = parsedTree.root;
      index = parsedTree.next;
      if (!document.root) diagnostic(diagnostics, "ROOT_MISSING", "A UVL model requires one root feature.", location(line.line, line.firstColumn, line.trimmed.length));
      if (index < lines.length && lines[index].indent > 0) {
        diagnostic(diagnostics, "ROOT_MULTIPLE", "A UVL model requires exactly one root feature.", location(lines[index].line, lines[index].firstColumn, lines[index].trimmed.length));
        while (index < lines.length && lines[index].indent > 0) index++;
      }
      continue;
    }

    if (section === "constraints") {
      if (line.trimmed.length !== "constraints".length) diagnostic(diagnostics, "SECTION_TRAILING_CONTENT", "The constraints section header cannot have trailing content.", location(line.line, line.firstColumn, line.trimmed.length));
      index++;
      let constraintIndent: number | undefined;
      while (index < lines.length && lines[index].indent > 0) {
        const constraintLine = lines[index];
        constraintIndent = constraintIndent ?? constraintLine.indent;
        if (constraintLine.indent !== constraintIndent) diagnostic(diagnostics, "CONSTRAINT_INDENT_INVALID", "Constraint lines must use a consistent indentation.", location(constraintLine.line, constraintLine.firstColumn));
        document.constraints.push(parseExpressionLine(constraintLine, diagnostics));
        index++;
      }
      continue;
    }
  }

  return document;
}

function featureAttributeMap(feature: UvlFeature): Map<string, UvlAttribute> {
  const result = new Map<string, UvlAttribute>();
  feature.attributes.forEach((attribute) => result.set(attribute.key.toLowerCase(), attribute));
  return result;
}

function findAttribute(attributes: UvlAttribute[], parts: string[]): UvlAttribute | undefined {
  if (!parts.length) return undefined;
  const current = attributes.find((attribute) => attribute.key.toLowerCase() === parts[0].toLowerCase());
  if (!current) return undefined;
  if (parts.length === 1) return current;
  if (current.value?.kind !== "attributes") return undefined;
  return findAttribute(current.value.value as UvlAttribute[], parts.slice(1));
}

function validateAttributeSet(attributes: UvlAttribute[], ownerName: string, diagnostics: UvlDiagnostic[], path = ownerName): void {
  const seen = new Set<string>();
  attributes.forEach((attribute) => {
    const key = attribute.key.toLowerCase();
    if (seen.has(key)) diagnostic(diagnostics, "ATTRIBUTE_DUPLICATE", `Feature '${path}' declares attribute '${attribute.key}' more than once.`, attribute.location);
    seen.add(key);
    if (attribute.value?.kind === "attributes") validateAttributeSet(attribute.value.value as UvlAttribute[], ownerName, diagnostics, `${path}.${attribute.key}`);
  });
}

type SemanticType = "boolean" | "number" | "string" | "vector" | "unknown";

type FeatureSymbol = {
  feature: UvlFeature;
  type: SemanticType;
  attributes: Map<string, UvlAttribute>;
};

function valueType(value: UvlAttributeValue | undefined): SemanticType {
  if (!value) return "boolean";
  if (value.kind === "boolean") return "boolean";
  if (value.kind === "integer" || value.kind === "float") return "number";
  if (value.kind === "string") return "string";
  if (value.kind === "vector") return "vector";
  return "unknown";
}

function declaredFeatureType(feature: UvlFeature): SemanticType {
  if (!feature.featureType || feature.featureType === "Boolean") return "boolean";
  if (feature.featureType === "Integer" || feature.featureType === "Real") return "number";
  if (feature.featureType === "String") return "string";
  return "unknown";
}

function flattenFeatures(root: UvlFeature | undefined): UvlFeature[] {
  if (!root) return [];
  const result: UvlFeature[] = [root];
  root.groups.forEach((group) => group.features.forEach((feature) => result.push(...flattenFeatures(feature))));
  return result;
}

function levelEnabled(document: UvlDocument, major: string, minor?: string): boolean {
  return document.includes.some((level) => level.major === major && (!minor || !level.minor || level.minor === minor || level.wildcard));
}

function referenceText(reference: UvlReference): string {
  return reference.parts.join(".");
}

function isImportedReference(reference: UvlReference, imports: Set<string>): boolean {
  const parts = reference.parts.map((part) => part.toLowerCase());
  const first = parts[0] || "";
  const qualified = parts.slice(0, 2).join(".");
  return imports.has(first) || imports.has(qualified) || Array.from(imports).some((name) => name.startsWith(`${first}.`));
}

function validateExpression(
  expression: UvlExpression,
  symbols: Map<string, FeatureSymbol>,
  imports: Set<string>,
  diagnostics: UvlDiagnostic[],
  document: UvlDocument
): SemanticType {
  if (expression.kind === "boolean") return "boolean";
  if (expression.kind === "number") return "number";
  if (expression.kind === "string") return "string";
  if (expression.kind === "parenthesized") return validateExpression(expression.expression, symbols, imports, diagnostics, document);
  if (expression.kind === "reference") {
    const parts = expression.reference.parts;
    const full = referenceText(expression.reference).toLowerCase();
    const direct = symbols.get(full);
    if (direct) return direct.type;
    const root = symbols.get(parts[0].toLowerCase());
    if (root && parts.length > 1) {
      const attribute = findAttribute(root.feature.attributes, parts.slice(1));
      if (!attribute) {
        diagnostic(diagnostics, "ATTRIBUTE_REFERENCE_UNKNOWN", `Feature '${parts[0]}' has no attribute '${parts.slice(1).join(".")}'.`, expression.location);
        return "unknown";
      }
      return valueType(attribute.value);
    }
    if (isImportedReference(expression.reference, imports)) return "unknown";
    diagnostic(diagnostics, "REFERENCE_UNKNOWN", `Reference '${referenceText(expression.reference)}' does not resolve to a feature or attribute.`, expression.location);
    return "unknown";
  }
  if (expression.kind === "aggregate") {
    if (expression.function === "sum" || expression.function === "avg") {
      if (!levelEnabled(document, "Arithmetic", "aggregate-function")) {
        diagnostic(diagnostics, "LANGUAGE_LEVEL_REQUIRED", `Function '${expression.function}' requires Arithmetic.aggregate-function.`, expression.location, "warning");
      }
      const attributeReference = expression.arguments[expression.arguments.length - 1];
      const attributeName = attributeReference?.parts.join(".").toLowerCase();
      const allFeatures = flattenFeatures(document.root);
      if (expression.arguments.length === 2) {
        const ownerReference = expression.arguments[0];
        const owner = ownerReference ? symbols.get(referenceText(ownerReference).toLowerCase()) : undefined;
        if (owner && attributeName) {
          const attribute = findAttribute(owner.feature.attributes, attributeReference.parts.slice(1));
          if (!attribute) diagnostic(diagnostics, "AGGREGATE_ATTRIBUTE_UNKNOWN", `Aggregate '${expression.function}' references unknown attribute '${attributeReference.name}' on feature '${owner.feature.name}'.`, expression.location);
          else if (valueType(attribute.value) !== "number" && valueType(attribute.value) !== "unknown") diagnostic(diagnostics, "AGGREGATE_ATTRIBUTE_TYPE", `Aggregate '${expression.function}' requires a numeric attribute, but '${attributeReference.name}' is not numeric.`, expression.location);
        } else if (ownerReference && !owner && !isImportedReference(ownerReference, imports)) {
          diagnostic(diagnostics, "REFERENCE_UNKNOWN", `Reference '${ownerReference.name}' does not resolve to a feature or imported namespace.`, ownerReference.location);
        }
      } else if (attributeReference) {
        const directFeature = symbols.get(referenceText(attributeReference).toLowerCase());
        if (directFeature) {
          if (directFeature.type !== "number" && directFeature.type !== "unknown") diagnostic(diagnostics, "AGGREGATE_ATTRIBUTE_TYPE", `Aggregate '${expression.function}' requires a numeric feature or attribute.`, expression.location);
        } else if (attributeReference.parts.length > 1) {
          const owner = symbols.get(attributeReference.parts[0].toLowerCase());
          const qualifiedAttribute = owner ? findAttribute(owner.feature.attributes, attributeReference.parts.slice(1)) : undefined;
          if (owner && !qualifiedAttribute) diagnostic(diagnostics, "AGGREGATE_ATTRIBUTE_UNKNOWN", `Aggregate '${expression.function}' references unknown attribute '${attributeReference.name}'.`, expression.location);
          if (qualifiedAttribute && valueType(qualifiedAttribute.value) !== "number" && valueType(qualifiedAttribute.value) !== "unknown") diagnostic(diagnostics, "AGGREGATE_ATTRIBUTE_TYPE", `Aggregate '${expression.function}' requires a numeric attribute, but '${attributeReference.name}' is not numeric.`, expression.location);
          if (!owner && !isImportedReference(attributeReference, imports)) diagnostic(diagnostics, "REFERENCE_UNKNOWN", `Reference '${attributeReference.name}' does not resolve to a feature or imported namespace.`, attributeReference.location);
        } else if (!allFeatures.some((feature) => !!findAttribute(feature.attributes, attributeReference.parts)) && !isImportedReference(attributeReference, imports)) {
          diagnostic(diagnostics, "AGGREGATE_ATTRIBUTE_UNKNOWN", `Aggregate '${expression.function}' references unknown attribute '${attributeReference.name}'.`, expression.location);
        } else {
          const attribute = allFeatures.map((feature) => findAttribute(feature.attributes, attributeReference.parts)).find(Boolean);
          if (attribute && valueType(attribute.value) !== "number" && valueType(attribute.value) !== "unknown") diagnostic(diagnostics, "AGGREGATE_ATTRIBUTE_TYPE", `Aggregate '${expression.function}' requires a numeric attribute, but '${attributeReference.name}' is not numeric.`, expression.location);
        }
      }
      return "number";
    }
    const argument = expression.arguments[expression.arguments.length - 1];
    const argumentType = argument
      ? validateExpression({ kind: "reference", reference: argument, location: argument.location }, symbols, imports, diagnostics, document)
      : "unknown";
    if (expression.function === "len") {
      if (!levelEnabled(document, "Type", "string-constraints")) diagnostic(diagnostics, "LANGUAGE_LEVEL_REQUIRED", "Function 'len' requires Type.string-constraints.", expression.location, "warning");
      if (argumentType !== "string" && argumentType !== "unknown") diagnostic(diagnostics, "FUNCTION_ARGUMENT_TYPE", "Function 'len' requires a String feature or attribute.", expression.location);
      return "number";
    }
    if (!levelEnabled(document, "Type", "numeric-constraints")) {
      diagnostic(diagnostics, "LANGUAGE_LEVEL_REQUIRED", `Function '${expression.function}' requires Type.numeric-constraints.`, expression.location, "warning");
    }
    if (argumentType !== "number" && argumentType !== "unknown") diagnostic(diagnostics, "FUNCTION_ARGUMENT_TYPE", `Function '${expression.function}' requires a numeric feature or attribute.`, expression.location);
    return "number";
  }
  if (expression.kind === "unary") {
    const operandType = validateExpression(expression.operand, symbols, imports, diagnostics, document);
    if (expression.operator === "!" && operandType !== "boolean" && operandType !== "unknown") diagnostic(diagnostics, "OPERATOR_TYPE_INVALID", "The '!' operator requires a Boolean expression.", expression.location);
    if (expression.operator === "-" && operandType !== "number" && operandType !== "unknown") diagnostic(diagnostics, "OPERATOR_TYPE_INVALID", "Unary '-' requires a numeric expression.", expression.location);
    return expression.operator === "!" ? "boolean" : "number";
  }
  const leftType = validateExpression(expression.left, symbols, imports, diagnostics, document);
  const rightType = validateExpression(expression.right, symbols, imports, diagnostics, document);
  if (BOOLEAN_OPERATORS.has(expression.operator)) {
    if (leftType !== "boolean" && leftType !== "unknown") diagnostic(diagnostics, "OPERATOR_TYPE_INVALID", `Operator '${expression.operator}' requires Boolean operands.`, expression.left.location);
    if (rightType !== "boolean" && rightType !== "unknown") diagnostic(diagnostics, "OPERATOR_TYPE_INVALID", `Operator '${expression.operator}' requires Boolean operands.`, expression.right.location);
    return "boolean";
  }
  if (ARITHMETIC_OPERATORS.has(expression.operator)) {
    if (leftType !== "number" && leftType !== "unknown") diagnostic(diagnostics, "OPERATOR_TYPE_INVALID", `Operator '${expression.operator}' requires numeric operands.`, expression.left.location);
    if (rightType !== "number" && rightType !== "unknown") diagnostic(diagnostics, "OPERATOR_TYPE_INVALID", `Operator '${expression.operator}' requires numeric operands.`, expression.right.location);
    if (expression.operator === "/" && expression.right.kind === "number" && expression.right.value === 0) diagnostic(diagnostics, "DIVISION_BY_ZERO", "Division by zero is not a valid UVL constraint.", expression.right.location);
    if (!levelEnabled(document, "Arithmetic")) diagnostic(diagnostics, "LANGUAGE_LEVEL_REQUIRED", `Arithmetic operator '${expression.operator}' requires the Arithmetic language level.`, expression.location, "warning");
    return "number";
  }
  if (COMPARISON_OPERATORS.has(expression.operator)) {
    const compatible = leftType === "unknown" || rightType === "unknown" || leftType === rightType || (leftType === "number" && rightType === "number");
    if (!compatible) diagnostic(diagnostics, "COMPARISON_TYPE_INVALID", `Cannot compare ${leftType} with ${rightType} using '${expression.operator}'.`, expression.location);
    if ((leftType === "string" || rightType === "string") && !levelEnabled(document, "Type", "string-constraints")) diagnostic(diagnostics, "LANGUAGE_LEVEL_REQUIRED", "String comparisons require Type.string-constraints.", expression.location, "warning");
    return "boolean";
  }
  return "unknown";
}

export function validateUvlSemantics(document: UvlDocument): UvlDiagnostic[] {
  const diagnostics: UvlDiagnostic[] = [];
  if (!document.root && !document.diagnostics.some((item) => item.code === "ROOT_MISSING")) {
    diagnostic(diagnostics, "ROOT_MISSING", "A UVL model requires one root feature under the features section.", location(1, 1));
  }
  const features = flattenFeatures(document.root);
  const symbols = new Map<string, FeatureSymbol>();

  const languageLevelKeys = new Set<string>();
  document.includes.forEach((level) => {
    const key = `${level.major.toLowerCase()}.${level.wildcard ? "*" : (level.minor || "")}`;
    if (languageLevelKeys.has(key)) diagnostic(diagnostics, "LANGUAGE_LEVEL_DUPLICATE", `Language level '${level.raw}' is included more than once.`, level.location, "warning");
    languageLevelKeys.add(key);
  });

  // Build the complete symbol table before validating expressions.  UVL
  // references are allowed to point to a feature declared later in the tree;
  // validating while collecting symbols would incorrectly report those
  // forward references as unknown.
  features.forEach((feature) => {
    const key = feature.name.toLowerCase();
    if (symbols.has(key)) {
      diagnostic(diagnostics, "FEATURE_NAME_DUPLICATE", `Feature name '${feature.name}' is duplicated.`, feature.location);
      return;
    }
    const attributes = featureAttributeMap(feature);
    validateAttributeSet(feature.attributes, feature.name, diagnostics);
    symbols.set(key, { feature, type: declaredFeatureType(feature), attributes });
  });

  features.forEach((feature) => {

    if (feature.cardinality && !levelEnabled(document, "Arithmetic", "feature-cardinality")) {
      diagnostic(diagnostics, "LANGUAGE_LEVEL_REQUIRED", `Feature cardinality on '${feature.name}' requires Arithmetic.feature-cardinality.`, feature.cardinality ? feature.reference.location : feature.location, "warning");
    }
    if (feature.featureType === "String" && !levelEnabled(document, "Type")) diagnostic(diagnostics, "LANGUAGE_LEVEL_REQUIRED", `String feature '${feature.name}' requires the Type language level.`, feature.location, "warning");
    if ((feature.featureType === "Integer" || feature.featureType === "Real") && !levelEnabled(document, "Arithmetic")) diagnostic(diagnostics, "LANGUAGE_LEVEL_REQUIRED", `Numeric feature '${feature.name}' requires the Arithmetic language level.`, feature.location, "warning");
    feature.groups.forEach((group) => {
      if (group.kind === "cardinality" && !levelEnabled(document, "Boolean", "group-cardinality")) diagnostic(diagnostics, "LANGUAGE_LEVEL_REQUIRED", "Cardinality groups require Boolean.group-cardinality.", group.location, "warning");
      const effective = group.cardinality || (group.kind === "alternative" ? { min: 1, max: 1 } : group.kind === "or" ? { min: 1, max: "*" as const } : undefined);
      if (!effective) return;
      const maximum = effective.max === "*" ? group.features.length : effective.max;
      if (effective.min > group.features.length || maximum > group.features.length) diagnostic(diagnostics, "GROUP_CARDINALITY_EXCEEDS_MEMBERS", `Group '${group.kind}' cardinality [${effective.min}..${effective.max}] exceeds its ${group.features.length} member(s).`, group.location);
      if (effective.max !== "*" && effective.max < effective.min) diagnostic(diagnostics, "GROUP_CARDINALITY_INVALID", "A group cardinality maximum cannot be lower than its minimum.", group.location);
      if (group.kind === "alternative" && (effective.min !== 1 || effective.max !== 1)) diagnostic(diagnostics, "ALTERNATIVE_CARDINALITY_INVALID", "Alternative groups must use [1..1].", group.location);
    });
  });

  const importNames = new Set<string>();
  document.imports.forEach((item) => {
    const declaredName = (item.alias?.name || item.namespace.name).toLowerCase();
    if (importNames.has(declaredName)) diagnostic(diagnostics, "IMPORT_ALIAS_DUPLICATE", `Import alias '${item.alias?.name || item.namespace.name}' is duplicated.`, item.location);
    if (symbols.has(declaredName)) diagnostic(diagnostics, "IMPORT_NAME_CONFLICT", `Import alias '${item.alias?.name || item.namespace.name}' conflicts with a local feature.`, item.location);
    importNames.add(declaredName);
    // Keep namespace prefixes as well.  This allows references such as
    // `submodels.Sauces.Ketchup` to resolve when the import does not use an
    // alias, while an aliased import (`... as Sauce`) still resolves through
    // the alias itself.
    const namespaceParts = item.namespace.parts.map((part) => part.toLowerCase());
    namespaceParts.forEach((_part, index) => importNames.add(namespaceParts.slice(0, index + 1).join(".")));
  });

  // Attribute-level constraints use the same expression and symbol rules as
  // top-level constraints.  They are intentionally checked after the symbol
  // table and imports have been collected so forward and qualified
  // references work consistently.
  features.forEach((feature) => feature.attributes.forEach((attribute) => {
    if (attribute.constraint) {
      const type = validateExpression(attribute.constraint, symbols, importNames, diagnostics, document);
      if (type !== "boolean" && type !== "unknown") diagnostic(diagnostics, "ATTRIBUTE_CONSTRAINT_TYPE", `Constraint attribute '${attribute.key}' must evaluate to Boolean.`, attribute.location);
    }
    attribute.constraints?.forEach((constraint) => {
      const type = validateExpression(constraint, symbols, importNames, diagnostics, document);
      if (type !== "boolean" && type !== "unknown") diagnostic(diagnostics, "ATTRIBUTE_CONSTRAINT_TYPE", `Constraint list attribute '${attribute.key}' must contain Boolean expressions.`, attribute.location);
    });
  }));

  document.constraints.forEach((constraint) => {
    if (!constraint.expression) return;
    const type = validateExpression(constraint.expression, symbols, importNames, diagnostics, document);
    if (type !== "boolean" && type !== "unknown") diagnostic(diagnostics, "CONSTRAINT_TYPE_INVALID", "A top-level UVL constraint must evaluate to Boolean.", constraint.location);
  });

  return diagnostics;
}

export function parseUvlDocument(source: string): UvlDocument {
  return parseDocument(source);
}

export function parseAndValidateUvl(source: string): UvlParseResult {
  const document = parseDocument(source);
  const semanticDiagnostics = validateUvlSemantics(document);
  const diagnostics = [...document.diagnostics, ...semanticDiagnostics];
  const errors = diagnostics.filter((item) => item.severity === "error");
  const warnings = diagnostics.filter((item) => item.severity === "warning");
  return { document, diagnostics, errors, warnings, valid: errors.length === 0 };
}

export function uvlAttributeValueToJson(value: UvlAttributeValue | undefined): unknown {
  if (!value) return true;
  if (value.kind === "vector") return (value.value as UvlAttributeValue[]).map(uvlAttributeValueToJson);
  if (value.kind === "attributes") {
    const result: Record<string, unknown> = {};
    (value.value as UvlAttribute[]).forEach((attribute) => {
      result[attribute.key] = attribute.constraint
        ? attribute.raw
        : attribute.constraints
          ? attribute.raw
          : uvlAttributeValueToJson(attribute.value);
    });
    return result;
  }
  return value.value;
}

export function uvlAttributesToJson(attributes: UvlAttribute[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  attributes.forEach((attribute) => {
    result[attribute.key] = attribute.constraint
      ? attribute.raw
      : attribute.constraints
        ? attribute.raw
        : uvlAttributeValueToJson(attribute.value);
  });
  return result;
}
