import React, { Component, useRef, useState, useEffect, useCallback, useMemo } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { ChevronDown, ChevronRight, Diagram3, Eye, FileEarmarkText, Gear } from "react-bootstrap-icons";
import ProjectService from "../../Application/Project/ProjectService";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";

interface UvlEditorProps {
  projectService: ProjectService;
  model: Model;
}

type UvlValidationError = {
  message: string;
  line: number;
  colStart: number;
  colEnd: number;
  suggestion?: string;
};

type ToolbarMenuItem = {
  id: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  items?: ToolbarMenuItem[];
};

type ToolbarButtonConfig = {
  id: string;
  label: string;
  Icon: React.ComponentType<any>;
  items?: ToolbarMenuItem[];
  onClick?: () => void;
};

type UvlViewMode = "uvl" | "diagram";

type UvlExportFormat = "afm" | "glencoe" | "json" | "splot" | "uvl";
type UvlSolverType = "sat" | "bdd";

type UvlDiagramNode = {
  id: string;
  name: string;
  line: number;
  relation: string;
  modifiers: string[];
  children: UvlDiagramNode[];
};

type UvlConstraint = {
  expression: string;
  line: number;
};

type UvlModelSummary = {
  features: string[];
  constraints: UvlConstraint[];
};

type UvlSolverAnalysisResult = {
  solver: UvlSolverType;
  status: "success" | "warning" | "error";
  title: string;
  summary: string;
  details: string[];
};

type UvlConstraintToken = {
  type: "identifier" | "constant" | "unary" | "binary" | "openParen" | "closeParen";
  value: string;
  colStart: number;
  colEnd: number;
};

const UVL_MARKER_OWNER = "uvl-linter";
const UVL_LANGUAGE_ID = "uvl";

const UVL_EXPORT_OPTIONS: Array<{ id: UvlExportFormat; label: string; extension: string }> = [
  { id: "afm", label: "AFM", extension: "afm" },
  { id: "glencoe", label: "Glencoe", extension: "glencoe" },
  { id: "json", label: "JSON", extension: "json" },
  { id: "splot", label: "SPLOT", extension: "splot" },
  { id: "uvl", label: "UVL", extension: "uvl" },
];

const UVL_TOP_LEVEL_KEYWORDS = ["namespace", "imports", "features", "constraints"];
const UVL_GROUP_KEYWORDS = ["mandatory", "optional", "or", "alternative"];
const UVL_CONSTRAINT_KEYWORDS = ["true", "false", "and", "or", "not", "implies", "requires", "excludes"];
const UVL_MODIFIER_KEYWORDS = ["abstract"];

if (!Component) {
  throw new Error("React Component import unavailable");
}

function findIncompleteKeyword(token: string, candidates: string[], minLength = 3): string | null {
  if (token.length < minLength || candidates.includes(token)) return null;
  const matches = candidates.filter((candidate) => candidate.startsWith(token));
  return matches.length === 1 ? matches[0] : null;
}

function findClosestDeclaredFeature(token: string, declaredFeatures: Set<string>): string | null {
  const features = Array.from(declaredFeatures);
  const caseInsensitiveMatch = features.find((feature) => feature.toLowerCase() === token.toLowerCase());
  if (caseInsensitiveMatch) return caseInsensitiveMatch;

  const prefixMatch = features.find((feature) =>
    feature.toLowerCase().startsWith(token.toLowerCase()) ||
    token.toLowerCase().startsWith(feature.toLowerCase())
  );
  return prefixMatch || null;
}

function isSameValidationProblem(left: UvlValidationError | null, right: UvlValidationError) {
  return !!left &&
    left.line === right.line &&
    left.colStart === right.colStart &&
    left.message === right.message;
}

