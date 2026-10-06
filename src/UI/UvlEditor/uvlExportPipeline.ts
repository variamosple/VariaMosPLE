import { buildAfm } from "./afmExport";
import { buildGlencoeGfmJson } from "./glencoeExport";
import {
  buildSplotSxfm,
  type SplotExportNode,
} from "./splotExport";
import {
  composeUvlSources,
  serializeUvlExpression,
  uvlSubmodelSourcesToRecord,
  type UvlCompositionResult,
  type UvlSubmodelSources,
} from "./uvlComposition";
import type {
  UvlAttribute,
  UvlDocument,
  UvlExpression,
  UvlFeature,
  UvlGroup,
} from "./uvlParser";

export type UvlExportFormat = "afm" | "glencoe" | "json" | "splot" | "uvl";

export const UVL_WORKSPACE_BUNDLE_FORMAT = "variamos-uvl-workspace";
export const UVL_WORKSPACE_BUNDLE_VERSION = 1;

export type UvlWorkspaceBundle = {
  format: typeof UVL_WORKSPACE_BUNDLE_FORMAT;
  formatVersion: number;
  rootSource: string;
  /** Backwards-compatible alias used by the first JSON exporter. */
  source: string;
  rootFileName: string | null;
  submodels: Record<string, string>;
  metadata: {
    namespace?: string;
    includes: string[];
    imports: Array<{ namespace: string; alias?: string }>;
    resolvedImports: Array<{ namespace: string; alias?: string; path?: string; missing: boolean }>;
    featureCount: number;
    constraintCount: number;
  };
};

export type UvlExportLoss = {
  message: string;
  line?: number;
  sourcePath?: string;
};

export type UvlExportContext = {
  source: string;
  rootFileName?: string;
  submodels: Record<string, string>;
  composition: UvlCompositionResult;
  document: UvlDocument;
  nodes: SplotExportNode[];
  constraints: string[];
  losses: UvlExportLoss[];
  valid: boolean;
};

