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
    evidence: { targetModelId?: string | null; targetElementId?: string | null };
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

function buildCapture(project: Project, languages: Language[], snapshotId: string) {
  const languageIds = new Set<string>();
  const models = (container: RecordData) => mapRecords(container.models, model => {
    const { id, languageId, sourceModelIds } = model;
    if (typeof languageId === "string" || typeof languageId === "number") {
      languageIds.add(String(languageId));
    }
    return {
      id, languageId, sourceModelIds,
      elements: mapRecords(model.elements, ({ id, type, parentId, sourceModelElements }) => ({
        id, type, parentId, sourceModelElements
      })),
      relationships: mapRecords(model.relationships, ({ id, type, sourceId, targetId }) => ({
        id, type, sourceId, targetId
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
    schemaVersion: 1,
    projectId: project.id,
    snapshotId,
    scope: "complete",
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

export function formatValidationLog(prefix: string, report: ValidationReport) {
  const scope = report.coverage.effectiveScope === "complete" ? "completa" : "parcial";
  const summary = report.rules.map(rule => `${rule.ruleId} ${rule.status.replace("_", " ")}`).join(" · ");
  const lines = [`${prefix} Captura ${scope} · ${report.coverage.models.length} modelos revisados`, summary];
  const limit = 10;
  const violations = report.findings.filter(finding => finding.status === "incumple");
  const otherFindings = report.findings.filter(finding => finding.status !== "incumple");
  for (const finding of [...violations, ...otherFindings].slice(0, limit)) {
    const { path, modelId, elementId, referenceId } = finding.location;
    const { targetModelId, targetElementId } = finding.evidence;
    const origin = [modelId, elementId ?? referenceId].filter(Boolean).join("/");
    const target = [targetModelId, targetElementId].filter(Boolean).join("/");
    const context = [origin, target].filter(Boolean).join(" → ");
    const status = finding.status.replace("_", " ");
    lines.push(`[${finding.ruleIds.join(", ")}] ${status} · ${finding.description} (${context || path})`);
  }
  if (report.findings.length > limit) {
    lines.push(`${report.findings.length - limit} hallazgos adicionales.`);
  }
  return lines.join("\n");
}