function validateConstraintExpression(
  raw: string,
  lineNo: number,
  addError: (message: string, line: number, colStart: number, colEnd: number, suggestion?: string) => void
) {
  const expressionStart = raw.search(/\S/);
  const expression = raw.trim();
  if (!expression) return;

  const tokens: UvlConstraintToken[] = [];
  let cursor = 0;

  const addConstraintError = (message: string, start: number, end: number, suggestion?: string) => {
    addError(`Constraint logic error: ${message}`, lineNo, expressionStart + start + 1, expressionStart + end + 1, suggestion);
  };

  while (cursor < expression.length) {
    const ch = expression[cursor];

    if (/\s/.test(ch)) {
      cursor++;
      continue;
    }

    const twoChar = expression.slice(cursor, cursor + 2);
    const threeChar = expression.slice(cursor, cursor + 3);

    if (threeChar === "<=>") {
      tokens.push({ type: "binary", value: "<=>", colStart: cursor, colEnd: cursor + 3 });
      cursor += 3;
      continue;
    }

    if (twoChar === "=>") {
      tokens.push({ type: "binary", value: "=>", colStart: cursor, colEnd: cursor + 2 });
      cursor += 2;
      continue;
    }

    if (twoChar === ":=") {
      addConstraintError(
        "token recognition error at ':='. Use '=>' for implication or '<=>' for equivalence.",
        cursor,
        cursor + 2,
        "Replace ':=' with '=>' when one feature implies another, or '<=>' when both sides must be equivalent."
      );
      cursor += 2;
      continue;
    }

    if (twoChar === "&&" || twoChar === "||") {
      addConstraintError(
        `unsupported operator '${twoChar}'. Use '${twoChar === "&&" ? "&" : "|"}' instead.`,
        cursor,
        cursor + 2,
        `Replace '${twoChar}' with '${twoChar === "&&" ? "&" : "|"}'.`
      );
      cursor += 2;
      continue;
    }

    if (ch === "=") {
      addConstraintError(
        "unexpected '='. Use '=>' for implication or '<=>' for equivalence.",
        cursor,
        cursor + 1,
        "Use '=>' for implication, for example 'A => B', or '<=>' for equivalence, for example 'A <=> B'."
      );
      cursor++;
      continue;
    }

    if (ch === "&" || ch === "|") {
      tokens.push({ type: "binary", value: ch, colStart: cursor, colEnd: cursor + 1 });
      cursor++;
      continue;
    }

    if (ch === "!") {
      tokens.push({ type: "unary", value: ch, colStart: cursor, colEnd: cursor + 1 });
      cursor++;
      continue;
    }

    if (ch === "(") {
      tokens.push({ type: "openParen", value: ch, colStart: cursor, colEnd: cursor + 1 });
      cursor++;
      continue;
    }

    if (ch === ")") {
      tokens.push({ type: "closeParen", value: ch, colStart: cursor, colEnd: cursor + 1 });
      cursor++;
      continue;
    }

    const identifierMatch = expression.slice(cursor).match(/^[A-Za-z_][\w.]*/);
    if (identifierMatch) {
      const value = identifierMatch[0];
      const lowerValue = value.toLowerCase();
      if (lowerValue === "and" || lowerValue === "or" || lowerValue === "implies" || lowerValue === "requires" || lowerValue === "excludes") {
        tokens.push({ type: "binary", value, colStart: cursor, colEnd: cursor + value.length });
      } else if (lowerValue === "not") {
        tokens.push({ type: "unary", value, colStart: cursor, colEnd: cursor + value.length });
      } else if (lowerValue === "true" || lowerValue === "false") {
        tokens.push({ type: "constant", value, colStart: cursor, colEnd: cursor + value.length });
      } else {
        tokens.push({ type: "identifier", value, colStart: cursor, colEnd: cursor + value.length });
      }
      cursor += value.length;
      continue;
    }

    addConstraintError(
      `token recognition error at '${ch}'.`,
      cursor,
      cursor + 1,
      "Remove this character or replace it with a valid UVL constraint operator: !, &, |, =>, <=>, or parentheses."
    );
    cursor++;
  }

  if (tokens.length === 0) return;

  let previousSignificant: UvlConstraintToken | null = null;
  const parenStack: UvlConstraintToken[] = [];

  tokens.forEach((token, index) => {
    if (token.type === "openParen") {
      const nextToken = tokens[index + 1];
      if (nextToken?.type === "closeParen") {
        addConstraintError(
          "empty parentheses are not a valid constraint expression.",
          token.colStart,
          nextToken.colEnd,
          "Put a feature expression inside the parentheses or remove the empty parentheses."
        );
      }
      parenStack.push(token);
    }

    if (token.type === "closeParen") {
      const open = parenStack.pop();
      if (!open) {
        addConstraintError(
          "closing parenthesis has no matching opening parenthesis.",
          token.colStart,
          token.colEnd,
          "Remove this ')' or add a matching '(' before it."
        );
      }
    }

    if (token.type === "binary") {
      if (!previousSignificant || previousSignificant.type === "binary" || previousSignificant.type === "unary" || previousSignificant.type === "openParen") {
        addConstraintError(
          `operator '${token.value}' is missing a left operand.`,
          token.colStart,
          token.colEnd,
          `Add a feature or expression before '${token.value}'. Example: FeatureA ${token.value} FeatureB.`
        );
      }

      const nextToken = tokens[index + 1];
      if (!nextToken || nextToken.type === "binary" || nextToken.type === "closeParen") {
        addConstraintError(
          `operator '${token.value}' is missing a right operand.`,
          token.colStart,
          token.colEnd,
          `Add a feature or expression after '${token.value}'. Example: FeatureA ${token.value} FeatureB.`
        );
      }
    }

    if (token.type === "unary") {
      const nextToken = tokens[index + 1];
      if (!nextToken || nextToken.type === "binary" || nextToken.type === "closeParen") {
        addConstraintError(
          `operator '${token.value}' must be followed by a feature, constant, or parenthesized expression.`,
          token.colStart,
          token.colEnd,
          `Add a feature after '${token.value}'. Example: ${token.value} FeatureA.`
        );
      }
    }

    if ((token.type === "identifier" || token.type === "constant") && previousSignificant) {
      if (previousSignificant.type === "identifier" || previousSignificant.type === "constant" || previousSignificant.type === "closeParen") {
        addConstraintError(
          `missing logical operator before '${token.value}'.`,
          token.colStart,
          token.colEnd,
          `Add a logical operator before '${token.value}', such as '&', '|', '=>', or '<=>'.`
        );
      }
    }

    if (token.type === "identifier") {
      const nextToken = tokens[index + 1];
      const oppositeToken = tokens[index + 2];
      if (nextToken?.type === "binary" && (nextToken.value === "=>" || nextToken.value.toLowerCase() === "implies")) {
        if (oppositeToken?.type === "unary" && tokens[index + 3]?.value === token.value) {
          addConstraintError(
            `'${token.value}' implies its own negation, so selecting it makes the model inconsistent.`,
            token.colStart,
            tokens[index + 3].colEnd,
            `Check whether '${token.value} => !${token.value}' is intentional. Usually the right side should reference a different feature.`
          );
        }
      }
    }

    if (token.type !== "openParen") {
      previousSignificant = token;
    } else {
      previousSignificant = token;
    }
  });

  parenStack.forEach((open) => {
    addConstraintError(
      "opening parenthesis is never closed.",
      open.colStart,
      open.colEnd,
      "Add a matching ')' after the expression."
    );
  });
}

