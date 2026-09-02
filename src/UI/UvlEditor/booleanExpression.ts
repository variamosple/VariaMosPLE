/**
 * Small parser for the Boolean subset shared by the UVL exporters.
 *
 * UVL allows considerably more than Boolean constraints (arithmetic,
 * comparisons and aggregate functions).  AFM and Glencoe only have a
 * Boolean constraint language, therefore exporters deliberately reject
 * tokens outside this grammar instead of silently changing their meaning.
 */

export type BooleanExpression =
  | { kind: "literal"; name: string }
  | { kind: "not"; expression: BooleanExpression }
  | {
      kind: "and" | "or" | "implies" | "equivalent" | "excludes" | "xor";
      left: BooleanExpression;
      right: BooleanExpression;
    };

type Token =
  | { kind: "identifier"; value: string }
  | { kind: "operator"; value: string }
  | { kind: "open"; value: "(" }
  | { kind: "close"; value: ")" };

function parserError(format: string, source: string, detail: string): Error {
  return new Error(`${format} cannot parse constraint '${source}': ${detail}`);
}

function tokenize(source: string, format: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;

  while (cursor < source.length) {
    const character = source[cursor];
    if (/\s/.test(character)) {
      cursor++;
      continue;
    }

    const twoCharacter = source.slice(cursor, cursor + 2);
    const threeCharacter = source.slice(cursor, cursor + 3);
    if (threeCharacter === "<=>") {
      tokens.push({ kind: "operator", value: "<=>" });
      cursor += 3;
      continue;
    }
    if (twoCharacter === "=>") {
      tokens.push({ kind: "operator", value: "=>" });
      cursor += 2;
      continue;
    }
    if (twoCharacter === "&&" || twoCharacter === "||") {
      tokens.push({ kind: "operator", value: twoCharacter });
      cursor += 2;
      continue;
    }
    if (character === "&" || character === "|" || character === "!" || character === "(") {
      tokens.push(
        character === "(" ? { kind: "open", value: "(" } : { kind: "operator", value: character }
      );
      cursor++;
      continue;
    }
    if (character === ")") {
      tokens.push({ kind: "close", value: ")" });
      cursor++;
      continue;
    }
    if (character === '"') {
      const end = source.indexOf('"', cursor + 1);
      if (end < 0 || end === cursor + 1) {
        throw parserError(format, source, "unterminated or empty quoted feature reference");
      }
      tokens.push({ kind: "identifier", value: source.slice(cursor + 1, end) });
      cursor = end + 1;
      continue;
    }

    const identifier = source.slice(cursor).match(/^[A-Za-z_][\w.#%?\\'§äüöß-]*/);
    if (identifier) {
      const value = identifier[0];
      const lower = value.toLowerCase();
      const booleanOperator = [
        "and",
        "or",
        "not",
        "implies",
        "requires",
        "excludes",
        "iff",
        "equivalent",
        "xor",
      ];
      tokens.push(
        booleanOperator.includes(lower)
          ? { kind: "operator", value: lower }
          : { kind: "identifier", value }
      );
      cursor += value.length;
      continue;
    }

    throw parserError(format, source, `unexpected token '${character}'`);
  }

  return tokens;
}

function isOperator(token: Token | undefined, values: string[]): boolean {
  return token?.kind === "operator" && values.includes(token.value.toLowerCase());
}

/** Parse a UVL Boolean constraint into a format-neutral expression tree. */
export function parseBooleanExpression(source: string, format: string): BooleanExpression {
  const tokens = tokenize(source.trim(), format);
  if (tokens.length === 0) throw parserError(format, source, "the constraint is empty");
  let cursor = 0;

  const parsePrimary = (): BooleanExpression => {
    const token = tokens[cursor++];
    if (!token) throw parserError(format, source, "the expression is incomplete");
    if (token.kind === "open") {
      const expression = parseEquivalent();
      if (tokens[cursor]?.kind !== "close") {
        throw parserError(format, source, "unmatched opening parenthesis");
      }
      cursor++;
      return expression;
    }
    if (token.kind === "operator" && ["!", "not"].includes(token.value.toLowerCase())) {
      return { kind: "not", expression: parsePrimary() };
    }
    if (token.kind !== "identifier") {
      throw parserError(format, source, `unexpected token '${token.value}'`);
    }
    const lower = token.value.toLowerCase();
    if (lower === "true" || lower === "false") {
      throw parserError(format, source, `Boolean constant '${token.value}' is not supported by this format`);
    }
    return { kind: "literal", name: token.value };
  };

  const parseAnd = (): BooleanExpression => {
    let left = parsePrimary();
    while (isOperator(tokens[cursor], ["&", "&&", "and"])) {
      cursor++;
      left = { kind: "and", left, right: parsePrimary() };
    }
    return left;
  };

  const parseOr = (): BooleanExpression => {
    let left = parseAnd();
    while (isOperator(tokens[cursor], ["|", "||", "or"])) {
      cursor++;
      left = { kind: "or", left, right: parseAnd() };
    }
    return left;
  };

  // Implication is right associative in UVL.  Keeping that associativity is
  // important for expressions such as A => B => C.
  const parseImplies = (): BooleanExpression => {
    const left = parseOr();
    if (isOperator(tokens[cursor], ["=>", "implies", "requires", "excludes", "xor"])) {
      const operator = (tokens[cursor++] as { kind: "operator"; value: string }).value.toLowerCase();
      const right = parseImplies();
      const kind = operator === "excludes"
        ? "excludes"
        : operator === "xor"
          ? "xor"
          : "implies";
      return { kind, left, right };
    }
    return left;
  };

  const parseEquivalent = (): BooleanExpression => {
    let left = parseImplies();
    while (isOperator(tokens[cursor], ["<=>", "iff", "equivalent"])) {
      cursor++;
      left = { kind: "equivalent", left, right: parseImplies() };
    }
    return left;
  };

  const result = parseEquivalent();
  if (cursor !== tokens.length) {
    throw parserError(format, source, `unexpected token '${tokens[cursor].value}'`);
  }
  return result;
}
