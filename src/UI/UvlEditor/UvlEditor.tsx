import React, { Component, useRef, useState, useEffect, useCallback, useMemo } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { ChevronDown, ChevronRight, Diagram3, Eye, FileEarmarkText, Gear } from "react-bootstrap-icons";
import ProjectService from "../../Application/Project/ProjectService";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { ensureUvlLanguageRegistered } from "./uvlLanguageDefinition";
import {
  getUvlStructuredSignature,
  isUvlStructuredModel,
  normalizeUvlStructuredModel,
  parseUvlForChatbot,
  parseUvlCardinality,
  serializeChatbotModelToUvl,
  syncUvlSourceToModel,
  validateUvlSourceStructure,
  validateUvlStructuredModel,
  type UvlSubmodelSources,
} from "./uvlModelAdapter";
import {
  getUvlWorkspaceKey,
  loadUvlWorkspace,
  persistUvlWorkspace,
  submodelsFromModel,
} from "./uvlPersistence";
import {
  buildUvlExportContent,
  buildUvlExportContext,
  formatExportLosses,
  getUvlExportMimeType,
  parseUvlWorkspaceBundle,
  type UvlExportFormat,
} from "./uvlExportPipeline";
import {
  analyzeUvlWithSolver,
  type UvlSolverAnalysisResult,
  type UvlSolverType,
} from "./uvlSolver";

interface UvlEditorProps {
  projectService: ProjectService;
  model: Model;
}

type UvlValidationError = {
  message: string;
  line: number;
  colStart: number;
  colEnd: number;
  severity?: "error" | "warning";
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

type UvlDiagramNode = {
  id: string;
  name: string;
  line: number;
  relation: string;
  modifiers: string[];
  children: UvlDiagramNode[];
  groupId?: string;
  groupCardinality?: {
    min: number;
    max: number | "*";
  };
};

type UvlConstraintToken = {
  type: "identifier" | "constant" | "unary" | "binary" | "openParen" | "closeParen" | "comma";
  value: string;
  colStart: number;
  colEnd: number;
};

const UVL_MARKER_OWNER = "uvl-linter";
const UVL_LANGUAGE_ID = "uvl";

const UVL_EXPORT_OPTIONS: Array<{ id: UvlExportFormat; label: string; extension: string }> = [
  { id: "afm", label: "AFM", extension: "afm" },
  { id: "glencoe", label: "Glencoe (GFM JSON)", extension: "gfm.json" },
  { id: "json", label: "UVL Workspace (JSON)", extension: "json" },
  { id: "splot", label: "SPLOT (SXFM)", extension: "sxfm" },
  { id: "uvl", label: "UVL", extension: "uvl" },
];

const UVL_TOP_LEVEL_KEYWORDS = ["namespace", "include", "imports", "features", "constraints"];
const UVL_GROUP_KEYWORDS = ["mandatory", "optional", "or", "alternative"];
const UVL_CONSTRAINT_KEYWORDS = ["true", "false", "sum", "avg", "len", "floor", "ceil"];
const UVL_MODIFIER_KEYWORDS: string[] = [];

function solverStatusPalette(status: UvlSolverAnalysisResult["status"]): { border: string; background: string; text: string } {
  if (status === "sat") return { border: "#b8dfc2", background: "#f6fff8", text: "#15803d" };
  if (status === "unknown") return { border: "#f0d38a", background: "#fffaf0", text: "#a16207" };
  return { border: "#f0c7cd", background: "#fff8f8", text: "#b00020" };
}

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

function extractUvlFeatureName(declaration: string): string {
  const match = declaration.trim().match(/^(?:(?:Boolean|Integer|Real|String)\s+)?("[^"]+"|[A-Za-z][A-Za-z0-9_#§%?\\'äüöß;]*)/);
  if (!match) return "";
  return match[1].startsWith('"') ? match[1].slice(1, -1) : match[1];
}

function stripUvlBlockComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\r\n]/g, " "));
}

function isSameValidationProblem(left: UvlValidationError | null, right: UvlValidationError) {
  return !!left &&
    left.line === right.line &&
    left.colStart === right.colStart &&
    left.message === right.message;
}