function validateUVL(code: string): UvlValidationError[] {
  const errors: UvlValidationError[] = [];
  const lines = code.split(/\r?\n/);
  const declaredFeatures = new Set<string>();
  const groupKeywords = new Set(UVL_GROUP_KEYWORDS);
  const topLevelSections = new Set(UVL_TOP_LEVEL_KEYWORDS);
  const ignoredConstraintTokens = new Set([
    "true",
    "false",
    "and",
    "or",
    "not",
    "implies",
    "requires",
    "excludes",
    "Boolean",
    "Integer",
    "Real",
    "String",
  ]);
  const bracketPairs: Record<string, string> = { ")": "(", "}": "{", "]": "[" };
  const bracketStack: Array<{ ch: string; line: number; col: number }> = [];
  let currentSection: "namespace" | "imports" | "features" | "constraints" | null = null;

  const addError = (message: string, line: number, colStart: number, colEnd: number, suggestion?: string) => {
    errors.push({
      message,
      line,
      colStart: Math.max(1, colStart),
      colEnd: Math.max(colStart + 1, colEnd),
      suggestion,
    });
  };

  lines.forEach((raw, index) => {
    const lineNo = index + 1;
    const trimmed = raw.trim();

    if (!trimmed || trimmed.startsWith("//")) return;

    const indent = raw.match(/^[ \t]*/)?.[0] ?? "";
    const normalizedIndent = indent.replace(/\t/g, "    ").length;
    const firstWordMatch = trimmed.match(/^([A-Za-z_][\w.]*)/);
    const firstWord = firstWordMatch ? firstWordMatch[1] : "";
    const isTopLevelSection = topLevelSections.has(firstWord);
    const firstWordColStart = firstWord ? raw.indexOf(firstWord) + 1 : 1;

    if (/ /.test(indent) && /\t/.test(indent)) {
      addError("Inconsistent indentation: do not mix tabs and spaces.", lineNo, 1, indent.length + 1);
    }

    if (normalizedIndent % 4 !== 0) {
      addError(`Invalid indentation (${normalizedIndent} spaces): it must be a multiple of 4.`, lineNo, 1, indent.length + 1);
    }

    const incompleteTopLevelKeyword = normalizedIndent === 0
      ? findIncompleteKeyword(firstWord, UVL_TOP_LEVEL_KEYWORDS)
      : null;
    if (incompleteTopLevelKeyword) {
      addError(
        `Incomplete keyword '${firstWord}'. Did you mean '${incompleteTopLevelKeyword}'?`,
        lineNo,
        firstWordColStart,
        firstWordColStart + firstWord.length,
        `Complete the keyword as '${incompleteTopLevelKeyword}'.`
      );
      return;
    }

    if (isTopLevelSection) {
      currentSection = firstWord as typeof currentSection;
      if (normalizedIndent !== 0) {
        addError(`The '${firstWord}' section must be declared at the top level.`, lineNo, 1, indent.length + 1);
      }
    } else if ((currentSection === "features" || currentSection === "constraints") && normalizedIndent === 0) {
      addError(`Expected indentation inside '${currentSection}'.`, lineNo, 1, Math.max(2, trimmed.length + 1));
    }

    const incompleteFeatureGroupKeyword = currentSection === "features" && !isTopLevelSection
      ? findIncompleteKeyword(firstWord, UVL_GROUP_KEYWORDS)
      : null;
    if (incompleteFeatureGroupKeyword) {
      addError(
        `Incomplete keyword '${firstWord}'. Did you mean '${incompleteFeatureGroupKeyword}'?`,
        lineNo,
        firstWordColStart,
        firstWordColStart + firstWord.length,
        `Complete the group keyword as '${incompleteFeatureGroupKeyword}'.`
      );
      return;
    }

    const modifierMatches = raw.matchAll(/\{([^}]+)\}/g);
    for (const modifierMatch of modifierMatches) {
      const modifierBlock = modifierMatch[1];
      const modifierBlockStart = (modifierMatch.index ?? 0) + 2;
      const modifierTokens = modifierBlock.matchAll(/[A-Za-z_][\w.]*/g);
      for (const modifierTokenMatch of modifierTokens) {
        const modifierToken = modifierTokenMatch[0];
        const expectedModifier = findIncompleteKeyword(modifierToken, UVL_MODIFIER_KEYWORDS);
        if (expectedModifier) {
          const colStart = modifierBlockStart + (modifierTokenMatch.index ?? 0);
          addError(
            `Incomplete keyword '${modifierToken}'. Did you mean '${expectedModifier}'?`,
            lineNo,
            colStart,
            colStart + modifierToken.length,
            `Complete the modifier as '{${expectedModifier}}'.`
          );
        }
      }
    }

    if (groupKeywords.has(firstWord) && normalizedIndent === 0) {
      addError(`The group modifier '${firstWord}' must be indented under a parent feature.`, lineNo, 1, trimmed.length + 1);
    }

    if (currentSection === "features" && !isTopLevelSection && firstWord && !groupKeywords.has(firstWord)) {
      const colStart = firstWordColStart;
      if (declaredFeatures.has(firstWord)) {
        addError(`Duplicate feature '${firstWord}'.`, lineNo, colStart, colStart + firstWord.length);
      } else {
        declaredFeatures.add(firstWord);
      }
    }

    if (currentSection === "constraints" && !isTopLevelSection) {
      const tokens = raw.matchAll(/[A-Za-z_][\w.]*/g);
      for (const match of tokens) {
        const token = match[0];
        const colStart = (match.index ?? 0) + 1;
        const incompleteConstraintKeyword = declaredFeatures.has(token)
          ? null
          : findIncompleteKeyword(token, UVL_CONSTRAINT_KEYWORDS);
        if (incompleteConstraintKeyword) {
          addError(
            `Incomplete keyword '${token}'. Did you mean '${incompleteConstraintKeyword}'?`,
            lineNo,
            colStart,
            colStart + token.length,
            `Complete the constraint keyword as '${incompleteConstraintKeyword}'.`
          );
          continue;
        }
        if (!ignoredConstraintTokens.has(token) && !ignoredConstraintTokens.has(token.toLowerCase()) && !declaredFeatures.has(token)) {
          const closestFeature = findClosestDeclaredFeature(token, declaredFeatures);
          const suggestion = closestFeature ? ` Did you mean '${closestFeature}'?` : " Declare it under features or fix the spelling.";
          addError(
            `Undeclared feature '${token}' used in constraints.${suggestion}`,
            lineNo,
            colStart,
            colStart + token.length,
            closestFeature
              ? `Rename '${token}' to '${closestFeature}' or declare '${token}' under the features section.`
              : `Declare '${token}' under the features section or fix its spelling.`
          );
        }
      }

      validateConstraintExpression(raw, lineNo, addError);
    }

    for (let col = 0; col < raw.length; col++) {
      const ch = raw[col];
      if (ch === "(" || ch === "{" || ch === "[") {
        bracketStack.push({ ch, line: lineNo, col: col + 1 });
      } else if (ch === ")" || ch === "}" || ch === "]") {
        const top = bracketStack[bracketStack.length - 1];
        if (!top || top.ch !== bracketPairs[ch]) {
          addError(`Closing bracket '${ch}' does not match.`, lineNo, col + 1, col + 2);
        } else {
          bracketStack.pop();
        }
      }
    }
  });

  bracketStack.forEach((open) => {
    addError(`Bracket '${open.ch}' is never closed.`, open.line, open.col, open.col + 1);
  });

  return errors;
}

