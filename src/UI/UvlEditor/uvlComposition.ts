import {
  parseAndValidateUvl,
  validateUvlSemantics,
  type UvlAttribute,
  type UvlDiagnostic,
  type UvlDocument,
  type UvlExpression,
  type UvlFeature,
  type UvlGroup,
  type UvlImport,
  type UvlReference,
  type UvlSourceLocation,
} from "./uvlParser";

/** A source file that can be referenced by an UVL `imports` entry. */
export type UvlSubmodelSource = {
  path: string;
  source: string;
};

/** Accepted source-map shapes make the API convenient for the browser and tests. */
export type UvlSubmodelSources =
  | Record<string, string>
  | Map<string, string>
  | UvlSubmodelSource[];

export type UvlCompositionDiagnostic = UvlDiagnostic & {
  /** Source file in which the diagnostic originated, when it is not the root. */
  sourcePath?: string;
};

export type UvlResolvedImport = {
  namespace: string;
  alias?: string;
  path?: string;
  source?: string;
  document?: UvlDocument;
  parentPath: string;
  missing: boolean;
};

export type UvlCompositionResult = {
  /** The root document with referenced submodel features and constraints composed. */
  document: UvlDocument;
  /** The unmodified root document, useful when saving the editable root file. */
  rootDocument: UvlDocument;
  /** Every parsed document, keyed by its normalized source path. */
  documents: Map<string, UvlDocument>;
  resolvedImports: UvlResolvedImport[];
  diagnostics: UvlCompositionDiagnostic[];
  errors: UvlCompositionDiagnostic[];
  warnings: UvlCompositionDiagnostic[];
  valid: boolean;
  sourceMap: Record<string, string>;
};

type SourceEntry = {
  key: string;
  originalPath: string;
  source: string;
};

type ImportContext = {
  item: UvlImport;
  path: string;
  source: string;
  document: UvlDocument;
  prefixes: string[][];
  prefix: string;
};

const ROOT_DOCUMENT_PATH = "__root__.uvl";

function emptyLocation(): UvlSourceLocation {
  return { line: 1, column: 1, endLine: 1, endColumn: 2 };
}