function hasBlockingValidationProblems(problems: UvlValidationError[]): boolean {
  return problems.some((problem) => problem.severity !== "warning");
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

    if (["==", "!=", "<=", ">="].includes(twoChar)) {
      tokens.push({ type: "binary", value: twoChar, colStart: cursor, colEnd: cursor + 2 });
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

    if (ch === "&" || ch === "|" || ch === "<" || ch === ">" || ch === "+" || ch === "-" || ch === "*" || ch === "/") {
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

    if (ch === ",") {
      // Aggregate functions such as `sum(Feature, cost)` use a comma to
      // separate their two references.  It is not a Boolean operator and is
      // therefore kept as a neutral token for the lightweight editor linter;
      // the full UVL parser validates its arity and argument types.
      tokens.push({ type: "comma", value: ch, colStart: cursor, colEnd: cursor + 1 });
      cursor++;
      continue;
    }

    const identifierMatch = expression.slice(cursor).match(/^[A-Za-z_][\w.]*/);
    if (identifierMatch) {
      const value = identifierMatch[0];
      const lowerValue = value.toLowerCase();
      if (lowerValue === "true" || lowerValue === "false") {
        tokens.push({ type: "constant", value, colStart: cursor, colEnd: cursor + value.length });
      } else {
        tokens.push({ type: "identifier", value, colStart: cursor, colEnd: cursor + value.length });
      }
      cursor += value.length;
      continue;
    }

    const quotedReferenceMatch = expression.slice(cursor).match(/^"[^".\r\n]+"/);
    if (quotedReferenceMatch) {
      const rawValue = quotedReferenceMatch[0];
      tokens.push({ type: "identifier", value: rawValue.slice(1, -1), colStart: cursor, colEnd: cursor + rawValue.length });
      cursor += rawValue.length;
      continue;
    }

    if (ch === "-" && /\d/.test(expression[cursor + 1] ?? "")) {
      const negativeNumber = expression.slice(cursor).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?/);
      if (negativeNumber) {
        const value = negativeNumber[0];
        tokens.push({ type: "constant", value, colStart: cursor, colEnd: cursor + value.length });
        cursor += value.length;
        continue;
      }
    }

    const numberMatch = expression.slice(cursor).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?/);
    if (numberMatch) {
      const value = numberMatch[0];
      tokens.push({ type: "constant", value, colStart: cursor, colEnd: cursor + value.length });
      cursor += value.length;
      continue;
    }

    const stringMatch = expression.slice(cursor).match(/^'[^'\r\n]+'/);
    if (stringMatch) {
      const value = stringMatch[0];
      tokens.push({ type: "constant", value, colStart: cursor, colEnd: cursor + value.length });
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

    previousSignificant = token;
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

export function validateUVL(code: string): UvlValidationError[] {
  const errors: UvlValidationError[] = [];
  const lines = stripUvlBlockComments(code).split(/\r?\n/);
  const declaredFeatures = new Set<string>();
  const groupKeywords = new Set(UVL_GROUP_KEYWORDS);
  const topLevelSections = new Set(UVL_TOP_LEVEL_KEYWORDS);
  const ignoredConstraintTokens = new Set([
    "true",
    "false",
    "Boolean",
    "Integer",
    "Real",
    "String",
    "sum",
    "avg",
    "len",
    "floor",
    "ceil",
  ]);
  const bracketPairs: Record<string, string> = { ")": "(", "}": "{", "]": "[" };
  const bracketStack: Array<{ ch: string; line: number; col: number }> = [];
  let currentSection: "namespace" | "include" | "imports" | "features" | "constraints" | null = null;

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

    const declaredFeatureName = currentSection === "features" && !isTopLevelSection && !groupKeywords.has(firstWord)
      ? extractUvlFeatureName(trimmed)
      : "";
    if (declaredFeatureName) {
      const colStart = raw.indexOf(declaredFeatureName) + 1;
      if (declaredFeatures.has(declaredFeatureName)) {
        addError(`Duplicate feature '${declaredFeatureName}'.`, lineNo, colStart, colStart + declaredFeatureName.length);
      } else {
        declaredFeatures.add(declaredFeatureName);
      }
    }

    if (currentSection === "constraints" && !isTopLevelSection) {
      const referenceSource = raw.replace(/'[^'\r\n]+'/g, (literal) => " ".repeat(literal.length));
      const tokens = referenceSource.matchAll(/"[^".\r\n]+"|[A-Za-z_][\w.]*/g);
      for (const match of tokens) {
        const rawToken = match[0];
        const token = rawToken.startsWith('"') ? rawToken.slice(1, -1) : rawToken;
        const colStart = (match.index ?? 0) + 1;
        const referenceRoot = token.split(".")[0];
        const isDeclaredReference = declaredFeatures.has(token) || declaredFeatures.has(referenceRoot);
        const aggregateAttributeReference = /(?:sum|avg)\s*\(\s*$/i.test(raw.slice(0, match.index ?? 0)) || /(?:sum|avg)\s*\([^)]*,\s*$/i.test(raw.slice(0, match.index ?? 0));
        const incompleteConstraintKeyword = isDeclaredReference || aggregateAttributeReference
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
        if (!ignoredConstraintTokens.has(token) && !ignoredConstraintTokens.has(token.toLowerCase()) && !isDeclaredReference && !aggregateAttributeReference) {
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

function graphProperty(element: any, name: string, fallback: any = ""): any {
  return element?.properties?.find((property: any) => property?.name === name)?.value ?? fallback;
}

function diagramNodesFromComposedGraph(source: string, modelId: string, submodelSources: UvlSubmodelSources): UvlDiagramNode[] | null {
  const parsed = parseUvlForChatbot(source, modelId, submodelSources) as any;
  if (!parsed?.composition?.valid || !parsed?.elements?.length) return null;
  const elements = parsed.elements as any[];
  const byId = new Map(elements.map((element) => [String(element.id), element]));
  const outgoing = new Map<string, any[]>();
  (parsed.relationships || []).forEach((relationship: any) => {
    const list = outgoing.get(String(relationship.sourceId)) || [];
    list.push(relationship);
    outgoing.set(String(relationship.sourceId), list);
  });
  const lineByName = new Map<string, number>();
  const visitAst = (feature: any) => {
    if (!feature) return;
    lineByName.set(String(feature.name).toLowerCase(), Number(feature.location?.line) || 1);
    (feature.groups || []).forEach((group: any) => (group.features || []).forEach(visitAst));
  };
  visitAst(parsed.document?.root);

  const relationName = (relationship: any): string => {
    const value = String(graphProperty(relationship, "Relation", "Optional")).toLowerCase();
    return value === "mandatory" ? "mandatory" : value === "root" ? "root" : "optional";
  };
  const groupInfo = (group: any) => {
    const type = String(graphProperty(group, "GroupType", "Or")).toLowerCase();
    const relation = type === "alternative" ? "alternative" : type === "cardinality" ? "cardinality" : "or";
    const cardinalityText = String(graphProperty(group, "Cardinality", relation === "alternative" ? "[1..1]" : "[1..*]"));
    return { relation, cardinality: parseUvlCardinality(cardinalityText) || undefined };
  };
  const buildFeature = (element: any, relation: string, groupId?: string, groupCardinality?: { min: number; max: number | "*" }): UvlDiagramNode => {
    const children: UvlDiagramNode[] = [];
    (outgoing.get(String(element.id)) || []).forEach((relationship: any) => {
      const target = byId.get(String(relationship.targetId));
      if (!target) return;
      if (target.type === "Group") {
        const info = groupInfo(target);
        (outgoing.get(String(target.id)) || []).forEach((memberRelationship: any) => {
          const member = byId.get(String(memberRelationship.targetId));
          if (member?.type === "Feature") children.push(buildFeature(member, info.relation, String(target.id), info.cardinality));
        });
      } else if (target.type === "Feature") {
        children.push(buildFeature(target, relationName(relationship)));
      }
    });
    const name = String(element.name);
    const modifiers = String(graphProperty(element, "Attributes", ""))
      .replace(/^\{/, "")
      .replace(/\}$/, "")
      .split(/[, ]+/)
      .map((modifier) => modifier.trim())
      .filter(Boolean);
    return {
      id: String(element.id),
      name,
      line: lineByName.get(name.toLowerCase()) || 1,
      relation,
      modifiers,
      children,
      groupId,
      groupCardinality,
    };
  };
  const roots = elements.filter((element) => element.type === "RootFeature");
  return roots.length === 1 ? [buildFeature(roots[0], "root")] : null;
}

export function parseUVLDiagram(code: string, submodelSources?: UvlSubmodelSources): UvlDiagramNode[] {
  if (submodelSources !== undefined && Object.keys(submodelSources instanceof Map
    ? Object.fromEntries(submodelSources.entries())
    : Array.isArray(submodelSources)
      ? Object.fromEntries(submodelSources.map((entry) => [entry.path, entry.source]))
      : submodelSources).length) {
    const composed = diagramNodesFromComposedGraph(code, "uvl-diagram", submodelSources);
    if (composed) return composed;
  }
  const roots: UvlDiagramNode[] = [];
  const featureStack: Array<UvlDiagramNode | undefined> = [];
  const groupByLevel: Record<number, {
    relation: string;
    id?: string;
    cardinality?: { min: number; max: number | "*" };
  }> = {};
  const lines = stripUvlBlockComments(code).split(/\r?\n/);
  const groupKeywords = new Set(["mandatory", "optional", "or", "alternative"]);
  let inFeatures = false;

  lines.forEach((raw, index) => {
    const lineNo = index + 1;
    const trimmed = raw.trim();

    if (!trimmed || trimmed.startsWith("//")) return;

    const sectionMatch = trimmed.match(/^(namespace|include|imports|features|constraints)\b/);
    if (sectionMatch) {
      inFeatures = sectionMatch[1] === "features";
      return;
    }

    if (!inFeatures) return;

    const indent = raw.match(/^[ \t]*/)?.[0] ?? "";
    const level = Math.max(0, Math.floor(indent.replace(/\t/g, "    ").length / 4));
    const firstWordMatch = trimmed.match(/^([A-Za-z_][\w.]*)/);
    const firstWord = firstWordMatch ? firstWordMatch[1] : "";
    const cardinalityGroup = parseUvlCardinality(trimmed);

    if (!firstWord && !cardinalityGroup) return;

    if (groupKeywords.has(firstWord)) {
      Object.keys(groupByLevel).forEach((key) => {
        if (Number(key) >= level) delete groupByLevel[Number(key)];
      });
      const isGroup = firstWord === "or" || firstWord === "alternative";
      groupByLevel[level] = {
        relation: firstWord,
        id: isGroup ? `group-${lineNo}` : undefined,
        cardinality: isGroup
          ? { min: 1, max: firstWord === "alternative" ? 1 : "*" }
          : undefined,
      };
      return;
    }
    if (cardinalityGroup) {
      Object.keys(groupByLevel).forEach((key) => {
        if (Number(key) >= level) delete groupByLevel[Number(key)];
      });
      groupByLevel[level] = {
        relation: "cardinality",
        id: `group-${lineNo}`,
        cardinality: cardinalityGroup,
      };
      return;
    }

    const featureName = extractUvlFeatureName(trimmed);
    if (!featureName) return;

    const modifiers = Array.from(trimmed.matchAll(/\{([^}]+)\}/g))
      .flatMap((match) => match[1].split(/[, ]+/))
      .map((modifier) => modifier.trim())
      .filter(Boolean);

    const parent = findNearestParent(featureStack, level);
    const activeGroup = groupByLevel[level - 1];
    // A feature written directly under another feature is UVL's optional
    // shorthand (used by the official examples for feature cardinality).
    // Expose it as `optional` so all exporters receive a supported relation.
    const relation = activeGroup?.relation || (parent ? "optional" : "root");
    const node: UvlDiagramNode = {
      id: `${lineNo}-${featureName}`,
      name: featureName,
      line: lineNo,
      relation,
      modifiers,
      children: [],
      groupId: activeGroup?.id,
      groupCardinality: activeGroup?.cardinality,
    };

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }

    featureStack[level] = node;
    featureStack.length = level + 1;
    Object.keys(groupByLevel).forEach((key) => {
      if (Number(key) >= level) delete groupByLevel[Number(key)];
    });
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
    "constraint",
    "constraints",
    "mandatory",
    "optional",
    "or",
    "alternative",
    "Boolean",
    "Integer",
    "Real",
    "String",
    "Type",
    "Arithmetic",
    "group-cardinality",
    "aggregate-function",
    "feature-cardinality",
    "numeric-constraints",
    "string-constraints",
    "cardinality",
    "sum",
    "avg",
    "len",
    "floor",
    "ceil",
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
      [/\/\*/, "comment", "@comment"],
      [/[A-Za-z]+-[A-Za-z]+/, {
        cases: {
          "@keywords": "keyword",
          "@default": "identifier",
        },
      }],
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

    comment: [
      [/[^/*]+/, "comment"],
      [/\*\//, "comment", "@pop"],
      [/[/*]/, "comment"],
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
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorResizeObserverRef = useRef<ResizeObserver | null>(null);
  const editorLayoutFrameRef = useRef<number | null>(null);
  const validationDecorationIdsRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submodelFileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);
  const lastStructuredSignatureRef = useRef<string>("");
  const projectPersistenceId = (props.projectService as any)?.project?.id || "default-project";
  const persistenceKey = useMemo(
    () => getUvlWorkspaceKey(
      projectPersistenceId,
      props.model?.id || "default-model"
    ),
    [projectPersistenceId, props.model?.id]
  );
  const persistedWorkspace = useMemo(() => loadUvlWorkspace(persistenceKey), [persistenceKey]);
  const initialModelSubmodels = useMemo(() => submodelsFromModel(props.model), [props.model]);
  const defaultUvlSource = "namespace Example\n\nfeatures\n    Root {abstract}\n        mandatory\n            FeatureA\n        optional\n            FeatureB\n\nconstraints\n    FeatureA => !FeatureB\n";
  const [value, setValue] = useState<string>(
    (props.model && (props.model as any).uvl) ||
      persistedWorkspace?.rootSource ||
      defaultUvlSource
  );
  const [fileName, setFileName] = useState<string>(persistedWorkspace?.rootFileName || "");
  const [submodelSources, setSubmodelSources] = useState<Record<string, string>>(
    Object.keys(initialModelSubmodels).length ? initialModelSubmodels : (persistedWorkspace?.submodels || {})
  );
  const [problemCount, setProblemCount] = useState<number>(0);
  const [validationProblems, setValidationProblems] = useState<UvlValidationError[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<UvlValidationError | null>(null);
  const [activeToolbarMenu, setActiveToolbarMenu] = useState<string | null>(null);
  const [activeToolbarSubMenu, setActiveToolbarSubMenu] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<UvlViewMode>("uvl");
  const [expandedDiagramNodeIds, setExpandedDiagramNodeIds] = useState<Set<string>>(new Set());
  const [solverAnalysisResult, setSolverAnalysisResult] = useState<UvlSolverAnalysisResult | null>(null);
  const diagramNodes = useMemo(() => parseUVLDiagram(value, submodelSources), [submodelSources, value]);
  const diagramNodeIds = useMemo(() => collectDiagramNodeIds(diagramNodes), [diagramNodes]);
  const structuredSignature = props.model ? getUvlStructuredSignature(props.model) : "";

  const persistWorkspace = useCallback((rootSource: string, sources = submodelSources, nextFileName = fileName) => {
    persistUvlWorkspace(
      persistenceKey,
      props.model as any,
      rootSource,
      sources,
      nextFileName || undefined
    );
  }, [fileName, persistenceKey, props.model, submodelSources]);

  // Restore imported files from the model/session workspace when switching
  // models.  A model's embedded `uvlSubmodels` wins over local storage because
  // it came from ProjectService persistence and is portable with the project.
  useEffect(() => {
    if (!props.model) return;
    const workspace = loadUvlWorkspace(persistenceKey);
    const embeddedSubmodels = submodelsFromModel(props.model);
    if (Object.keys(embeddedSubmodels).length) setSubmodelSources(embeddedSubmodels);
    else if (workspace?.submodels) {
      setSubmodelSources(workspace.submodels);
      (props.model as any).uvlSubmodels = { ...workspace.submodels };
    }
    const restoredSource = (props.model as any).uvl || workspace?.rootSource || defaultUvlSource;
    setValue(restoredSource);
    if (!(props.model as any).uvl && workspace?.rootSource) (props.model as any).uvl = workspace.rootSource;
    if (workspace?.rootFileName) setFileName(workspace.rootFileName);
    lastStructuredSignatureRef.current = "";
  }, [defaultUvlSource, persistenceKey, props.model]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      editorResizeObserverRef.current?.disconnect();
      if (editorLayoutFrameRef.current !== null) {
        window.cancelAnimationFrame(editorLayoutFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    ensureUvlLanguageRegistered(props.projectService);
    const registrationTimer = window.setInterval(
      () => ensureUvlLanguageRegistered(props.projectService),
      1000
    );
    return () => window.clearInterval(registrationTimer);
  }, [props.projectService]);

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

  const getEditorValidationProblems = useCallback((
    currentCode: string,
    includeModelState = true,
    sourceRegistry: UvlSubmodelSources = submodelSources
  ): UvlValidationError[] => {
    const syntaxProblems = validateUVL(currentCode);
    const structural = validateUvlSourceStructure(
      currentCode,
      String(props.model?.id || "validation"),
      sourceRegistry
    );
    const structuralProblems: UvlValidationError[] = structural.issues.map((problem) => ({
      message: `UVL structure: ${problem.message}`,
      line: problem.line || 1,
      colStart: problem.colStart || 1,
      colEnd: problem.colEnd || Math.max(2, (problem.colStart || 1) + 1),
      severity: problem.severity,
      suggestion: problem.code === "ROOT_MISSING"
        ? "Declare one root feature under the features section."
        : problem.code === "RELATION_PARENT_MISSING"
          ? "Connect the element to its parent with RootFeature_Child, Feature_Child or Group_Feature."
          : problem.code === "GROUP_CARDINALITY_EXCEEDS_MEMBERS"
            ? "Reduce the group cardinality or add enough member features."
            : problem.code === "ALTERNATIVE_CARDINALITY_INVALID"
              ? "Alternative groups must use [1..1]."
              : "Review the UVL structural relationship or property involved.",
    }));
    // A chatbot-created graph can exist before UvlEditor has generated its
    // textual source. Surface graph errors instead of showing a misleading
    // default document in that state. During typing, the source is the
    // authority, so callers can disable this additional check.
    if (includeModelState && props.model && isUvlStructuredModel(props.model) && !(props.model as any).uvl) {
      const modelValidation = validateUvlStructuredModel(props.model as any);
      modelValidation.issues.forEach((problem) => {
        structuralProblems.push({
          message: `UVL model structure: ${problem.message}`,
          line: 1,
          colStart: 1,
          colEnd: 2,
          severity: problem.severity,
          suggestion: problem.code === "ROOT_MISSING"
            ? "Create exactly one RootFeature before saving or exporting."
            : problem.code === "RELATION_PARENT_MISSING"
              ? "Connect every Feature or Group to one valid parent."
              : "Fix the model graph before generating UVL text.",
        });
      });
    }
    return [...syntaxProblems, ...structuralProblems];
  }, [props.model, submodelSources]);

  const runValidation = useCallback((currentCode: string, sourceRegistry: UvlSubmodelSources = submodelSources) => {
    const problems = getEditorValidationProblems(currentCode, true, sourceRegistry);

    if (monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const markers = problems.map((problem) => ({
          startLineNumber: problem.line,
          startColumn: problem.colStart,
          endLineNumber: problem.line,
          endColumn: problem.colEnd,
          message: problem.message,
          severity: problem.severity === "warning"
            ? monacoRef.current!.MarkerSeverity.Warning
            : monacoRef.current!.MarkerSeverity.Error,
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
  }, [getEditorValidationProblems, submodelSources]);

  const scheduleValidation = useCallback((currentCode: string, delay = 500, sourceRegistry: UvlSubmodelSources = submodelSources) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runValidation(currentCode, sourceRegistry), delay);
  }, [runValidation, submodelSources]);

  useEffect(() => {
    if (!props.model) return;

    if (!isUvlStructuredModel(props.model)) {
      if (!hasBlockingValidationProblems(getEditorValidationProblems(value)) && syncUvlSourceToModel(props.model, value, submodelSources)) {
        normalizeUvlStructuredModel(props.model as any);
        lastStructuredSignatureRef.current = getUvlStructuredSignature(props.model);
        persistWorkspace(value);
        props.projectService.saveProject?.();
      }
      return;
    }

    normalizeUvlStructuredModel(props.model as any);
    const currentSignature = getUvlStructuredSignature(props.model);
    if (!lastStructuredSignatureRef.current) {
      const hasPendingParentHints = (props.model.elements as any[]).some(
        (element) => element?.parentId != null && String(element.parentId).trim()
      );
      if (!(props.model as any).uvl || hasPendingParentHints) {
        const initialSource = serializeChatbotModelToUvl(
          props.model,
          (props.model as any).uvl || value
        );
        if (!initialSource) {
          // Remember the invalid signature to avoid a render/validation loop;
          // a later graph edit changes the signature and retries generation.
          lastStructuredSignatureRef.current = getUvlStructuredSignature(props.model);
          runValidation(value);
          return;
        }
        if (hasBlockingValidationProblems(getEditorValidationProblems(initialSource))) {
          lastStructuredSignatureRef.current = getUvlStructuredSignature(props.model);
          runValidation(initialSource);
          return;
        }
        lastStructuredSignatureRef.current = getUvlStructuredSignature(props.model);
        (props.model as any).uvl = initialSource;
        setValue(initialSource);
        persistWorkspace(initialSource);
        props.projectService.saveProject?.();
        scheduleValidation(initialSource, 0);
      } else {
        lastStructuredSignatureRef.current = currentSignature;
      }
      return;
    }
    if (currentSignature === lastStructuredSignatureRef.current) return;

    const synchronizedSource = serializeChatbotModelToUvl(props.model, value);
    if (!synchronizedSource) {
      lastStructuredSignatureRef.current = currentSignature;
      runValidation(value);
      return;
    }
    if (hasBlockingValidationProblems(getEditorValidationProblems(synchronizedSource))) {
      lastStructuredSignatureRef.current = currentSignature;
      runValidation(synchronizedSource);
      return;
    }
    lastStructuredSignatureRef.current = getUvlStructuredSignature(props.model);
    if (synchronizedSource === value) return;
    (props.model as any).uvl = synchronizedSource;
    setValue(synchronizedSource);
    persistWorkspace(synchronizedSource);
    props.projectService.saveProject?.();
    scheduleValidation(synchronizedSource, 0);
  }, [getEditorValidationProblems, persistWorkspace, props.model, props.projectService, runValidation, scheduleValidation, structuredSignature, submodelSources, value]);

  const handleChange = useCallback((nextValue: string | undefined) => {
    const nextCode = nextValue ?? "";
    setValue(nextCode);
    // Keep the exact text even while it is temporarily invalid, so a browser
    // refresh or model switch cannot discard an in-progress edit.
    persistWorkspace(nextCode);
    props.projectService.saveProject?.();
    if (props.model) {
      const problems = getEditorValidationProblems(nextCode, false);
      if (!hasBlockingValidationProblems(problems) && syncUvlSourceToModel(props.model, nextCode, submodelSources)) {
        normalizeUvlStructuredModel(props.model as any);
        (props.model as any).uvl = nextCode;
        lastStructuredSignatureRef.current = getUvlStructuredSignature(props.model);
      }
    }
    scheduleValidation(nextCode);
  }, [getEditorValidationProblems, persistWorkspace, props.model, props.projectService, scheduleValidation, submodelSources]);

  const handleEditorDidMount = useCallback((editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editorResizeObserverRef.current?.disconnect();

    const scheduleLayout = () => {
      if (editorLayoutFrameRef.current !== null) {
        window.cancelAnimationFrame(editorLayoutFrameRef.current);
      }
      // Calling layout directly inside ResizeObserver's delivery cycle can
      // trigger Chromium's "undelivered notifications" development error.
      editorLayoutFrameRef.current = window.requestAnimationFrame(() => {
        editorLayoutFrameRef.current = null;
        if (editorRef.current === editor) editor.layout();
      });
    };

    if (editorContainerRef.current && typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(scheduleLayout);
      observer.observe(editorContainerRef.current);
      editorResizeObserverRef.current = observer;
    }
    scheduleLayout();
    runValidation(value);
  }, [runValidation, value]);

  const handleOpenFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, []);

  const handleOpenSubmodelDialog = useCallback(() => {
    if (submodelFileInputRef.current) {
      submodelFileInputRef.current.value = "";
      submodelFileInputRef.current.click();
    }
  }, []);

  const readTextFile = useCallback((file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve((event.target?.result as string) ?? "");
    reader.onerror = () => reject(reader.error || new Error(`Could not read ${file.name}`));
    reader.readAsText(file);
  }), []);

  const handleSubmodelFilesSelected = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    Promise.all(files.map(async (file) => ({
      path: (file as any).webkitRelativePath || file.name,
      source: await readTextFile(file),
    }))).then((entries) => {
      setSubmodelSources((current) => {
        const next = { ...current };
        entries.forEach((entry) => { next[entry.path] = entry.source; });
        persistWorkspace(value, next);
        return next;
      });
      props.projectService.saveProject?.();
      scheduleValidation(value, 0);
    }).catch((error) => {
      console.error("UvlEditor: could not read an UVL submodel", error);
    }).finally(() => {
      if (submodelFileInputRef.current) submodelFileInputRef.current.value = "";
    });
  }, [persistWorkspace, props.projectService, readTextFile, scheduleValidation, value]);

  const handleLoadedContent = useCallback((content: string, nextFileName: string) => {
    const bundle = parseUvlWorkspaceBundle(content);
    const loadedSource = bundle?.rootSource ?? content;
    const loadedSubmodels = bundle?.submodels ?? submodelSources;
    const loadedFileName = bundle?.rootFileName || nextFileName;
    setValue(loadedSource);
    setFileName(loadedFileName);
    if (bundle) setSubmodelSources(loadedSubmodels);
    if (props.model) {
      const problems = getEditorValidationProblems(loadedSource, false, loadedSubmodels);
      if (!hasBlockingValidationProblems(problems) && syncUvlSourceToModel(props.model, loadedSource, loadedSubmodels)) {
        normalizeUvlStructuredModel(props.model as any);
        (props.model as any).uvl = loadedSource;
        lastStructuredSignatureRef.current = getUvlStructuredSignature(props.model);
        persistWorkspace(loadedSource, loadedSubmodels, loadedFileName);
      }
    }
    scheduleValidation(loadedSource, 0, loadedSubmodels);
    if (props.model) {
      persistWorkspace(loadedSource, loadedSubmodels, loadedFileName);
      props.projectService.saveProject?.();
    }
  }, [getEditorValidationProblems, persistWorkspace, props.model, props.projectService, scheduleValidation, submodelSources]);

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

    try {
      const baseName = getExportBaseName(fileName, props.model);
      const problems = getEditorValidationProblems(value);
      if (hasBlockingValidationProblems(problems)) {
        const firstProblem = problems[0];
        throw new Error(
          `${exportOption.label} export requires valid UVL. Line ${firstProblem.line}: ${firstProblem.message}`
        );
      }
      const exportContext = buildUvlExportContext(value, submodelSources, format, fileName || undefined);
      if (!exportContext.valid) {
        const firstError = exportContext.composition.errors[0];
        throw new Error(
          firstError
            ? `${exportOption.label} export requires a valid composed UVL model. Line ${firstError.location.line}: ${firstError.message}`
            : `${exportOption.label} export requires exactly one valid root feature.`
        );
      }
      const compatibilityWarnings = formatExportLosses(exportContext.losses);
      if (compatibilityWarnings.length && format !== "json" && format !== "uvl" && !window.confirm(
        `${exportOption.label} cannot preserve every UVL detail. The export will omit:\n\n${compatibilityWarnings.join("\n")}\n\nContinue with the format projection?`
      )) return;

      const exportContent = buildUvlExportContent(format, exportContext, baseName);

      downloadTextFile(
        `${baseName}.${exportOption.extension}`,
        exportContent,
        getUvlExportMimeType(format)
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : `Unknown ${format} export error.`;
      window.alert(message);
    }
  }, [fileName, getEditorValidationProblems, props.model, submodelSources, value]);

  const handleSolverAnalysis = useCallback((solver: UvlSolverType) => {
    const result = analyzeUvlWithSolver(solver, value, submodelSources);
    setSolverAnalysisResult(result);
    runValidation(value);
  }, [runValidation, submodelSources, value]);

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
          id: "import-submodels",
          label: "Import Submodels",
          onClick: handleOpenSubmodelDialog,
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
          accept=".uvl,.json,text/plain,application/json"
          style={{ display: "none" }}
          onChange={handleFileSelected}
        />
        <input
          ref={submodelFileInputRef}
          type="file"
          accept=".uvl,text/plain"
          multiple
          style={{ display: "none" }}
          onChange={handleSubmodelFilesSelected}
        />
        <span style={{ color: "#555" }}>
          {fileName
            ? `File: ${fileName}`
            : "No file loaded"}
        </span>
        <span style={{ color: "#607083", fontSize: 12 }}>
          {viewMode === "diagram" ? "Diagram view" : "UVL view"}
        </span>
        <span style={{ color: "#607083", fontSize: 12 }} title="Loaded UVL import sources">
          {Object.keys(submodelSources).length
            ? `${Object.keys(submodelSources).length} submodel(s) loaded`
            : "No submodels loaded"}
        </span>
        <span style={{ marginLeft: "auto", color: problemCount > 0 ? "#b00020" : "#2e7d32" }}>
          {problemCount > 0
            ? `${problemCount} UVL issue(s)`
            : "UVL OK"}
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <div ref={editorContainerRef} style={{ flex: 1, minWidth: 0 }}>
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
              automaticLayout: false,
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
              Validate UVL
            </button>
            <span style={{ marginLeft: "auto", color: problemCount > 0 ? "#b00020" : "#2e7d32", fontSize: 12 }}>
              {problemCount}
            </span>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
            {solverAnalysisResult && (
              <div
                style={{
                  border: `1px solid ${solverStatusPalette(solverAnalysisResult.status).border}`,
                  borderRadius: 6,
                  background: solverStatusPalette(solverAnalysisResult.status).background,
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
                      color: solverStatusPalette(solverAnalysisResult.status).text,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {solverAnalysisResult.solver.toUpperCase()} · {solverAnalysisResult.status.toUpperCase()}
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