function parseUVLDiagram(code: string): UvlDiagramNode[] {
  const roots: UvlDiagramNode[] = [];
  const featureStack: Array<UvlDiagramNode | undefined> = [];
  const groupByLevel: Record<number, string> = {};
  const lines = code.split(/\r?\n/);
  const groupKeywords = new Set(["mandatory", "optional", "or", "alternative"]);
  let inFeatures = false;

  lines.forEach((raw, index) => {
    const lineNo = index + 1;
    const trimmed = raw.trim();

    if (!trimmed || trimmed.startsWith("//")) return;

    const sectionMatch = trimmed.match(/^(namespace|imports|features|constraints)\b/);
    if (sectionMatch) {
      inFeatures = sectionMatch[1] === "features";
      return;
    }

    if (!inFeatures) return;

    const indent = raw.match(/^[ \t]*/)?.[0] ?? "";
    const level = Math.max(0, Math.floor(indent.replace(/\t/g, "    ").length / 4));
    const firstWordMatch = trimmed.match(/^([A-Za-z_][\w.]*)/);
    const firstWord = firstWordMatch ? firstWordMatch[1] : "";

    if (!firstWord) return;

    if (groupKeywords.has(firstWord)) {
      groupByLevel[level] = firstWord;
      return;
    }

    const modifiers = Array.from(trimmed.matchAll(/\{([^}]+)\}/g))
      .flatMap((match) => match[1].split(/[, ]+/))
      .map((modifier) => modifier.trim())
      .filter(Boolean);

    const parent = findNearestParent(featureStack, level);
    const relation = groupByLevel[level - 1] || (parent ? "child" : "root");
    const node: UvlDiagramNode = {
      id: `${lineNo}-${firstWord}`,
      name: firstWord,
      line: lineNo,
      relation,
      modifiers,
      children: [],
    };

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }

    featureStack[level] = node;
    featureStack.length = level + 1;
  });

  return roots;
}

function findNearestParent(featureStack: Array<UvlDiagramNode | undefined>, level: number): UvlDiagramNode | undefined {
  for (let index = level - 1; index >= 0; index--) {
    if (featureStack[index]) return featureStack[index];
  }
  return undefined;
}

function collectDiagramNodeIds(nodes: UvlDiagramNode[]): string[] {
  return nodes.flatMap((node) => [node.id, ...collectDiagramNodeIds(node.children)]);
}

function summarizeUVLModel(code: string): UvlModelSummary {
  const features: string[] = [];
  const constraints: UvlConstraint[] = [];
  const groupKeywords = new Set(["mandatory", "optional", "or", "alternative"]);
  let currentSection: "namespace" | "imports" | "features" | "constraints" | null = null;

  code.split(/\r?\n/).forEach((raw, index) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("//")) return;

    const sectionMatch = trimmed.match(/^(namespace|imports|features|constraints)\b/);
    if (sectionMatch) {
      currentSection = sectionMatch[1] as typeof currentSection;
      return;
    }

    const firstWord = trimmed.match(/^([A-Za-z_][\w.]*)/)?.[1] ?? "";
    if (currentSection === "features" && firstWord && !groupKeywords.has(firstWord)) {
      features.push(firstWord);
    }

    if (currentSection === "constraints") {
      constraints.push({
        expression: trimmed,
        line: index + 1,
      });
    }
  });

  return { features, constraints };
}

function analyzeUVLWithSolver(solver: UvlSolverType, code: string): UvlSolverAnalysisResult {
  const validationErrors = validateUVL(code);
  const summary = summarizeUVLModel(code);
  const details: string[] = [
    `${summary.features.length} feature(s) detected.`,
    `${summary.constraints.length} constraint(s) detected.`,
  ];

  if (validationErrors.length > 0) {
    return {
      solver,
      status: "error",
      title: `${solver.toUpperCase()} analysis failed`,
      summary: "The UVL model has validation errors that must be fixed before solver analysis.",
      details: [
        ...details,
        ...validationErrors.slice(0, 5).map((error) => `Line ${error.line}: ${error.message}`),
      ],
    };
  }

  const contradictionDetails = detectSimpleConstraintContradictions(summary.constraints);
  if (contradictionDetails.length > 0) {
    return {
      solver,
      status: "warning",
      title: `${solver.toUpperCase()} analysis found warnings`,
      summary: "The UVL model is syntactically valid, but some constraints look contradictory.",
      details: [...details, ...contradictionDetails],
    };
  }

  if (solver === "sat") {
    return {
      solver,
      status: "success",
      title: "SAT analysis completed",
      summary: "No local SAT-style inconsistencies were detected.",
      details: [
        ...details,
        "Boolean variables were mapped from declared features.",
        "Constraint references were checked against the feature set.",
      ],
    };
  }

  return {
    solver,
    status: "success",
    title: "BDD analysis completed",
    summary: "No local BDD-style inconsistencies were detected.",
    details: [
      ...details,
      `Variable order: ${summary.features.length > 0 ? summary.features.slice().sort().join(", ") : "none"}.`,
      `Estimated decision nodes: ${Math.max(1, summary.features.length + summary.constraints.length * 2)}.`,
    ],
  };
}

function detectSimpleConstraintContradictions(constraints: UvlConstraint[]): string[] {
  const details: string[] = [];
  const implicationMap = new Map<string, Set<string>>();

  constraints.forEach((constraint) => {
    const normalized = constraint.expression.replace(/\s+/g, " ");
    const selfContradiction = normalized.match(/^([A-Za-z_][\w.]*)\s*=>\s*!\s*\1$/);
    if (selfContradiction) {
      details.push(`Line ${constraint.line}: '${constraint.expression}' makes '${selfContradiction[1]}' imply its own negation.`);
      return;
    }

    const implication = normalized.match(/^([A-Za-z_][\w.]*)\s*=>\s*(!?\s*[A-Za-z_][\w.]*)$/);
    if (!implication) return;

    const source = implication[1];
    const target = implication[2].replace(/\s+/g, "");
    const targets = implicationMap.get(source) ?? new Set<string>();
    const opposite = target.startsWith("!") ? target.slice(1) : `!${target}`;

    if (targets.has(opposite)) {
      details.push(`Line ${constraint.line}: '${source}' implies both '${target}' and '${opposite}'.`);
    }

    targets.add(target);
    implicationMap.set(source, targets);
  });

  return details;
}