function canonicalKey(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function featureCount(feature: UvlFeature | undefined): number {
  if (!feature) return 0;
  return 1 + feature.groups.reduce((sum, group) => sum + group.features.reduce((groupSum, child) => groupSum + featureCount(child), 0), 0);
}

function groupRelation(group: UvlGroup): SplotExportNode["relation"] {
  return group.kind === "mandatory" || group.kind === "optional"
    ? group.kind
    : group.kind;
}

function groupCardinality(group: UvlGroup): { min: number; max: number | "*" } | undefined {
  if (group.kind === "mandatory" || group.kind === "optional") return undefined;
  if (group.cardinality) return { ...group.cardinality };
  return group.kind === "alternative"
    ? { min: 1, max: 1 }
    : { min: 1, max: "*" };
}

/** Converts the composed UVL AST to the common tree expected by standard exporters. */
export function uvlDocumentToExportNodes(document: UvlDocument): SplotExportNode[] {
  if (!document.root) return [];
  const makeFeature = (feature: UvlFeature, relation: SplotExportNode["relation"], groupId?: string, cardinality?: { min: number; max: number | "*" }): SplotExportNode => {
    const children: SplotExportNode[] = [];
    feature.groups.forEach((group, groupIndex) => {
      const groupKey = `${feature.name}:${groupIndex}:${group.location.line}:${group.location.column}`;
      const relationForChildren = groupRelation(group);
      const cardinalityForChildren = groupCardinality(group);
      group.features.forEach((child) => {
        children.push(makeFeature(
          child,
          relationForChildren,
          relationForChildren === "mandatory" || relationForChildren === "optional" ? undefined : groupKey,
          cardinalityForChildren
        ));
      });
    });
    return {
      name: feature.name,
      relation,
      children,
      groupId,
      groupCardinality: cardinality,
    };
  };
  return [makeFeature(document.root, "root")];
}

function expressionIsBooleanOnly(expression: UvlExpression | undefined): boolean {
  if (!expression) return true;
  if (expression.kind === "boolean" || expression.kind === "reference") return true;
  if (expression.kind === "parenthesized") return expressionIsBooleanOnly(expression.expression);
  if (expression.kind === "unary") return expression.operator === "!" && expressionIsBooleanOnly(expression.operand);
  if (expression.kind === "aggregate" || expression.kind === "number" || expression.kind === "string") return false;
  if (expression.kind === "binary") {
    if (!["&", "|", "=>", "<=>"].includes(expression.operator)) return false;
    return expressionIsBooleanOnly(expression.left) && expressionIsBooleanOnly(expression.right);
  }
  return false;
}

function addLoss(losses: UvlExportLoss[], loss: UvlExportLoss): void {
  const key = `${loss.sourcePath || ""}|${loss.line || 0}|${loss.message}`.toLowerCase();
  if (!losses.some((item) => `${item.sourcePath || ""}|${item.line || 0}|${item.message}`.toLowerCase() === key)) losses.push(loss);
}

function inspectFeatureLosses(feature: UvlFeature | undefined, format: UvlExportFormat, losses: UvlExportLoss[]): void {
  if (!feature) return;
  if (format === "uvl" || format === "json") return;
  if (feature.featureType && feature.featureType !== "Boolean") {
    addLoss(losses, {
      message: `Feature '${feature.name}' uses type '${feature.featureType}', which is not representable in ${format.toUpperCase()}.`,
      line: feature.location.line,
    });
  }
  if (feature.cardinality) {
    addLoss(losses, {
      message: `Feature '${feature.name}' uses feature cardinality, which is not representable in ${format.toUpperCase()}.`,
      line: feature.location.line,
    });
  }
  feature.attributes.forEach((attribute) => inspectAttributeLosses(attribute, feature, format, losses));
  feature.groups.forEach((group) => group.features.forEach((child) => inspectFeatureLosses(child, format, losses)));
}

function inspectAttributeLosses(attribute: UvlAttribute, feature: UvlFeature, format: UvlExportFormat, losses: UvlExportLoss[]): void {
  const key = canonicalKey(attribute.key);
  if (key === "abstract" && !attribute.value && !attribute.constraint && !attribute.constraints) return;
  addLoss(losses, {
    message: `Attribute/modifier '${attribute.key}' on '${feature.name}' is not represented in ${format.toUpperCase()}.`,
    line: attribute.location.line,
  });
}

function inspectExpressionLosses(expression: UvlExpression | undefined, format: UvlExportFormat, line: number, losses: UvlExportLoss[]): void {
  if (!expression) return;
  if (!expressionIsBooleanOnly(expression)) {
    addLoss(losses, {
      message: `Constraint at line ${line} contains arithmetic, typed values or an aggregate unsupported by ${format.toUpperCase()}.`,
      line,
    });
  }
}

function compatibilityLosses(document: UvlDocument, composition: UvlCompositionResult, format: UvlExportFormat): UvlExportLoss[] {
  const losses: UvlExportLoss[] = [];
  if (format === "uvl" || format === "json") return losses;
  if (document.imports.length) {
    addLoss(losses, { message: "Imported UVL submodels are not embedded in this single-file standard export." });
  }
  inspectFeatureLosses(document.root, format, losses);
  document.constraints.forEach((constraint) => inspectExpressionLosses(constraint.expression, format, constraint.location.line, losses));
  const visitAttributeConstraints = (feature: UvlFeature | undefined): void => {
    if (!feature) return;
    feature.attributes.forEach((attribute) => {
      if (attribute.constraint || attribute.constraints?.length) {
        addLoss(losses, {
          message: `Attribute constraint '${attribute.key}' on '${feature.name}' is not represented in ${format.toUpperCase()}.`,
          line: attribute.location.line,
        });
      }
    });
    feature.groups.forEach((group) => group.features.forEach(visitAttributeConstraints));
  };
  visitAttributeConstraints(document.root);
  // Keep the composition argument in the signature so callers can extend the
  // loss report with source-path-specific diagnostics without changing the API.
  composition.warnings.forEach((warning) => {
    if (warning.code === "IMPORT_NAMESPACE_MISMATCH") addLoss(losses, { message: warning.message, line: warning.location.line });
  });
  return losses;
}

function canonicalConstraints(document: UvlDocument): string[] {
  return document.constraints
    .map((constraint) => constraint.expression ? serializeUvlExpression(constraint.expression).trim() : constraint.raw.trim())
    .filter(Boolean);
}

function metadataForContext(composition: UvlCompositionResult): UvlWorkspaceBundle["metadata"] {
  return {
    namespace: composition.rootDocument.namespace?.name,
    includes: composition.rootDocument.includes.map((level) => level.raw),
    imports: composition.rootDocument.imports.map((item) => ({ namespace: item.namespace.name, alias: item.alias?.name })),
    resolvedImports: composition.resolvedImports.map((item) => ({
      namespace: item.namespace,
      alias: item.alias,
      path: item.path,
      missing: item.missing,
    })),
    featureCount: featureCount(composition.document.root),
    constraintCount: composition.document.constraints.length,
  };
}

/** Parses, composes and validates one editable UVL workspace for export. */
export function buildUvlExportContext(
  source: string,
  submodelSources: UvlSubmodelSources = {},
  format: UvlExportFormat = "uvl",
  rootFileName?: string
): UvlExportContext {
  const submodels = uvlSubmodelSourcesToRecord(submodelSources);
  const composition = composeUvlSources(source, submodelSources);
  const document = composition.document;
  const nodes = uvlDocumentToExportNodes(document);
  const losses = compatibilityLosses(document, composition, format);
  return {
    source,
    rootFileName,
    submodels,
    composition,
    document,
    nodes,
    constraints: canonicalConstraints(document),
    losses,
    valid: composition.valid && nodes.length === 1,
  };
}

export function formatExportLosses(losses: UvlExportLoss[]): string[] {
  return losses.map((loss) => `${loss.line ? `Line ${loss.line}: ` : ""}${loss.message}`);
}

export function createUvlWorkspaceBundle(
  source: string,
  submodelSources: UvlSubmodelSources = {},
  rootFileName?: string
): UvlWorkspaceBundle {
  const context = buildUvlExportContext(source, submodelSources, "json", rootFileName);
  return {
    format: UVL_WORKSPACE_BUNDLE_FORMAT,
    formatVersion: UVL_WORKSPACE_BUNDLE_VERSION,
    rootSource: source,
    source,
    rootFileName: rootFileName || null,
    submodels: context.submodels,
    metadata: metadataForContext(context.composition),
  };
}

/** Accepts the current bundle and the legacy `{ format: "UVL", source }` shape. */
export function parseUvlWorkspaceBundle(content: string): UvlWorkspaceBundle | null {
  let value: any;
  try {
    value = JSON.parse(content);
  } catch (_error) {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const isCurrent = value.format === UVL_WORKSPACE_BUNDLE_FORMAT;
  const isLegacy = value.format === "UVL" && typeof value.source === "string";
  if (!isCurrent && !isLegacy) return null;
  const rootSource = typeof value.rootSource === "string"
    ? value.rootSource
    : typeof value.source === "string" ? value.source : "";
  if (!rootSource.trim()) return null;
  const rawSubmodels = value.submodels && typeof value.submodels === "object" ? value.submodels : {};
  const submodels = Object.keys(rawSubmodels).sort().reduce<Record<string, string>>((result, path) => {
    if (typeof rawSubmodels[path] === "string") result[path] = rawSubmodels[path];
    return result;
  }, {});
  const metadata = value.metadata && typeof value.metadata === "object" ? value.metadata : {};
  return {
    format: UVL_WORKSPACE_BUNDLE_FORMAT,
    formatVersion: Number(value.formatVersion) || UVL_WORKSPACE_BUNDLE_VERSION,
    rootSource,
    source: rootSource,
    rootFileName: typeof value.rootFileName === "string"
      ? value.rootFileName
      : typeof value.fileName === "string" ? value.fileName : null,
    submodels,
    metadata: {
      namespace: typeof metadata.namespace === "string" ? metadata.namespace : undefined,
      includes: Array.isArray(metadata.includes) ? metadata.includes.filter((item: unknown): item is string => typeof item === "string") : [],
      imports: Array.isArray(metadata.imports) ? metadata.imports.filter((item: any) => item && typeof item.namespace === "string").map((item: any) => ({ namespace: item.namespace, alias: typeof item.alias === "string" ? item.alias : undefined })) : [],
      resolvedImports: Array.isArray(metadata.resolvedImports) ? metadata.resolvedImports.filter((item: any) => item && typeof item.namespace === "string").map((item: any) => ({ namespace: item.namespace, alias: typeof item.alias === "string" ? item.alias : undefined, path: typeof item.path === "string" ? item.path : undefined, missing: !!item.missing })) : [],
      featureCount: Number(metadata.featureCount) || 0,
      constraintCount: Number(metadata.constraintCount) || 0,
    },
  };
}

export function buildUvlExportContent(
  format: UvlExportFormat,
  context: UvlExportContext,
  modelName: string
): string {
  if (!context.valid) {
    const firstError = context.composition.errors[0];
    throw new Error(firstError ? `${firstError.message} (line ${firstError.location.line})` : "UVL export requires exactly one valid root feature.");
  }
  if (format === "uvl") return context.source.endsWith("\n") ? context.source : `${context.source}\n`;
  if (format === "json") return JSON.stringify(createUvlWorkspaceBundle(context.source, context.submodels, context.rootFileName), null, 2);
  if (format === "splot") return buildSplotSxfm(modelName, context.nodes, context.constraints);
  if (format === "afm") return buildAfm(modelName, context.nodes, context.constraints);
  return buildGlencoeGfmJson(modelName, context.nodes, context.constraints);
}

export function getUvlExportMimeType(format: UvlExportFormat): string {
  if (format === "json" || format === "glencoe") return "application/json;charset=utf-8";
  if (format === "splot") return "application/xml;charset=utf-8";
  return "text/plain;charset=utf-8";
}

export function getUvlExportExtension(format: UvlExportFormat): string {
  if (format === "splot") return "sxfm";
  if (format === "glencoe") return "gfm.json";
  return format;
}