function normalizePathSeparators(value: string): string {
  return String(value || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
}

/**
 * Normalizes a path while retaining the `.uvl` extension.  Import namespaces
 * are identifiers rather than file paths, so this helper only normalizes the
 * path side of the source map.
 */
export function normalizeUvlSubmodelPath(path: string): string {
  return normalizePathSeparators(path).toLowerCase();
}

function pathWithoutExtension(path: string): string {
  return path.replace(/\.uvl$/i, "");
}

function pathCandidates(namespace: string): string[] {
  const normalized = normalizePathSeparators(namespace);
  const dotted = normalized.replace(/\//g, ".");
  const slash = normalized.replace(/\./g, "/");
  const candidates = [normalized, dotted, slash];
  [normalized, dotted, slash].forEach((candidate) => {
    if (!/\.uvl$/i.test(candidate)) candidates.push(`${candidate}.uvl`);
  });
  const leaf = dotted.split(".").filter(Boolean).pop();
  if (leaf) {
    candidates.push(leaf, `${leaf}.uvl`);
  }
  return Array.from(new Set(candidates.map(normalizeUvlSubmodelPath).filter(Boolean)));
}

function sourceEntries(sources: UvlSubmodelSources | undefined): SourceEntry[] {
  if (!sources) return [];
  if (sources instanceof Map) {
    return Array.from(sources.entries()).map(([path, source]) => ({
      key: normalizeUvlSubmodelPath(path),
      originalPath: path,
      source: String(source ?? ""),
    }));
  }
  if (Array.isArray(sources)) {
    return sources.map((entry) => ({
      key: normalizeUvlSubmodelPath(entry.path),
      originalPath: entry.path,
      source: String(entry.source ?? ""),
    }));
  }
  return Object.entries(sources).map(([path, source]) => ({
    key: normalizeUvlSubmodelPath(path),
    originalPath: path,
    source: String(source ?? ""),
  }));
}

/** Converts any accepted source-map shape into a serializable record. */
export function uvlSubmodelSourcesToRecord(sources: UvlSubmodelSources | undefined): Record<string, string> {
  return sourceEntries(sources).reduce<Record<string, string>>((result, entry) => {
    if (entry.key) result[entry.originalPath] = entry.source;
    return result;
  }, {});
}

/**
 * Resolves an UVL namespace against browser-selected/persisted source files.
 * Both dotted (`submodels.Sauces.uvl`) and directory (`submodels/Sauces.uvl`)
 * names are accepted; a leaf fallback supports selecting `Sauces.uvl` alone.
 */
export function resolveUvlImportSource(
  namespace: string,
  sources: UvlSubmodelSources | undefined
): { path: string; source: string } | undefined {
  const entries = sourceEntries(sources);
  const byKey = new Map<string, SourceEntry>();
  entries.forEach((entry) => {
    if (entry.key && !byKey.has(entry.key)) byKey.set(entry.key, entry);
  });
  for (const candidate of pathCandidates(namespace)) {
    const match = byKey.get(candidate);
    if (match) return { path: match.originalPath, source: match.source };
  }

  // Last-resort comparison ignores extension and path notation.  This handles
  // a persisted key such as `Submodels/Sauces` for an import `submodels.Sauces`.
  const normalizedNamespace = normalizeUvlSubmodelPath(namespace).replace(/\.uvl$/i, "");
  const match = entries.find((entry) => {
    const key = pathWithoutExtension(entry.key);
    const keyLeaf = key.split("/").pop() || key;
    const namespaceLeaf = normalizedNamespace.split(/[/.]/).pop() || normalizedNamespace;
    return key === normalizedNamespace ||
      key.replace(/\//g, ".") === normalizedNamespace.replace(/\//g, ".") ||
      keyLeaf === namespaceLeaf;
  });
  return match ? { path: match.originalPath, source: match.source } : undefined;
}

function importPrefix(item: UvlImport): string {
  // Without an alias, UVL references retain the complete namespace path
  // (`submodels.Sauces.Type`), not just its leaf (`Sauces.Type`).
  return item.alias?.name || item.namespace.name;
}

function importPrefixes(item: UvlImport): string[][] {
  const namespaceParts = item.namespace.parts.length
    ? item.namespace.parts
    : item.namespace.name.split(".").filter(Boolean);
  const prefixes = [namespaceParts];
  if (item.alias?.parts?.length) prefixes.unshift(item.alias.parts);
  else if (item.alias?.name) prefixes.unshift(item.alias.name.split("."));
  return prefixes.filter((parts) => parts.length > 0);
}

function importDiagnostic(
  item: UvlImport,
  code: string,
  message: string,
  severity: "error" | "warning" = "error"
): UvlCompositionDiagnostic {
  return { code, message, severity, location: item.location || emptyLocation() };
}

function importedDiagnostic(diagnostic: UvlDiagnostic, sourcePath: string): UvlCompositionDiagnostic {
  return {
    ...diagnostic,
    sourcePath,
    message: `${sourcePath}: ${diagnostic.message}`,
  };
}

function cloneReference(reference: UvlReference, name = reference.name): UvlReference {
  const parts = name.split(".").filter(Boolean);
  return { ...reference, name, parts };
}

function cloneExpression(expression: UvlExpression): UvlExpression {
  switch (expression.kind) {
    case "reference": return { ...expression, reference: cloneReference(expression.reference) };
    case "aggregate": return { ...expression, arguments: expression.arguments.map((argument) => cloneReference(argument)) };
    case "unary": return { ...expression, operand: cloneExpression(expression.operand) };
    case "binary": return { ...expression, left: cloneExpression(expression.left), right: cloneExpression(expression.right) };
    case "parenthesized": return { ...expression, expression: cloneExpression(expression.expression) };
    default: return { ...expression } as UvlExpression;
  }
}

function cloneAttribute(attribute: UvlAttribute): UvlAttribute {
  const cloneValue = (value: any): any => {
    if (!value || typeof value !== "object") return value;
    if (value.kind === "vector") return { ...value, value: Array.isArray(value.value) ? value.value.map(cloneValue) : value.value };
    if (value.kind === "attributes") return { ...value, value: Array.isArray(value.value) ? value.value.map(cloneAttribute) : value.value };
    return { ...value };
  };
  return {
    ...attribute,
    value: attribute.value ? cloneValue(attribute.value) : undefined,
    constraint: attribute.constraint ? cloneExpression(attribute.constraint) : undefined,
    constraints: attribute.constraints?.map(cloneExpression),
  };
}

function cloneGroup(group: UvlGroup): UvlGroup {
  return {
    ...group,
    cardinality: group.cardinality ? { ...group.cardinality } : undefined,
    features: group.features.map(cloneFeature),
  };
}

function cloneFeature(feature: UvlFeature): UvlFeature {
  return {
    ...feature,
    reference: cloneReference(feature.reference),
    cardinality: feature.cardinality ? { ...feature.cardinality } : undefined,
    attributes: feature.attributes.map(cloneAttribute),
    groups: feature.groups.map(cloneGroup),
  };
}

function directChildren(feature: UvlFeature): UvlFeature[] {
  return feature.groups.reduce<UvlFeature[]>((result, group) => result.concat(group.features), []);
}

function findImportedFeature(root: UvlFeature | undefined, parts: string[]): UvlFeature | undefined {
  if (!root || !parts.length) return root;
  const normalized = parts.map((part) => part.toLowerCase());
  const rootParts = root.name.split(".").map((part) => part.toLowerCase());
  let remaining = normalized;
  if (normalized.slice(0, rootParts.length).join(".") === rootParts.join(".")) remaining = normalized.slice(rootParts.length);
  if (!remaining.length) return root;

  const walk = (feature: UvlFeature, path: string[]): UvlFeature | undefined => {
    const featureName = feature.name.toLowerCase();
    if (path.length && path.join(".") === remaining.join(".")) return feature;
    for (const child of directChildren(feature)) {
      const childPath = path.concat(child.name.toLowerCase());
      const exact = walk(child, childPath);
      if (exact) return exact;
    }
    if (featureName === remaining[0]) {
      for (const child of directChildren(feature)) {
        const exact = walk(child, [featureName, child.name.toLowerCase()]);
        if (exact) return exact;
      }
    }
    return undefined;
  };

  const direct = directChildren(root).find((child) => child.name.toLowerCase() === remaining.join("."));
  if (direct) return direct;
  const found = walk(root, []);
  return found || directChildren(root).find((child) => child.name.toLowerCase() === remaining[0]);
}

function referenceMatchesImport(reference: UvlReference, context: ImportContext): string[] | undefined {
  const parts = reference.parts.length ? reference.parts : reference.name.split(".");
  const lowerParts = parts.map((part) => part.toLowerCase());
  const prefix = context.prefixes.find((candidate) => {
    const lowerCandidate = candidate.map((part) => part.toLowerCase());
    return lowerParts.slice(0, lowerCandidate.length).join(".") === lowerCandidate.join(".");
  });
  return prefix ? parts.slice(prefix.length) : undefined;
}

function overrideComposedFeature(referenceFeature: UvlFeature, declaration: UvlFeature): UvlFeature {
  const result = cloneFeature(referenceFeature);
  result.name = declaration.name;
  result.reference = cloneReference(declaration.reference, declaration.name);
  result.location = declaration.location;
  if (declaration.featureType) result.featureType = declaration.featureType;
  if (declaration.cardinality) result.cardinality = { ...declaration.cardinality };
  if (declaration.attributes.length) {
    result.attributes = declaration.attributes.map(cloneAttribute);
    result.attributeText = declaration.attributeText;
  }
  // A local declaration may add groups to the imported feature.  Keep the
  // imported groups first so its own hierarchy and cardinalities are retained.
  if (declaration.groups.length) result.groups = declaration.groups.map(cloneGroup);
  return result;
}

function qualifyImportedSubtree(feature: UvlFeature, prefix: string, document: UvlDocument, root = false): UvlFeature {
  const result = cloneFeature(feature);
  if (!root) {
    const lowerName = result.name.toLowerCase();
    const lowerPrefix = prefix.toLowerCase();
    if (lowerName !== lowerPrefix && !lowerName.startsWith(`${lowerPrefix}.`)) {
      result.name = `${prefix}.${result.name}`;
      result.reference = cloneReference(result.reference, result.name);
    }
  }
  result.attributes = result.attributes.map((attribute) => qualifyAttribute(attribute, prefix, document));
  result.groups = result.groups.map((group) => ({
    ...group,
    features: group.features.map((child) => qualifyImportedSubtree(child, prefix, document)),
  }));
  return result;
}

function composeFeature(
  feature: UvlFeature,
  contexts: ImportContext[],
  contextsByPath: Map<string, ImportContext[]>,
  active: Set<string>
): UvlFeature {
  for (const context of contexts) {
    const suffix = referenceMatchesImport(feature.reference, context);
    if (suffix === undefined) continue;
    const target = findImportedFeature(context.document.root, suffix);
    if (!target) continue;
    const cycleKey = `${context.path}:${target.name.toLowerCase()}`;
    if (active.has(cycleKey)) return cloneFeature(feature);
    const nestedContexts = contextsByPath.get(context.path) || [];
    const composedTarget = composeFeature(
      cloneFeature(target),
      nestedContexts,
      contextsByPath,
      new Set(active).add(cycleKey)
    );
    const qualifiedTarget = qualifyImportedSubtree(composedTarget, context.prefix, context.document, true);
    const composed = overrideComposedFeature(qualifiedTarget, feature);
    // Keep the qualified name used by the root declaration.  This prevents a
    // submodel feature from colliding with a local feature named `Type`.
    composed.name = feature.name;
    composed.reference = cloneReference(feature.reference, feature.name);
    composed.groups = composed.groups.map((group) => ({
      ...group,
      features: group.features.map((child) => composeFeature(child, nestedContexts, contextsByPath, active)),
    }));
    return composed;
  }

  const cloned = cloneFeature(feature);
  cloned.groups = cloned.groups.map((group) => ({
    ...group,
    features: group.features.map((child) => composeFeature(child, contexts, contextsByPath, active)),
  }));
  return cloned;
}

function qualifyReference(reference: UvlReference, prefix: string, document: UvlDocument): UvlReference {
  const parts = reference.parts.length ? reference.parts : reference.name.split(".");
  // A nested import is already qualified relative to its imported document;
  // prefixing it here exposes it through the parent alias (`Outer.Inner.X`).
  const lowerName = reference.name.toLowerCase();
  const lowerPrefix = prefix.toLowerCase();
  if (lowerName === lowerPrefix || lowerName.startsWith(`${lowerPrefix}.`)) return cloneReference(reference);
  const name = [prefix, ...parts].filter(Boolean).join(".");
  return cloneReference(reference, name);
}

function expressionWithPrefix(expression: UvlExpression, prefix: string, document: UvlDocument): UvlExpression {
  switch (expression.kind) {
    case "reference":
      return { ...expression, reference: qualifyReference(expression.reference, prefix, document) };
    case "aggregate":
      return { ...expression, arguments: expression.arguments.map((argument) => qualifyReference(argument, prefix, document)) };
    case "unary": return { ...expression, operand: expressionWithPrefix(expression.operand, prefix, document) };
    case "binary": return {
      ...expression,
      left: expressionWithPrefix(expression.left, prefix, document),
      right: expressionWithPrefix(expression.right, prefix, document),
    };
    case "parenthesized": return { ...expression, expression: expressionWithPrefix(expression.expression, prefix, document) };
    default: return cloneExpression(expression);
  }
}

function expressionPrecedence(expression: UvlExpression): number {
  if (expression.kind === "binary") {
    if (expression.operator === "<=>") return 1;
    if (expression.operator === "=>") return 2;
    if (expression.operator === "|") return 3;
    if (expression.operator === "&") return 4;
    if (["==", "!=", "<", ">", "<=", ">="].includes(expression.operator)) return 5;
    if (["+", "-"].includes(expression.operator)) return 6;
    if (["*", "/"].includes(expression.operator)) return 7;
  }
  if (expression.kind === "unary") return 8;
  return 9;
}

/** Serializes the expression AST used by composed constraints back to UVL. */
export function serializeUvlExpression(expression: UvlExpression, parentPrecedence = 0): string {
  let value: string;
  if (expression.kind === "reference") value = expression.reference.name;
  else if (expression.kind === "boolean") value = String(expression.value);
  else if (expression.kind === "number") value = expression.raw;
  else if (expression.kind === "string") value = expression.raw || `'${expression.value.replace(/'/g, "\\'")}'`;
  else if (expression.kind === "aggregate") value = `${expression.function}(${expression.arguments.map((argument) => argument.name).join(", ")})`;
  else if (expression.kind === "unary") value = `${expression.operator}${serializeUvlExpression(expression.operand, expressionPrecedence(expression))}`;
  else if (expression.kind === "parenthesized") value = `(${serializeUvlExpression(expression.expression)})`;
  else {
    const precedence = expressionPrecedence(expression);
    const left = serializeUvlExpression(expression.left, precedence);
    const right = serializeUvlExpression(expression.right, precedence + (expression.operator === "=>" || expression.operator === "<=>" ? 0 : 1));
    value = `${left} ${expression.operator} ${right}`;
  }
  const precedence = expressionPrecedence(expression);
  return precedence < parentPrecedence ? `(${value})` : value;
}

function qualifyAttribute(attribute: UvlAttribute, prefix: string, document: UvlDocument): UvlAttribute {
  const result = cloneAttribute(attribute);
  if (attribute.constraint) {
    result.constraint = expressionWithPrefix(attribute.constraint, prefix, document);
    result.raw = `${attribute.key} constraint ${serializeUvlExpression(result.constraint)}`;
  }
  if (attribute.constraints) {
    result.constraints = attribute.constraints.map((constraint) => expressionWithPrefix(constraint, prefix, document));
    result.raw = `${attribute.key} constraints [${result.constraints.map(serializeUvlExpression).join(", ")}]`;
  }
  return result;
}

function visitExpressionReferences(expression: UvlExpression | undefined, callback: (reference: UvlReference) => void): void {
  if (!expression) return;
  if (expression.kind === "reference") callback(expression.reference);
  else if (expression.kind === "aggregate") expression.arguments.forEach(callback);
  else if (expression.kind === "unary") visitExpressionReferences(expression.operand, callback);
  else if (expression.kind === "binary") {
    visitExpressionReferences(expression.left, callback);
    visitExpressionReferences(expression.right, callback);
  } else if (expression.kind === "parenthesized") visitExpressionReferences(expression.expression, callback);
}

function visitAttributeReferences(attribute: UvlAttribute, callback: (reference: UvlReference) => void): void {
  visitExpressionReferences(attribute.constraint, callback);
  attribute.constraints?.forEach((constraint) => visitExpressionReferences(constraint, callback));
  const value: any = attribute.value;
  if (value?.kind === "attributes" && Array.isArray(value.value)) {
    value.value.forEach((nested: UvlAttribute) => visitAttributeReferences(nested, callback));
  } else if (value?.kind === "vector" && Array.isArray(value.value)) {
    value.value.forEach((item: any) => {
      if (item?.kind === "attributes" && Array.isArray(item.value)) item.value.forEach((nested: UvlAttribute) => visitAttributeReferences(nested, callback));
    });
  }
}

function validateImportedReferences(
  feature: UvlFeature | undefined,
  document: UvlDocument,
  context: ImportContext,
  diagnostics: UvlCompositionDiagnostic[],
  seen: Set<string>
): void {
  const check = (reference: UvlReference) => {
    const suffix = referenceMatchesImport(reference, context);
    if (suffix === undefined || findImportedFeature(context.document.root, suffix)) return;
    const key = `${context.path}|${reference.name.toLowerCase()}|${reference.location.line}|${reference.location.column}`;
    if (seen.has(key)) return;
    seen.add(key);
    diagnostics.push({
      code: "IMPORT_REFERENCE_UNKNOWN",
      message: `Imported reference '${reference.name}' was not found in submodel '${context.path}'.`,
      severity: "error",
      location: reference.location,
    });
  };
  if (!feature) {
    document.constraints.forEach((constraint) => visitExpressionReferences(constraint.expression, check));
    return;
  }
  check(feature.reference);
  feature.attributes.forEach((attribute) => visitAttributeReferences(attribute, check));
  feature.groups.forEach((group) => group.features.forEach((child) => validateImportedReferences(child, document, context, diagnostics, seen)));
  document.constraints.forEach((constraint) => visitExpressionReferences(constraint.expression, check));
}

function qualifiedConstraints(document: UvlDocument, prefix: string): UvlDocument["constraints"] {
  return document.constraints.map((constraint) => {
    if (!constraint.expression) return { ...constraint };
    const expression = expressionWithPrefix(constraint.expression, prefix, document);
    return { ...constraint, expression, raw: serializeUvlExpression(expression) };
  });
}

/**
 * Composes a parsed root document with all resolvable imported documents.
 * Imports are deliberately not removed from the returned document: the source
 * remains valid UVL and can still be saved/exported as the editable root file.
 */
export function composeUvlDocument(
  rootDocument: UvlDocument,
  sources: UvlSubmodelSources | undefined,
  rootSource = rootDocument.source
): UvlCompositionResult {
  // `undefined` means that the caller has not opted into file resolution yet
  // (for example, a legacy chatbot call that only wants the root graph).  An
  // explicit empty map means "resolve imports and report missing files".
  const sourceRegistryProvided = sources !== undefined;
  const entries = sourceEntries(sources);
  const sourceMap = entries.reduce<Record<string, string>>((result, entry) => {
    result[entry.originalPath] = entry.source;
    return result;
  }, {});
  const documents = new Map<string, UvlDocument>([[ROOT_DOCUMENT_PATH, rootDocument]]);
  const diagnostics: UvlCompositionDiagnostic[] = [...rootDocument.diagnostics, ...validateUvlSemantics(rootDocument)];
  const resolvedImports: UvlResolvedImport[] = [];
  const importsByParent = new Map<string, ImportContext[]>();
  const contextsByPath = new Map<string, ImportContext[]>();
  const allContexts: ImportContext[] = [];
  const unknownReferenceKeys = new Set<string>();
  const visiting = new Set<string>();
  const parsedSources = new Map<string, { source: string; document: UvlDocument }>();

  const visit = (document: UvlDocument, parentPath: string, chain: string[], parentPrefix = ""): void => {
    const contexts: ImportContext[] = [];
    importsByParent.set(parentPath, contexts);
    contextsByPath.set(parentPath, contexts);
    document.imports.forEach((item) => {
      const namespace = item.namespace.name;
      const resolved = resolveUvlImportSource(namespace, sources);
      if (!resolved) {
        if (sourceRegistryProvided) {
          diagnostics.push(importDiagnostic(item, "IMPORT_SOURCE_MISSING", `Imported UVL submodel '${namespace}' was not found in the loaded sources.`));
        }
        resolvedImports.push({ namespace, alias: item.alias?.name, parentPath, missing: true });
        return;
      }
      const path = normalizeUvlSubmodelPath(resolved.path) || resolved.path;
      if (chain.includes(path) || path === parentPath) {
        diagnostics.push(importDiagnostic(item, "IMPORT_CYCLE", `Cyclic UVL import detected: ${[...chain, path].join(" -> ")}.`));
        resolvedImports.push({ namespace, alias: item.alias?.name, path: resolved.path, source: resolved.source, parentPath, missing: false });
        return;
      }
      let parsed = parsedSources.get(path);
      if (!parsed) {
        const parseResult = parseAndValidateUvl(resolved.source);
        parsed = { source: resolved.source, document: parseResult.document };
        parsedSources.set(path, parsed);
        documents.set(path, parsed.document);
        parseResult.diagnostics.forEach((itemDiagnostic) => diagnostics.push(importedDiagnostic(itemDiagnostic, resolved.path)));
      }
      const context: ImportContext = {
        item,
        path,
        source: parsed.source,
        document: parsed.document,
        prefixes: importPrefixes(item),
        prefix: [parentPrefix, importPrefix(item)].filter(Boolean).join("."),
      };
      if (parsed.document.namespace && parsed.document.namespace.name.toLowerCase() !== namespace.toLowerCase()) {
        diagnostics.push(importDiagnostic(
          item,
          "IMPORT_NAMESPACE_MISMATCH",
          `Import '${namespace}' resolves to '${resolved.path}', whose namespace is '${parsed.document.namespace.name}'.`,
          "warning"
        ));
      }
      contexts.push(context);
      allContexts.push(context);
      resolvedImports.push({ namespace, alias: item.alias?.name, path: resolved.path, source: resolved.source, document: parsed.document, parentPath, missing: false });
      if (!visiting.has(path)) {
        visiting.add(path);
        visit(parsed.document, path, [...chain, path], context.prefix);
        visiting.delete(path);
      }
    });
    contexts.forEach((context) => validateImportedReferences(document.root, document, context, diagnostics, unknownReferenceKeys));
  };

  visiting.add(ROOT_DOCUMENT_PATH);
  visit(rootDocument, ROOT_DOCUMENT_PATH, [ROOT_DOCUMENT_PATH]);
  visiting.delete(ROOT_DOCUMENT_PATH);

  const rootContexts = contextsByPath.get(ROOT_DOCUMENT_PATH) || [];
  const composedRoot = rootDocument.root
    ? composeFeature(rootDocument.root, rootContexts, contextsByPath, new Set())
    : undefined;
  const composedConstraints = [...rootDocument.constraints];
  const appendedConstraintContexts = new Set<string>();
  allContexts.forEach((context) => {
    const key = `${context.path}|${context.prefix.toLowerCase()}`;
    if (appendedConstraintContexts.has(key)) return;
    appendedConstraintContexts.add(key);
    composedConstraints.push(...qualifiedConstraints(context.document, context.prefix));
  });

  // Imported constraints may mention nested imported features.  They are
  // useful in the composed graph even when the source parser cannot see those
  // symbols in the root document; the composition diagnostics remain the
  // authoritative validity result.
  const document: UvlDocument = {
    ...rootDocument,
    source: rootSource,
    root: composedRoot,
    constraints: composedConstraints,
    diagnostics: (() => {
      const keys = new Set(rootDocument.diagnostics.map((item) => `${item.code}|${item.location.line}|${item.location.column}|${item.message}`));
      return [
        ...rootDocument.diagnostics,
        ...diagnostics.filter((item) => {
          const key = `${item.code}|${item.location.line}|${item.location.column}|${item.message}`;
          return item.sourcePath === undefined && !keys.has(key);
        }),
      ];
    })(),
  };
  const uniqueDiagnostics = diagnostics.filter((current, index, all) => {
    const key = `${current.sourcePath || ""}|${current.code}|${current.location.line}|${current.location.column}|${current.message}`;
    return all.findIndex((candidate) => `${candidate.sourcePath || ""}|${candidate.code}|${candidate.location.line}|${candidate.location.column}|${candidate.message}` === key) === index;
  });
  const errors = uniqueDiagnostics.filter((item) => item.severity === "error");
  const warnings = uniqueDiagnostics.filter((item) => item.severity === "warning");
  return {
    document,
    rootDocument,
    documents,
    resolvedImports,
    diagnostics: uniqueDiagnostics,
    errors,
    warnings,
    valid: errors.length === 0,
    sourceMap,
  };
}

/** Parses and composes an editable root source in one operation. */
export function composeUvlSources(rootSource: string, sources: UvlSubmodelSources = {}): UvlCompositionResult {
  const parsed = parseAndValidateUvl(rootSource);
  const composition = composeUvlDocument(parsed.document, sources, rootSource);
  const diagnostics = [...parsed.diagnostics];
  const keys = new Set(diagnostics.map((item) => `${item.code}|${item.location.line}|${item.location.column}|${item.message}`));
  composition.diagnostics.forEach((item) => {
    const key = `${item.code}|${item.location.line}|${item.location.column}|${item.message}`;
    if (!keys.has(key)) {
      diagnostics.push(item);
      keys.add(key);
    }
  });
  const errors = diagnostics.filter((item) => item.severity === "error");
  const warnings = diagnostics.filter((item) => item.severity === "warning");
  return { ...composition, diagnostics, errors, warnings, valid: errors.length === 0 };
}

// Singular alias kept for callers that work with one root source plus an
// imported-source registry.
export const composeUvlSource = composeUvlSources;