function downloadTextFile(fileName: string, content: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const downloadUrl = window.URL.createObjectURL(blob);
  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = downloadUrl;
  downloadAnchor.download = fileName;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

function getExportBaseName(fileName: string, model: Model): string {
  const currentFileName = fileName.replace(/\.[^/.]+$/, "");
  const modelName = model && (model as any).name ? String((model as any).name) : "uvl-model";
  return (currentFileName || modelName).replace(/[^A-Za-z0-9_-]+/g, "-");
}

//keys
const uvlMonarchTokens: any = {
  defaultToken: "",
  tokenPostfix: ".uvl",

  keywords: [
    "namespace",
    "imports",
    "as",
    "include",
    "features",
    "constraints",
    "mandatory",
    "optional",
    "or",
    "alternative",
    "abstract",
    "Boolean",
    "Integer",
    "Real",
    "String",
    "cardinality",
    "true",
    "false",
  ],

  operators: [
    "=>",
    "<=>",
    "&",
    "|",
    "!",
    "==",
    "!=",
    "<",
    ">",
    "<=",
    ">=",
    "+",
    "-",
    "*",
    "/",
  ],

  symbols: /[=><!~?:&|+*^%/-]+/,

  tokenizer: {
    root: [
      [/[A-Za-z_][\w]*/, {
        cases: {
          "@keywords": "keyword",
          "@default": "identifier",
        },
      }],
      { include: "@whitespace" },
      [/[[\]{}()]/, "@brackets"],
      [/[,.;]/, "delimiter"],
      [/\d+\.\d+/, "number.float"],
      [/\d+/, "number"],
      [/"([^"\\]|\\.)*$/, "string.invalid"],
      [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],
      [/@symbols/, {
        cases: {
          "@operators": "operator",
          "@default": "",
        },
      }],
    ],

    string: [
      [/[^\\"]+/, "string"],
      [/\\./, "string.escape"],
      [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],

    whitespace: [
      [/[ \t\r\n]+/, "white"],
      [/\/\/.*$/, "comment"],
    ],
  },
};

const uvlLanguageConfig: any = {
  comments: { lineComment: "//" },
  brackets: [["{", "}"], ["[", "]"], ["(", ")"]],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
  ],
};

interface UvlDiagramViewProps {
  nodes: UvlDiagramNode[];
  expandedNodeIds: Set<string>;
  onToggleNode: (nodeId: string) => void;
  onSelectNode: (node: UvlDiagramNode) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

interface UvlDiagramNodeViewProps {
  node: UvlDiagramNode;
  depth: number;
  expandedNodeIds: Set<string>;
  onToggleNode: (nodeId: string) => void;
  onSelectNode: (node: UvlDiagramNode) => void;
}

const relationColors: Record<string, string> = {
  root: "#2563eb",
  child: "#64748b",
  mandatory: "#15803d",
  optional: "#a16207",
  or: "#7c3aed",
  alternative: "#be123c",
};

const UvlDiagramView: React.FC<UvlDiagramViewProps> = ({
  nodes,
  expandedNodeIds,
  onToggleNode,
  onSelectNode,
  onExpandAll,
  onCollapseAll,
}) => {
  return (
    <div
      style={{
        height: "100%",
        overflow: "auto",
        background: "#f8fafc",
        padding: 16,
      }}
    >
      <div
        style={{
          minHeight: "100%",
          border: "1px solid #dce3ec",
          background: "#fff",
          borderRadius: 6,
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
            color: "#1f2937",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Diagram3 size={16} />
            UVL Diagram
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={onExpandAll}
              style={{
                height: 28,
                padding: "0 10px",
                border: "1px solid #cfd5df",
                borderRadius: 4,
                background: "#fff",
                color: "#273142",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Expand
            </button>
            <button
              type="button"
              onClick={onCollapseAll}
              style={{
                height: 28,
                padding: "0 10px",
                border: "1px solid #cfd5df",
                borderRadius: 4,
                background: "#fff",
                color: "#273142",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Collapse
            </button>
          </div>
        </div>

        {nodes.length === 0 ? (
          <div
            style={{
              border: "1px dashed #cbd5e1",
              borderRadius: 6,
              padding: 16,
              color: "#64748b",
              fontSize: 13,
            }}
          >
            No features found in the UVL model.
          </div>
        ) : (
          <div>
            {nodes.map((node) => (
              <UvlDiagramNodeView
                key={node.id}
                node={node}
                depth={0}
                expandedNodeIds={expandedNodeIds}
                onToggleNode={onToggleNode}
                onSelectNode={onSelectNode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const UvlDiagramNodeView: React.FC<UvlDiagramNodeViewProps> = ({
  node,
  depth,
  expandedNodeIds,
  onToggleNode,
  onSelectNode,
}) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedNodeIds.has(node.id);
  const relationColor = relationColors[node.relation] || relationColors.child;

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 24, position: "relative" }}>
      {depth > 0 && (
        <div
          style={{
            position: "absolute",
            left: -14,
            top: -8,
            width: 14,
            height: 26,
            borderLeft: "1px solid #cbd5e1",
            borderBottom: "1px solid #cbd5e1",
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggleNode(node.id)}
          disabled={!hasChildren}
          aria-label={hasChildren ? `${isExpanded ? "Collapse" : "Expand"} ${node.name}` : undefined}
          style={{
            width: 22,
            height: 22,
            border: "1px solid #d7dde6",
            borderRadius: 4,
            background: hasChildren ? "#fff" : "#f8fafc",
            color: hasChildren ? "#334155" : "#cbd5e1",
            cursor: hasChildren ? "pointer" : "default",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            flex: "0 0 auto",
          }}
        >
          {hasChildren && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </button>

        <button
          type="button"
          onClick={() => onSelectNode(node)}
          style={{
            minWidth: 150,
            border: "1px solid #d7dde6",
            borderLeft: `4px solid ${relationColor}`,
            borderRadius: 6,
            background: "#fff",
            color: "#1f2937",
            cursor: "pointer",
            padding: "8px 10px",
            textAlign: "left",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
          }}
          title={`Line ${node.line}`}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {node.name}
            <span style={{ color: "#64748b", fontSize: 11, fontWeight: 500 }}>L{node.line}</span>
          </span>
          <span
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 5,
              marginTop: 6,
            }}
          >
            <span
              style={{
                color: relationColor,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 999,
                padding: "2px 6px",
                fontSize: 11,
              }}
            >
              {node.relation}
            </span>
            {node.modifiers.map((modifier) => (
              <span
                key={modifier}
                style={{
                  color: "#475569",
                  background: "#f1f5f9",
                  borderRadius: 999,
                  padding: "2px 6px",
                  fontSize: 11,
                }}
              >
                {modifier}
              </span>
            ))}
          </span>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div style={{ marginBottom: 2 }}>
          {node.children.map((child) => (
            <UvlDiagramNodeView
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedNodeIds={expandedNodeIds}
              onToggleNode={onToggleNode}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const UvlEditor: React.FC<UvlEditorProps> = (props) => {
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<any>(null);
  const validationDecorationIdsRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);
  const [value, setValue] = useState<string>(
    (props.model && (props.model as any).uvl) ||
      "namespace Example\n\nfeatures\n    Root {abstract}\n        mandatory\n            FeatureA\n        optional\n            FeatureB\n\nconstraints\n    FeatureA => !FeatureB\n"
  );
  const [fileName, setFileName] = useState<string>("");
  const [problemCount, setProblemCount] = useState<number>(0);
  const [validationProblems, setValidationProblems] = useState<UvlValidationError[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<UvlValidationError | null>(null);
  const [activeToolbarMenu, setActiveToolbarMenu] = useState<string | null>(null);
  const [activeToolbarSubMenu, setActiveToolbarSubMenu] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<UvlViewMode>("uvl");
  const [expandedDiagramNodeIds, setExpandedDiagramNodeIds] = useState<Set<string>>(new Set());
  const [solverAnalysisResult, setSolverAnalysisResult] = useState<UvlSolverAnalysisResult | null>(null);
  const diagramNodes = useMemo(() => parseUVLDiagram(value), [value]);
  const diagramNodeIds = useMemo(() => collectDiagramNodeIds(diagramNodes), [diagramNodes]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    setExpandedDiagramNodeIds((current) => {
      const next = new Set(current);
      diagramNodeIds.forEach((nodeId) => next.add(nodeId));
      return next;
    });
  }, [diagramNodeIds]);

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    const languages = monaco.languages.getLanguages();
    if (!languages.find((l: any) => l.id === UVL_LANGUAGE_ID)) {
      monaco.languages.register({ id: UVL_LANGUAGE_ID });
      monaco.languages.setMonarchTokensProvider(UVL_LANGUAGE_ID, uvlMonarchTokens);
      monaco.languages.setLanguageConfiguration(UVL_LANGUAGE_ID, uvlLanguageConfig);
    }
  }, []);

  const runValidation = useCallback((currentCode: string) => {
    const problems = validateUVL(currentCode);

    if (monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const markers = problems.map((problem) => ({
          startLineNumber: problem.line,
          startColumn: problem.colStart,
          endLineNumber: problem.line,
          endColumn: problem.colEnd,
          message: problem.message,
          severity: monacoRef.current!.MarkerSeverity.Error,
        }));
        monacoRef.current.editor.setModelMarkers(model, UVL_MARKER_OWNER, markers);

        validationDecorationIdsRef.current = editorRef.current.deltaDecorations(
          validationDecorationIdsRef.current,
          problems.map((problem) => ({
            range: new monacoRef.current!.Range(problem.line, 1, problem.line, 1),
            options: {
              isWholeLine: true,
              className: "uvl-error-line-highlight",
              glyphMarginClassName: "uvl-error-glyph",
              lineNumberClassName: "uvl-error-line-number",
              linesDecorationsClassName: "uvl-error-line-decoration",
              hoverMessage: { value: problem.suggestion ? `${problem.message}\n\n${problem.suggestion}` : problem.message },
            },
          }))
        );
      }
    }

    setValidationProblems(problems);
    setSelectedProblem((current) => {
      if (!current) return null;
      return problems.find((problem) => isSameValidationProblem(current, problem)) ?? null;
    });
    setProblemCount(problems.length);
  }, []);

  const scheduleValidation = useCallback((currentCode: string, delay = 500) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runValidation(currentCode), delay);
  }, [runValidation]);

  const handleChange = useCallback((nextValue: string | undefined) => {
    const nextCode = nextValue ?? "";
    setValue(nextCode);
    if (props.model) {
      (props.model as any).uvl = nextCode;
    }
    scheduleValidation(nextCode);
  }, [props.model, scheduleValidation]);

  const handleEditorDidMount = useCallback((editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    runValidation(value);
  }, [runValidation, value]);

  const handleOpenFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, []);

  const handleLoadedContent = useCallback((content: string, nextFileName: string) => {
    setValue(content);
    setFileName(nextFileName);
    if (props.model) {
      (props.model as any).uvl = content;
    }
    scheduleValidation(content, 0);
  }, [props.model, scheduleValidation]);

  const handleFileSelected = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) ?? "";
      handleLoadedContent(content, file.name);
    };
    reader.onerror = () => {
      console.error("UvlEditor: could not read the file", reader.error);
    };
    reader.readAsText(file);
  }, [handleLoadedContent]);

  const expandAllDiagramNodes = useCallback(() => {
    setExpandedDiagramNodeIds(new Set(diagramNodeIds));
  }, [diagramNodeIds]);

  const collapseAllDiagramNodes = useCallback(() => {
    setExpandedDiagramNodeIds(new Set());
  }, []);

  const handleExport = useCallback((format: UvlExportFormat) => {
    const exportOption = UVL_EXPORT_OPTIONS.find((option) => option.id === format);
    if (!exportOption) return;

    const baseName = getExportBaseName(fileName, props.model);
    const isJsonExport = format === "json";
    const exportContent = isJsonExport
      ? JSON.stringify({
          format: "UVL",
          fileName: fileName || null,
          features: diagramNodes,
          source: value,
        }, null, 2)
      : value;

    downloadTextFile(
      `${baseName}.${exportOption.extension}`,
      exportContent,
      isJsonExport ? "application/json;charset=utf-8" : "text/plain;charset=utf-8"
    );
  }, [diagramNodes, fileName, props.model, value]);

  const handleSolverAnalysis = useCallback((solver: UvlSolverType) => {
    const result = analyzeUVLWithSolver(solver, value);
    setSolverAnalysisResult(result);
    runValidation(value);
  }, [runValidation, value]);

  const toolbarButtons: ToolbarButtonConfig[] = [
    {
      id: "view",
      label: "View",
      Icon: Eye,
      items: [
        {
          id: "uvl",
          label: "UVL",
          onClick: () => setViewMode("uvl"),
        },
        {
          id: "graph",
          label: "Diagram",
          onClick: () => setViewMode("diagram"),
        },
      ],
    },
    {
      id: "file",
      label: "File",
      Icon: FileEarmarkText,
      items: [
        {
          id: "import",
          label: "Import File",
          onClick: handleOpenFileDialog,
        },
        {
          id: "export",
          label: "Export",
          items: UVL_EXPORT_OPTIONS.map((option) => ({
            id: `export-${option.id}`,
            label: option.label,
            onClick: () => handleExport(option.id),
          })),
        },
      ],
    },
    {
      id: "operations",
      label: "Operations",
      Icon: Gear,
      items: [
        {
          id: "validate-uvl",
          label: "Validate UVL",
          onClick: () => runValidation(value),
        },
        {
          id: "solvers",
          label: "Solvers",
          items: [
            {
              id: "solver-sat",
              label: "SAT",
              onClick: () => handleSolverAnalysis("sat"),
            },
            {
              id: "solver-bdd",
              label: "BDD",
              onClick: () => handleSolverAnalysis("bdd"),
            },
          ],
        },
      ],
    },
  ];

  const handleToolbarButtonClick = useCallback((button: ToolbarButtonConfig) => {
    if (button.items && button.items.length > 0) {
      setActiveToolbarMenu((current) => current === button.id ? null : button.id);
      setActiveToolbarSubMenu(null);
      return;
    }
    button.onClick?.();
    setActiveToolbarMenu(null);
    setActiveToolbarSubMenu(null);
  }, []);

  const handleToolbarMenuItemClick = useCallback((item: ToolbarMenuItem) => {
    if (item.disabled) return;
    if (item.items) {
      setActiveToolbarSubMenu((current) => current === item.id ? null : item.id);
      return;
    }
    item.onClick?.();
    setActiveToolbarMenu(null);
    setActiveToolbarSubMenu(null);
  }, []);

  const handleProblemClick = useCallback((problem: UvlValidationError) => {
    setSelectedProblem(problem);
    setViewMode("uvl");
    window.setTimeout(() => {
      if (!editorRef.current) return;
      editorRef.current.revealLineInCenter(problem.line);
      editorRef.current.setPosition({
        lineNumber: problem.line,
        column: problem.colStart,
      });
      editorRef.current.focus();
    }, 0);
  }, []);

  const handleToggleDiagramNode = useCallback((nodeId: string) => {
    setExpandedDiagramNodeIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleSelectDiagramNode = useCallback((node: UvlDiagramNode) => {
    setViewMode("uvl");
    window.setTimeout(() => {
      if (!editorRef.current) return;
      editorRef.current.revealLineInCenter(node.line);
      editorRef.current.setPosition({
        lineNumber: node.line,
        column: 1,
      });
      editorRef.current.focus();
    }, 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) ?? "";
      handleLoadedContent(content, file.name);
    };
    reader.onerror = () => {
      console.error("UvlEditor: could not read the file", reader.error);
    };
    reader.readAsText(file);
  }, [handleLoadedContent]);

  return (
    <div
      style={{
        width: "100%",
        height: "calc(100vh - 100px)",
        boxSizing: "border-box",
        border: "1px solid #ddd",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>
        {`
          .monaco-editor .margin-view-overlays .uvl-error-line-number {
            color: #b00020 !important;
            font-weight: 700 !important;
            background: rgba(176, 0, 32, 0.12);
            border-radius: 3px;
          }

          .monaco-editor .uvl-error-line-decoration {
            border-left: 3px solid #b00020;
            margin-left: 2px;
          }

          .monaco-editor .uvl-error-glyph {
            background: #b00020;
            border-radius: 50%;
            width: 8px !important;
            height: 8px !important;
            margin-left: 6px;
            margin-top: 6px;
          }

          .monaco-editor .view-overlays .uvl-error-line-highlight {
            background: rgba(176, 0, 32, 0.04);
          }
        `}
      </style>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "8px 10px",
          borderBottom: "1px solid #e0e0e0",
          background: "#fbfbfc",
          fontSize: 13,
        }}
        title="Drag and drop a .uvl file here"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {toolbarButtons.map((button) => {
            const Icon = button.Icon;
            const isOpen = activeToolbarMenu === button.id;

            return (
              <div key={button.id} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => handleToolbarButtonClick(button)}
                  style={{
                    minWidth: 84,
                    height: 30,
                    padding: "0 12px",
                    border: "1px solid #cfd5df",
                    background: isOpen ? "#f0f4f8" : "#fff",
                    borderRadius: 4,
                    color: "#273142",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    fontSize: 12,
                    lineHeight: 1,
                  }}
                  aria-haspopup={button.items && button.items.length > 0 ? "menu" : undefined}
                  aria-expanded={button.items && button.items.length > 0 ? isOpen : undefined}
                >
                  <Icon size={13} />
                  <span>{button.label}</span>
                  {button.items && button.items.length > 0 && <ChevronDown size={12} />}
                </button>

                {isOpen && button.items && (
                  <div
                    role="menu"
                    style={{
                      position: "absolute",
                      top: 34,
                      left: 0,
                      minWidth: 154,
                      padding: 4,
                      border: "1px solid #d6dbe3",
                      borderRadius: 6,
                      background: "#fff",
                      boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
                      zIndex: 10,
                    }}
                  >
                    {button.items.map((item) => (
                      <div key={item.id} style={{ position: "relative" }}>
                        <button
                          type="button"
                          role="menuitem"
                          disabled={item.disabled}
                          onMouseEnter={() => item.items && setActiveToolbarSubMenu(item.id)}
                          onClick={() => handleToolbarMenuItemClick(item)}
                          style={{
                            width: "100%",
                            padding: "7px 9px",
                            border: 0,
                            borderRadius: 4,
                            background: "transparent",
                            color: item.disabled ? "#9aa3af" : "#273142",
                            cursor: item.disabled ? "default" : item.items ? "default" : "pointer",
                            textAlign: "left",
                            fontSize: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                          }}
                        >
                          <span>{item.label}</span>
                          {item.items && <ChevronRight size={12} />}
                        </button>

                        {item.items && activeToolbarSubMenu === item.id && (
                          <div
                            role="menu"
                            style={{
                              position: "absolute",
                              top: 0,
                              left: "calc(100% + 6px)",
                              minWidth: 154,
                              padding: 4,
                              border: "1px solid #d6dbe3",
                              borderRadius: 6,
                              background: "#fff",
                              boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
                              zIndex: 11,
                            }}
                          >
                            {item.items.map((subItem) => (
                              <button
                                key={subItem.id}
                                type="button"
                                role="menuitem"
                                disabled={subItem.disabled}
                                onClick={() => handleToolbarMenuItemClick(subItem)}
                                style={{
                                  width: "100%",
                                  padding: "7px 9px",
                                  border: 0,
                                  borderRadius: 4,
                                  background: "transparent",
                                  color: subItem.disabled ? "#9aa3af" : "#2b5f9e",
                                  cursor: subItem.disabled ? "default" : "pointer",
                                  textAlign: "left",
                                  fontSize: 12,
                                }}
                              >
                                {subItem.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".uvl,text/plain"
          style={{ display: "none" }}
          onChange={handleFileSelected}
        />
        <span style={{ color: "#555" }}>
          {fileName
            ? `File: ${fileName}`
            : "No file loaded"}
        </span>
        <span style={{ color: "#607083", fontSize: 12 }}>
          {viewMode === "diagram" ? "Diagram view" : "UVL view"}
        </span>
        <span style={{ marginLeft: "auto", color: problemCount > 0 ? "#b00020" : "#2e7d32" }}>
          {problemCount > 0
            ? `${problemCount} UVL issue(s)`
            : "UVL OK"}
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {viewMode === "uvl" ? (
            <Editor
              height="100%"
              width="100%"
              language={UVL_LANGUAGE_ID}
              theme="vs"
              value={value}
              beforeMount={handleBeforeMount}
              onMount={handleEditorDidMount}
              onChange={handleChange}
              options={{
                minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
              wordWrap: "on",
              glyphMargin: true,
            }}
          />
          ) : (
            <UvlDiagramView
              nodes={diagramNodes}
              expandedNodeIds={expandedDiagramNodeIds}
              onToggleNode={handleToggleDiagramNode}
              onSelectNode={handleSelectDiagramNode}
              onExpandAll={expandAllDiagramNodes}
              onCollapseAll={collapseAllDiagramNodes}
            />
          )}
        </div>

        <aside
          style={{
            width: 260,
            minWidth: 220,
            borderLeft: "1px solid #e0e0e0",
            background: "#f8fafc",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: 10,
              borderBottom: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => runValidation(value)}
              style={{
                height: 30,
                padding: "0 12px",
                border: "1px solid #cfd5df",
                background: "#fff",
                borderRadius: 4,
                color: "#273142",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Validate syntax
            </button>
            <span style={{ marginLeft: "auto", color: problemCount > 0 ? "#b00020" : "#2e7d32", fontSize: 12 }}>
              {problemCount}
            </span>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
            {solverAnalysisResult && (
              <div
                style={{
                  border: `1px solid ${
                    solverAnalysisResult.status === "success"
                      ? "#b8dfc2"
                      : solverAnalysisResult.status === "warning"
                        ? "#f0d38a"
                        : "#f0c7cd"
                  }`,
                  borderRadius: 6,
                  background:
                    solverAnalysisResult.status === "success"
                      ? "#f6fff8"
                      : solverAnalysisResult.status === "warning"
                        ? "#fffaf0"
                        : "#fff8f8",
                  padding: 10,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ color: "#1f2937", fontSize: 12, fontWeight: 700 }}>
                    {solverAnalysisResult.title}
                  </span>
                  <span
                    style={{
                      color:
                        solverAnalysisResult.status === "success"
                          ? "#15803d"
                          : solverAnalysisResult.status === "warning"
                            ? "#a16207"
                            : "#b00020",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {solverAnalysisResult.solver}
                  </span>
                </div>
                <div style={{ color: "#4b5563", fontSize: 12, lineHeight: 1.35, marginBottom: 6 }}>
                  {solverAnalysisResult.summary}
                </div>
                {solverAnalysisResult.details.map((detail, index) => (
                  <div
                    key={`${solverAnalysisResult.solver}-${index}`}
                    style={{
                      color: "#607083",
                      fontSize: 12,
                      lineHeight: 1.35,
                      paddingTop: 4,
                    }}
                  >
                    {detail}
                  </div>
                ))}
              </div>
            )}

            {selectedProblem && (
              <div
                style={{
                  border: "1px solid #b8d4f2",
                  borderRadius: 6,
                  background: "#f4f9ff",
                  padding: 10,
                  marginBottom: 10,
                }}
              >
                <div style={{ color: "#1f2937", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  Suggestion for line {selectedProblem.line}
                </div>
                <div style={{ color: "#4b5563", fontSize: 12, lineHeight: 1.35, marginBottom: 8 }}>
                  {selectedProblem.message}
                </div>
                <div
                  style={{
                    color: "#245b91",
                    fontSize: 12,
                    lineHeight: 1.4,
                    borderTop: "1px solid #d5e6f8",
                    paddingTop: 8,
                  }}
                >
                  {selectedProblem.suggestion || "Review the highlighted expression and compare it with the expected UVL syntax for this section."}
                </div>
              </div>
            )}

            {validationProblems.length === 0 ? (
              <div
                style={{
                  padding: "8px 6px",
                  color: "#607083",
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                No errors
              </div>
            ) : (
              validationProblems.map((problem, index) => (
                <button
                  key={`${problem.line}-${problem.colStart}-${index}`}
                  type="button"
                  onClick={() => handleProblemClick(problem)}
                  style={{
                    width: "100%",
                    border: isSameValidationProblem(selectedProblem, problem) ? "1px solid #2b5f9e" : "1px solid #f0c7cd",
                    borderRadius: 4,
                    background: isSameValidationProblem(selectedProblem, problem) ? "#f4f9ff" : "#fff",
                    color: "#273142",
                    cursor: "pointer",
                    display: "block",
                    marginBottom: 6,
                    padding: "7px 8px",
                    textAlign: "left",
                  }}
                  title={problem.message}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#b00020",
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Line {problem.line}
                  </span>
                  <span
                    style={{
                      display: "block",
                      color: "#4b5563",
                      fontSize: 12,
                      lineHeight: 1.35,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {problem.message}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default UvlEditor;
