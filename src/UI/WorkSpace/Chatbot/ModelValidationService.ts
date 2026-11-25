import { Language } from "../../../Domain/ProductLineEngineering/Entities/Language";
import { Project } from "../../../Domain/ProductLineEngineering/Entities/Project";
import { PROJECTS_CLIENT } from "../../../Infraestructure/AxiosConfig";

type RecordData = Record<string, unknown>;
type ValidationStatus = "cumple" | "incumple" | "no_evaluable" | "no_aplica";

type ValidationReport = {
  schemaVersion: 1;
  snapshotId: string;
  coverage: { effectiveScope: "complete" | "partial"; models: unknown[] };
  rules: { ruleId: string; status: ValidationStatus }[];
  findings: {
    ruleIds: string[];
    status: ValidationStatus;
    description: string;
    location: { path: string; modelId: string | null; elementId: string | null; referenceId: string | null };
    evidence: { targetModelId?: string | null; targetElementId?: string | null; criterionIds?: string[]; variableIds?: string[];
      changeIds?: string[]; changeIndices?: number[]; historyIds?: string[]; linkIds?: string[]; versionIds?: string[]; versionId?: string; fromVersionId?: string | null; toVersionId?: string | null };
  }[];
};

type TransitionCapture = {
  schemaVersion: 1;
  projectId: string;
  snapshotId: string;
  scope: "complete";
  project: RecordData;
  metamodels?: RecordData;
};

type EntityAddress = { kind: "model" | "element" | "relationship"; modelId: string; id: string };
type CorrespondenceReport = ValidationReport & { kind: "correspondences"; projectId: string; profileId: string | null };
type ConstraintReport = ValidationReport & { kind: "constraints"; projectId: string; profileId: string | null };
type VersionReport = ValidationReport & { kind: "versions"; projectId: string; contextId: string | null;
  versionCoverage: { catalogScope: "complete" | "partial" | null; historyScope: "complete" | "partial" | null; revisionCount: number } };
type TraceReport = ValidationReport & { kind: "traceability"; projectId: string; beforeSnapshotId: string; attemptId: string | null; contextId: string | null;
  traceCoverage: { contextAccepted: boolean; contextScope: "complete" | "partial" | null; observedChangeCount: number };
  traces: { id: string; changeIndex: number; operation: "created" | "updated" | "deleted"; entity: EntityAddress;
    originRefs: { kind: "origin"; catalog: "attempt" | "context"; id: string }[]; historyIds: string[] }[] };
type TransitionReport = {
  schemaVersion: 1;
  kind: "transition";
  projectId: string;
  beforeSnapshotId: string;
  afterSnapshotId: string;
  coverage: {
    before: { effectiveScope: "complete" | "partial" };
    after: { effectiveScope: "complete" | "partial" };
  };
  changes: {
    operation: "created" | "updated" | "deleted";
    entity: EntityAddress;
    changedFields: string[];
    uncertainFields?: string[];
  }[];
  impacts: {
    changeIndex: number;
    phase: "before" | "after";
    dependent: EntityAddress;
    target: EntityAddress;
    field: string;
  }[];
  rules: { ruleId: string; status: ValidationStatus }[];
  correspondenceReviews?: { status: ValidationStatus; code: string }[];
  structuralValidation?: {
    delta: { introduced: number; persisting: number; resolved: number; unclassified: number };
  };
  correspondenceValidation?: CorrespondenceReport;
  constraintValidation?: ConstraintReport;
  versionValidation?: VersionReport;
  traceabilityValidation?: TraceReport;
  findings: {
    ruleIds: string[];
    status: ValidationStatus;
    description: string;
    phase: "before" | "after";
    path: string;
    evidence: { dependent?: EntityAddress; target?: EntityAddress };
  }[];
};

function isRecord(value: unknown): value is RecordData {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mapRecords(value: unknown, project: (record: RecordData) => RecordData) {
  if (Array.isArray(value)) {
    return value.map(record => isRecord(record) ? project(record) : null);
  }
}

function buildCapture(project: Project, languages: Language[], snapshotId: string, includeContent = false) {
  const languageIds = new Set<string>();
  const content = (record: RecordData) => includeContent ? record : {};
  const models = (container: RecordData) => mapRecords(container.models, model => {
    const { id, languageId, sourceModelIds } = model;
    if (typeof languageId === "string" || typeof languageId === "number") {
      languageIds.add(String(languageId));
    }
    return {
      ...content(model), id, languageId, sourceModelIds,
      elements: mapRecords(model.elements, element => ({
        ...content(element),
        id: element.id, type: element.type, parentId: element.parentId, sourceModelElements: element.sourceModelElements
      })),
      relationships: mapRecords(model.relationships, relationship => ({
        ...content(relationship),
        id: relationship.id, type: relationship.type, sourceId: relationship.sourceId, targetId: relationship.targetId
      }))
    };
  });
  const section = (value: unknown) => isRecord(value) ? { models: models(value) } : undefined;
  const productLines = mapRecords(project.productLines, line => {
    const engineering = line.applicationEngineering;
    return {
      scope: section(line.scope),
      domainEngineering: section(line.domainEngineering),
      applicationEngineering: isRecord(engineering) ? {
        models: models(engineering),
        applications: mapRecords(engineering.applications, application => ({
          models: models(application),
          adaptations: mapRecords(application.adaptations, adaptation => ({
            models: models(adaptation)
          }))
        }))
      } : undefined
    };
  });
  const metamodels = Object.fromEntries(languages
    .map(language => [String(language.id ?? language.name), language.abstractSyntax] as const)
    .filter(([id]) => languageIds.has(id)));

  return {
    schemaVersion: 1 as const,
    projectId: project.id,
    snapshotId,
    scope: "complete" as const,
    project: { productLines },
    metamodels
  };
}

export async function validateModelSnapshot(project: Project, languages: Language[], snapshotId: string) {
  const capture = JSON.stringify(buildCapture(project, languages, snapshotId));
  const { data } = await PROJECTS_CLIENT.post<ValidationReport>("/api/ai/validate-snapshot", capture, {
    timeout: 10000,
    headers: { "Content-Type": "application/json" }
  });
  if (data?.schemaVersion !== 1 || data.snapshotId !== snapshotId) {
    throw new Error("Respuesta de validación inesperada.");
  }
  return data;
}

export function captureModelTransition(project: Project, snapshotId: string, languages: Language[] = []): TransitionCapture {
  const capture = buildCapture(project, languages, snapshotId, true);
  // Detach all nested values before the project can be modified by PLAN/PATCH.
  return JSON.parse(JSON.stringify(capture));
}

export async function validateModelTransition(before: TransitionCapture, after: TransitionCapture, correspondenceProfile?: RecordData,
                                               constraintProfile?: RecordData, versionContext?: RecordData,
                                               traceOptions?: { attemptContext?: RecordData; traceContext?: RecordData }) {
  const capture = JSON.stringify({ schemaVersion: 1, before, after, correspondenceProfile, constraintProfile, versionContext,
    attemptContext: traceOptions?.attemptContext, traceContext: traceOptions?.traceContext });
  const { data } = await PROJECTS_CLIENT.post<TransitionReport>("/api/ai/validate-transition", capture, {
    timeout: 10000,
    headers: { "Content-Type": "application/json" }
  });
  if (data?.schemaVersion !== 1 || data.kind !== "transition" || data.projectId !== before.projectId ||
      data.beforeSnapshotId !== before.snapshotId || data.afterSnapshotId !== after.snapshotId) {
    throw new Error("Respuesta de validación de cambios inesperada.");
  }
  return data;
}

export function parseCorrespondenceProfile(text: string): RecordData {
  const profile: unknown = JSON.parse(text);
  const fields = ["schemaVersion", "id", "correspondences", "dependencies", "requiredCorrespondences"];
  if (!isRecord(profile) || profile.schemaVersion !== 1 || typeof profile.id !== "string" ||
      !profile.id.trim() || profile.id !== profile.id.trim() || Object.keys(profile).some(key => !fields.includes(key)) ||
      !fields.slice(2).every(key => Array.isArray(profile[key]))) {
    throw new Error("El archivo debe definir los criterios RG06–RG08 en formato versión 1.");
  }
  return profile;
}

export function parseConstraintProfile(text: string): RecordData {
  const profile: unknown = JSON.parse(text);
  const fields = ["schemaVersion", "id", "variables", "constraints", "dependencies", "conditions"];
  if (!isRecord(profile) || profile.schemaVersion !== 1 || typeof profile.id !== "string" ||
      !profile.id.trim() || profile.id !== profile.id.trim() || Object.keys(profile).some(key => !fields.includes(key)) ||
      !fields.slice(2).every(key => Array.isArray(profile[key]))) {
    throw new Error("El archivo debe definir los criterios RG09–RG12 en formato versión 1.");
  }
  return profile;
}

export function parseVersionContext(text: string, projectId: string): RecordData {
  const context: unknown = JSON.parse(text);
  const lists = ["revisions", "compatibility", "correspondences", "changes", "historicalReferences"];
  const fields = ["schemaVersion", "id", "projectId", "scope", "historyScope", ...lists];
  if (!isRecord(context) || context.schemaVersion !== 1 || typeof context.id !== "string" ||
      !context.id.trim() || context.id !== context.id.trim() || context.projectId !== projectId ||
      !["complete", "partial"].includes(String(context.scope)) || !["complete", "partial"].includes(String(context.historyScope)) ||
      Object.keys(context).some(key => !fields.includes(key)) || !lists.every(key => Array.isArray(context[key]))) {
    throw new Error("El archivo debe contener un contexto RG17–RG19 versión 1 para este proyecto, con ámbitos y listas explícitos.");
  }
  return context;
}

export function parseTraceContext(text: string, projectId: string): RecordData {
  const context: unknown = JSON.parse(text);
  const lists = ["origins", "requirements", "history", "links"];
  const fields = ["schemaVersion", "id", "projectId", "scope", ...lists];
  if (!isRecord(context) || context.schemaVersion !== 1 || typeof context.id !== "string" || !context.id.trim() ||
      context.id.length > 256 || context.id !== context.id.trim() || context.projectId !== projectId || !["complete", "partial"].includes(String(context.scope)) ||
      Object.keys(context).some(key => !fields.includes(key)) || !lists.every(key => Array.isArray(context[key]))) {
    throw new Error("El archivo debe contener un contexto RG20–RG22 versión 1 para este proyecto, con ámbito y listas explícitos.");
  }
  return context;
}

const validationGroups = {
  snapshot: { title: "Estructura", rules: {
    RG01: "Existencia de los destinos", RG02: "Integridad de las referencias", RG03: "IDs únicos por modelo",
    RG04: "Relaciones compatibles con el metamodelo", RG05: "Correspondencias de origen"
  } },
  correspondences: { title: "Correspondencias", rules: {
    RG06: "Atributos de las correspondencias", RG07: "Dependencias declaradas", RG08: "Cardinalidad de las correspondencias"
  } },
  constraints: { title: "Restricciones", rules: {
    RG09: "Compatibilidad de restricciones", RG10: "Dependencias y restricciones",
    RG11: "Condiciones de un mismo concepto", RG12: "Coherencia de valores entre modelos"
  } },
  transition: { title: "Cambios", rules: {
    RG13: "Impacto de los cambios", RG14: "Correspondencias afectadas",
    RG15: "Referencias tras una eliminación", RG16: "Estructura después del cambio"
  } },
  versions: { title: "Versiones", rules: {
    RG17: "Compatibilidad de versiones", RG18: "Coherencia del historial", RG19: "Referencias históricas"
  } },
  traceability: { title: "Trazabilidad", rules: {
    RG20: "Origen de los cambios", RG21: "Vínculos con el historial", RG22: "Validez de los enlaces de trazabilidad"
  } }
};

export type ValidationGroup = keyof typeof validationGroups;
export const validationGroupOrder = Object.keys(validationGroups) as ValidationGroup[];
export const validationStatusOrder: ValidationStatus[] = ["incumple", "no_evaluable", "cumple", "no_aplica"];

type ValidationFinding = Pick<ValidationReport["findings"][number], "ruleIds" | "status" | "description"> & { context?: string };

export type ValidationSection = {
  group: ValidationGroup;
  title: string;
  rules: { ruleId: string; label: string; status: ValidationStatus }[];
  findings: ValidationFinding[];
  notes: string[];
  unavailable?: boolean;
};

const findingLimit = 10;

function makeSection(group: ValidationGroup, reportedRules: ValidationReport["rules"], findings: ValidationFinding[], notes: string[]) {
  const definition = validationGroups[group];
  const statuses = new Map(reportedRules.map(rule => [rule.ruleId, rule.status]));
  if (reportedRules.length !== statuses.size || reportedRules.some(rule => !validationStatusOrder.includes(rule.status))) {
    throw new Error("El informe contiene reglas inválidas.");
  }
  const rules = Object.entries(definition.rules).map(([ruleId, label]) => ({
    ruleId, label, status: statuses.get(ruleId) ?? "no_evaluable" as const
  }));
  const missing = rules.filter(rule => !statuses.has(rule.ruleId)).map(rule => rule.ruleId);
  const allowed = new Set(rules.map(rule => rule.ruleId));
  const ordered = findings.filter(finding =>
    validationStatusOrder.includes(finding.status) && finding.ruleIds.some(id => allowed.has(id))
  ).sort((left, right) => validationStatusOrder.indexOf(left.status) - validationStatusOrder.indexOf(right.status));
  const sectionNotes = [...notes];
  if (missing.length) sectionNotes.push(`El backend no incluyó estas reglas: ${missing.join(", ")}.`);
  if (ordered.length > findingLimit) sectionNotes.push(`${ordered.length - findingLimit} hallazgos adicionales.`);
  return { group, title: definition.title, rules, findings: ordered.slice(0, findingLimit), notes: sectionNotes };
}

export function unavailableValidationSection(group: ValidationGroup, reason: string): ValidationSection {
  const definition = validationGroups[group];
  return {
    group, title: definition.title, unavailable: true, findings: [], notes: [reason],
    rules: Object.entries(definition.rules).map(([ruleId, label]) => ({ ruleId, label, status: "no_evaluable" }))
  };
}

function entityLabel(entity: EntityAddress) {
  return entity.kind === "model" ? entity.modelId : `${entity.modelId}/${entity.id}`;
}

function locationFinding(finding: ValidationReport["findings"][number], extraIds: (string | null | undefined)[] = []): ValidationFinding {
  const { path, modelId, elementId, referenceId } = finding.location;
  const { targetModelId, targetElementId } = finding.evidence;
  const origin = [modelId, elementId ?? referenceId].filter(Boolean).join("/");
  const target = [targetModelId, targetElementId].filter(Boolean).join("/");
  const context = [origin, target].filter(Boolean).join(" → ");
  return {
    ruleIds: finding.ruleIds, status: finding.status, description: finding.description,
    context: [context || (path !== "/project" ? path : ""), extraIds.filter(Boolean).join(", ")].filter(Boolean).join(" · ")
  };
}

export function summarizeSnapshotValidation(report: ValidationReport) {
  const scope = report.coverage.effectiveScope === "complete" ? "completa" : "parcial";
  return makeSection("snapshot", report.rules, report.findings.map(finding => locationFinding(finding)),
    [`Captura ${scope} · ${report.coverage.models.length} modelos revisados`]);
}

type ExpectedCapture = { projectId: string; snapshotId: string };

function matchesCapture(report: CorrespondenceReport | ConstraintReport | VersionReport | TraceReport | undefined, expected: ExpectedCapture) {
  return report?.schemaVersion === 1 && report.projectId === expected.projectId && report.snapshotId === expected.snapshotId;
}

export function summarizeCorrespondenceValidation(report: CorrespondenceReport | undefined, expected: ExpectedCapture & { profileId: string | null }) {
  const unavailable = () => unavailableValidationSection("correspondences", "No se recibió un informe de correspondencias válido para esta captura.");
  try {
    if (!matchesCapture(report, expected) || report.kind !== "correspondences" ||
        (report.profileId !== expected.profileId && report.rules.some(rule => rule.status !== "no_evaluable"))) return unavailable();
    return makeSection("correspondences", report.rules, report.findings.map(finding => locationFinding(finding)),
      [`Criterios: ${report.profileId ?? "sin criterios cargados"}`]);
  } catch { return unavailable(); }
}

export function summarizeConstraintValidation(report: ConstraintReport | undefined, expected: ExpectedCapture & { profileId: string | null }) {
  const unavailable = () => unavailableValidationSection("constraints", "No se recibió un informe de restricciones válido para esta captura.");
  try {
    if (!matchesCapture(report, expected) || report.kind !== "constraints" ||
        (report.profileId !== expected.profileId && report.rules.some(rule => rule.status !== "no_evaluable"))) return unavailable();
    const notes = [`Criterios: ${report.profileId ?? "sin criterios cargados"}`];
    if (report.profileId) notes.push("Evaluación limitada a los criterios booleanos cargados.");
    return makeSection("constraints", report.rules, report.findings.map(finding =>
      locationFinding(finding, [...(finding.evidence.criterionIds ?? []), ...(finding.evidence.variableIds ?? [])])), notes);
  } catch { return unavailable(); }
}

export function summarizeVersionValidation(report: VersionReport | undefined, expected: ExpectedCapture & { contextId: string | null }) {
  const unavailable = () => unavailableValidationSection("versions", "No se recibió un informe de versiones válido para esta captura.");
  try {
    if (!matchesCapture(report, expected) || report.kind !== "versions" ||
        (report.contextId !== expected.contextId && report.rules.some(rule => rule.status !== "no_evaluable"))) return unavailable();
    const notes = [`Contexto: ${report.contextId ?? "sin contexto histórico cargado"}`];
    if (report.contextId) {
      const coverage = report.versionCoverage;
      if (!["complete", "partial"].includes(coverage.catalogScope) || !["complete", "partial"].includes(coverage.historyScope) ||
          !Number.isInteger(coverage.revisionCount) || coverage.revisionCount < 0) return unavailable();
      notes.push(`Catálogo ${coverage.catalogScope === "complete" ? "completo" : "parcial"} · ${coverage.revisionCount} revisiones aportadas` +
        ` · Historial ${coverage.historyScope === "complete" ? "completo" : "parcial"}.`);
    }
    const findings = report.findings.map(finding => {
      const evidence = finding.evidence;
      return locationFinding(finding, [...(evidence.changeIds ?? []), ...(evidence.linkIds ?? []), ...(evidence.versionIds ?? []),
        evidence.versionId, evidence.fromVersionId, evidence.toVersionId]);
    });
    return makeSection("versions", report.rules, findings, notes);
  } catch { return unavailable(); }
}

export function summarizeTraceValidation(report: TraceReport | undefined, expected: ExpectedCapture & {
  beforeSnapshotId: string; attemptId: string; contextId: string | null; changes: TransitionReport["changes"];
}) {
  const unavailable = () => unavailableValidationSection("traceability", "No se recibió un informe de trazabilidad válido para este intento.");
  try {
    if (!matchesCapture(report, expected) || report.kind !== "traceability" ||
        report.beforeSnapshotId !== expected.beforeSnapshotId || report.attemptId !== expected.attemptId ||
        report.contextId !== expected.contextId) return unavailable();
    const coverage = report.traceCoverage;
    if (!Number.isInteger(coverage.observedChangeCount) || coverage.observedChangeCount < 0 ||
        typeof coverage.contextAccepted !== "boolean" || ![null, "complete", "partial"].includes(coverage.contextScope) ||
        !Array.isArray(report.traces) || coverage.observedChangeCount !== expected.changes.length ||
        new Set(report.traces.map(trace => trace.changeIndex)).size !== report.traces.length ||
        report.traces.some(trace => {
          const change = expected.changes[trace.changeIndex];
          return !Number.isInteger(trace.changeIndex) || !change || trace.operation !== change.operation ||
            trace.entity.kind !== change.entity.kind || trace.entity.modelId !== change.entity.modelId || trace.entity.id !== change.entity.id;
        }) ||
        (report.rules.some(rule => ["RG20", "RG21"].includes(rule.ruleId) && rule.status === "cumple") &&
          report.traces.length !== coverage.observedChangeCount)) return unavailable();

    const notes = [
      `${coverage.observedChangeCount} ${coverage.observedChangeCount === 1 ? "cambio observado" : "cambios observados"}`,
      `Contexto: ${coverage.contextAccepted ? report.contextId : "sin contexto de enlaces evaluable"}.`
    ];
    for (const trace of report.traces.slice(0, 5)) {
      notes.push(`${operationLabels[trace.operation]} de ${entityLabels[trace.entity.kind]} ${entityLabel(trace.entity)}` +
        ` · origen: ${trace.originRefs.map(ref => ref.id).join(", ") || "no evaluable"}` +
        ` · historial: ${trace.historyIds.join(", ") || "sin vínculo verificado"}.`);
    }
    if (report.traces.length > 5) notes.push(`${report.traces.length - 5} trazas adicionales.`);
    const findings = report.findings.map(finding => locationFinding(finding, [
      ...(finding.evidence.linkIds ?? []), ...(finding.evidence.historyIds ?? []),
      ...(finding.evidence.changeIndices ?? []).map(index => `cambio ${index}`)
    ]));
    return makeSection("traceability", report.rules, findings, notes);
  } catch { return unavailable(); }
}

const operationLabels = { created: "Creación", updated: "Modificación", deleted: "Eliminación" };
const entityLabels = { model: "modelo", element: "elemento", relationship: "relación" };

export function summarizeTransitionValidation(report: TransitionReport) {
  const scopeLabel = (scope: string) => scope === "complete" ? "completa" : "parcial";
  const dependents = new Set(report.impacts.map(impact => JSON.stringify(impact.dependent)));
  const notes = [
    `Capturas ${scopeLabel(report.coverage.before.effectiveScope)} → ${scopeLabel(report.coverage.after.effectiveScope)}` +
    ` · ${report.changes.length} cambio${report.changes.length === 1 ? "" : "s"}` +
    ` · ${dependents.size} dependiente${dependents.size === 1 ? "" : "s"} potencial${dependents.size === 1 ? "" : "es"}`
  ];
  const delta = report.structuralValidation?.delta;
  if (delta) notes.push(`Hallazgos estructurales · nuevos: ${delta.introduced} · anteriores: ${delta.persisting}` +
    ` · resueltos: ${delta.resolved} · sin clasificar: ${delta.unclassified}`);
  const reviews = report.correspondenceReviews;
  if (reviews?.length) notes.push(`Correspondencias · pendientes de revisión: ${reviews.filter(review => review.code === "correspondence_review_required").length}` +
    ` · inválidas: ${reviews.filter(review => review.status === "incumple").length}` +
    ` · retiradas: ${reviews.filter(review => review.code === "correspondence_removed").length}`);
  for (const change of report.changes.slice(0, 5)) {
    const fields = change.changedFields.length ? ` · campos: ${change.changedFields.join(", ")}` : "";
    const uncertain = change.uncertainFields?.length ? ` · datos incompletos: ${change.uncertainFields.join(", ")}` : "";
    const operation = !change.changedFields.length && change.uncertainFields?.length ? "Posible modificación" : operationLabels[change.operation];
    notes.push(`${operation} de ${entityLabels[change.entity.kind]} ${entityLabel(change.entity)}${fields}${uncertain}`);
  }
  if (report.changes.length > 5) notes.push(`${report.changes.length - 5} cambios adicionales.`);

  const impacts = new Map<string, { impact: TransitionReport["impacts"][number]; phases: Set<string> }>();
  for (const impact of report.impacts) {
    const key = JSON.stringify([impact.changeIndex, impact.dependent, impact.target, impact.field]);
    const entry = impacts.get(key) ?? { impact, phases: new Set<string>() };
    entry.phases.add(impact.phase === "before" ? "antes" : "después");
    impacts.set(key, entry);
  }
  for (const { impact, phases } of Array.from(impacts.values()).slice(0, 5)) {
    notes.push(`Impacto potencial · ${entityLabel(impact.target)} → ${entityLabel(impact.dependent)}` +
      ` (${impact.field}; ${Array.from(phases).join(" y ")})`);
  }
  if (impacts.size > 5) notes.push(`${impacts.size - 5} impactos potenciales adicionales.`);

  const findings = report.findings.map(finding => {
    const { dependent, target } = finding.evidence;
    return {
      ruleIds: finding.ruleIds, status: finding.status, description: finding.description,
      context: dependent && target ? `${entityLabel(dependent)} → ${entityLabel(target)}` : finding.path
    };
  });
  return makeSection("transition", report.rules, findings, notes);
}
