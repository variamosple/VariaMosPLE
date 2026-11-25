import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ProjectService from "../../../Application/Project/ProjectService";
import { PROJECTS_CLIENT } from "../../../Infraestructure/AxiosConfig";
import Chatbot from "./Chatbot";
import * as validationService from "./ModelValidationService";

jest.mock("../../../Infraestructure/AxiosConfig", () => ({
  PROJECTS_CLIENT: { post: jest.fn() }
}));
jest.mock("./OrganicRAGService", () => ({ getOrganicRAG: jest.fn() }));
jest.mock("../../../DataProvider/Services/collab/treeCollaborationService", () => ({}));

const post = PROJECTS_CLIENT.post as jest.Mock;

function attemptCard(attempt = 1) {
  return screen.getByLabelText(`Validación del intento ${attempt}`) as HTMLDetailsElement;
}

function ruleStatus(ruleId: string, attempt = 1) {
  const code = within(attemptCard(attempt)).getByText(ruleId, { selector: ".validation-rule-heading code" });
  return code.closest(".validation-rule-heading").querySelector(".validation-status").textContent;
}

function expectRuleStatuses(expected: Record<string, string>, attempt = 1) {
  for (const [ruleId, status] of Object.entries(expected)) {
    expect(ruleStatus(ruleId, attempt)).toBe(status);
  }
}

const criteria = {
  schemaVersion: 1, id: "ui-explicit-criteria",
  correspondences: [{ id: "matching-types", source: { modelId: "adapted" }, target: { modelId: "domain" },
    checks: [{ source: { path: ["type"] }, target: { path: ["type"] }, operator: "equals" }] }],
  dependencies: [{ id: "variant-origin", source: { modelId: "adapted", elementId: "variant" },
    target: { modelId: "domain", elementId: "original" }, conditions: [], requireOriginLink: true }],
  requiredCorrespondences: [{ id: "variant-requires-node", source: { modelId: "adapted", elementType: "Node" },
    target: { modelId: "domain", elementType: "Node" }, minimum: 1, maximum: 1 }]
};

function correspondenceReport(body: string, overrides: Record<string, unknown> = {}) {
  const request = JSON.parse(body);
  return {
    schemaVersion: 1, kind: "correspondences", projectId: request.after.projectId, snapshotId: request.after.snapshotId,
    profileId: request.correspondenceProfile?.id ?? null,
    coverage: { effectiveScope: "complete", models: [{}, {}] },
    rules: ["RG06", "RG07", "RG08"].map(ruleId => ({ ruleId, status: request.correspondenceProfile ? "cumple" : "no_evaluable" })),
    findings: request.correspondenceProfile ? [] : [{
      ruleIds: ["RG06", "RG07", "RG08"], status: "no_evaluable", description: "Faltan criterios explícitos para evaluar RG06 a RG08.",
      location: { path: "/project", modelId: null, elementId: null, referenceId: null }, evidence: {}
    }],
    ...overrides
  };
}

const restrictionCriteria = {
  schemaVersion: 1, id: "ui-boolean-criteria",
  variables: [{ id: "enabled", bindings: [
    { modelId: "domain", elementId: "original", attribute: { path: ["enabled"] } },
    { modelId: "adapted", elementId: "variant", attribute: { path: ["enabled"] } }
  ] }],
  constraints: [
    { id: "base-enabled", modelId: "domain", expression: { var: "enabled" } },
    { id: "variant-enabled", modelId: "adapted", expression: { var: "enabled" } }
  ],
  dependencies: [], conditions: []
};

function constraintReport(body: string, overrides: Record<string, unknown> = {}) {
  const request = JSON.parse(body);
  return {
    schemaVersion: 1, kind: "constraints", projectId: request.after.projectId, snapshotId: request.after.snapshotId,
    profileId: request.constraintProfile?.id ?? null,
    coverage: { effectiveScope: "complete", models: [{}, {}] },
    rules: ["RG09", "RG10", "RG11", "RG12"].map(ruleId => ({ ruleId, status: request.constraintProfile ? "cumple" : "no_evaluable" })),
    findings: [], ...overrides
  };
}

async function loadRestrictionCriteria(value: object = restrictionCriteria) {
  const file = new File([JSON.stringify(value)], "restricciones.json", { type: "application/json" });
  fireEvent.change(screen.getByLabelText("Cargar criterios RG09–RG12"), { target: { files: [file] } });
  await screen.findByText(`Criterios RG09–RG12: ${(value as typeof restrictionCriteria).id}`);
}

const historyContext = {
  schemaVersion: 1, id: "ui-version-context", projectId: "project", scope: "complete", historyScope: "complete",
  revisions: [], compatibility: [], correspondences: [], changes: [], historicalReferences: []
};

function versionReport(body: string, overrides: Record<string, unknown> = {}) {
  const request = JSON.parse(body);
  return {
    schemaVersion: 1, kind: "versions", projectId: request.after.projectId, snapshotId: request.after.snapshotId,
    contextId: request.versionContext?.id ?? null, coverage: { effectiveScope: "complete", models: [{}, {}] },
    versionCoverage: { catalogScope: request.versionContext?.scope ?? null, historyScope: request.versionContext?.historyScope ?? null, revisionCount: 0 },
    rules: ["RG17", "RG18", "RG19"].map(ruleId => ({ ruleId, status: request.versionContext ? "no_aplica" : "no_evaluable" })),
    findings: [], ...overrides
  };
}

async function loadHistoryContext(value: object = historyContext) {
  const file = new File([JSON.stringify(value)], "versiones.json", { type: "application/json" });
  fireEvent.change(screen.getByLabelText("Cargar contexto RG17–RG19"), { target: { files: [file] } });
  await screen.findByText(`Contexto RG17–RG19: ${(value as typeof historyContext).id}`);
}

const traceContext = { schemaVersion: 1, id: "ui-trace-context", projectId: "project", scope: "complete",
  origins: [], requirements: [], history: [], links: [] };

function traceReport(body: string, changes: any[], overrides: Record<string, unknown> = {}) {
  const request = JSON.parse(body);
  return { schemaVersion: 1, kind: "traceability", projectId: request.after.projectId, snapshotId: request.after.snapshotId,
    beforeSnapshotId: request.before.snapshotId, attemptId: request.attemptContext?.id ?? null, contextId: request.traceContext?.id ?? null,
    coverage: { effectiveScope: "complete", models: [{}, {}] },
    traceCoverage: { contextAccepted: !!request.traceContext, contextScope: request.traceContext?.scope ?? null, observedChangeCount: changes.length },
    rules: [{ ruleId: "RG20", status: "cumple" }, { ruleId: "RG21", status: request.traceContext ? "incumple" : "no_evaluable" },
      { ruleId: "RG22", status: request.traceContext ? "no_aplica" : "no_evaluable" }], findings: [],
    traces: changes.map((change, index) => ({ id: `trace-${index}`, changeIndex: index, entity: change.entity, operation: change.operation,
      originRefs: [{ kind: "origin", catalog: "attempt", id: request.attemptContext?.origin?.id ?? "unknown" }], historyIds: [] })), ...overrides };
}

async function loadTraceContext(value: object = traceContext) {
  const file = new File([JSON.stringify(value)], "trazas.json", { type: "application/json" });
  fireEvent.change(screen.getByLabelText("Cargar contexto RG20–RG22"), { target: { files: [file] } });
  await screen.findByText(`Contexto RG20–RG22: ${(value as typeof traceContext).id}`);
}

async function loadCriteria(value: object = criteria) {
  const file = new File([JSON.stringify(value)], "criterios.json", { type: "application/json" });
  fireEvent.change(screen.getByLabelText("Cargar criterios RG06–RG08"), { target: { files: [file] } });
  await screen.findByText(`Criterios RG06–RG08: ${(value as typeof criteria).id}`);
}

function transitionResponse(body: string, overrides: Record<string, unknown> = {}) {
  const request = JSON.parse(body);
  const changes = (overrides.changes ?? [{ operation: "created", entity: { kind: "model", modelId: "created", id: "created" }, changedFields: [] }]) as any[];
  return { data: {
    schemaVersion: 1, kind: "transition", projectId: request.before.projectId,
    beforeSnapshotId: request.before.snapshotId, afterSnapshotId: request.after.snapshotId,
    coverage: { before: { effectiveScope: "complete" }, after: { effectiveScope: "complete" } },
    changes,
    impacts: [], findings: [],
    rules: [{ ruleId: "RG13", status: "cumple" }, { ruleId: "RG14", status: "no_aplica" },
      { ruleId: "RG15", status: "no_aplica" }, { ruleId: "RG16", status: "cumple" }],
    correspondenceReviews: [],
    structuralValidation: { delta: { introduced: 0, persisting: 0, resolved: 0, unclassified: 0 } },
    correspondenceValidation: correspondenceReport(body),
    constraintValidation: constraintReport(body),
    versionValidation: versionReport(body),
    traceabilityValidation: traceReport(body, changes),
    ...overrides
  } };
}

function snapshotResponse(body: string) {
  const request = JSON.parse(body);
  return { data: {
    schemaVersion: 1, snapshotId: request.snapshotId,
    coverage: { effectiveScope: "complete", models: [{}, {}] },
    rules: [{ ruleId: "RG05", status: "cumple" }], findings: []
  } };
}

function renameResponse(body: string) {
  return transitionResponse(body, {
    rules: [{ ruleId: "RG13", status: "cumple" }, { ruleId: "RG14", status: "no_evaluable" },
      { ruleId: "RG15", status: "no_aplica" }, { ruleId: "RG16", status: "cumple" }],
    correspondenceReviews: [{ status: "no_evaluable", code: "correspondence_review_required" }],
    changes: [{ operation: "updated", entity: { kind: "element", modelId: "domain", id: "original" }, changedFields: ["name"] }],
    impacts: ["before", "after"].map(phase => ({
      changeIndex: 0, phase, field: "sourceModelElements",
      dependent: { kind: "element", modelId: "adapted", id: "variant" },
      target: { kind: "element", modelId: "domain", id: "original" }
    }))
  });
}

function setup(relationships: Record<string, unknown> = {}) {
  const language = {
    id: 7, name: "Test language", type: "DOMAIN",
    abstractSyntax: { elements: { Node: {} }, relationships }
  };
  const domain = {
    id: "domain", type: language.name, languageId: "7", name: "Domain",
    elements: [{ id: "original", name: "Original", type: "Node", properties: [] }],
    relationships: []
  };
  const adapted = {
    id: "adapted", languageId: "7", relationships: [],
    elements: [{
      id: "variant", name: "Variant", type: "Node", properties: [],
      sourceModelElements: [{ modelId: "domain", elementId: "original" }]
    }]
  };
  const domainModels = [domain];
  const project = {
    id: "project",
    productLines: [{
      scope: { models: [] },
      domainEngineering: { models: domainModels },
      applicationEngineering: {
        models: [],
        applications: [{ models: [], adaptations: [{ models: [adapted] }] }]
      }
    }]
  };
  const service = {
    project, languages: [language],
    createDomainEngineeringModel: jest.fn((_project, _type, _languageId, name: string) => {
      const model = { ...domain, id: "created", name, elements: [] };
      domainModels.push(model);
      return model;
    }),
    findModelById: () => domain,
    getTreeIdItemSelected: () => domain.id,
    getProject: () => project,
    getProjectInformation: () => null,
    raiseEventDomainEngineeringModel: jest.fn(),
    raiseEventUpdatedElement: jest.fn(),
    findModelElementById: (model: typeof domain, id: string) => model.elements.find(element => element.id === id),
    findModelRelationshipById: () => null,
    removeModelElementById: (model: typeof domain, id: string) => {
      model.elements = model.elements.filter(element => element.id !== id);
    },
    saveProject: jest.fn()
  };
  render(<Chatbot projectService={service as unknown as ProjectService} />);
  return { domain, domainModels, adapted, project, service, saveProject: service.saveProject };
}

function sendText(value: string) {
  const input = screen.getByRole("textbox") as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  return input;
}

function sendJson(value: object) {
  return sendText(JSON.stringify(value));
}

beforeEach(() => post.mockReset());
afterEach(() => jest.restoreAllMocks());

test("a model is created and saved while its validation is still pending", async () => {
  let respond: (result: unknown) => void;
  post.mockImplementation((url, body) => url === "/api/ai/validate-snapshot"
    ? new Promise(resolve => { respond = resolve; }) : Promise.resolve(transitionResponse(body)));
  const { domainModels, saveProject } = setup();
  const input = sendJson({ name: "New", elements: [{ name: "New node", type: "Node" }], relationships: [] });

  await screen.findByText("Modelo creado ✅");
  await waitFor(() => expect(input.disabled).toBe(false));
  expect(saveProject).toHaveBeenCalled();
  expect(domainModels[1].elements).toHaveLength(1);
  expect(post).toHaveBeenCalledTimes(2);
  expect(within(attemptCard()).getByText("Evaluando…")).toBeTruthy();
  await waitFor(() => expectRuleStatuses({ RG13: "Cumple", RG14: "No aplica", RG15: "No aplica", RG16: "Cumple" }));
  const [url, body] = post.mock.calls[0];
  expect(url).toBe("/api/ai/validate-snapshot");
  const capture = JSON.parse(body);
  const line = capture.project.productLines[0];
  expect(line.domainEngineering.models[1].elements[0]).toEqual({
    id: domainModels[1].elements[0].id, type: "Node", parentId: null
  });
  expect(line.applicationEngineering.applications[0].adaptations[0].models[0].id).toBe("adapted");
  expect(capture.metamodels["7"].elements.Node).toEqual({});
  const transition = JSON.parse(post.mock.calls.find(([path]) => path === "/api/ai/validate-transition")[1]);
  expect(transition.before.project.productLines[0].domainEngineering.models).toHaveLength(1);
  expect(transition.after.project.productLines[0].domainEngineering.models).toHaveLength(2);
  expect(transition.before.snapshotId).toBe("chat-1-before");
  expect(transition.after.snapshotId).toBe("chat-1-after");

  await act(async () => respond({
    data: {
      schemaVersion: 1, snapshotId: capture.snapshotId,
      coverage: { effectiveScope: "complete", models: [{}, {}, {}] },
      rules: [{ ruleId: "RG05", status: "incumple" }],
      findings: [{
        ruleIds: ["RG05"], status: "incumple", description: "El destino no existe.",
        location: { path: "/project/productLines/0", modelId: "adapted", elementId: "variant", referenceId: null },
        evidence: { targetModelId: "domain", targetElementId: "original" }
      }]
    }
  }));
  const card = attemptCard();
  expect(within(card).getByText(`Validación de ${domainModels[1].name}`)).toBeTruthy();
  expect(within(card).getByText("1 regla incumplida")).toBeTruthy();
  expect(card.open).toBe(false);
  fireEvent.click(within(card).getByText("Ver reglas"));
  expect(card.open).toBe(true);
  expectRuleStatuses({ RG05: "Incumple", RG14: "No aplica" });
  expect(within(card).getByText("El destino no existe.")).toBeTruthy();
  expect(within(card).getByText("adapted/variant → domain/original")).toBeTruthy();
  expect(card.querySelector(".validation-rule-heading code").textContent).toBe("RG05");
  expect(card.querySelectorAll(".validation-rule")).toHaveLength(22);
  expect(screen.getByText("Log").parentElement.textContent).not.toContain("El destino no existe.");
  expect(post).toHaveBeenCalledTimes(2);
  expect(domainModels[1].elements).toHaveLength(1);
});

test("an unavailable validation service leaves the applied patch and saving intact", async () => {
  post.mockRejectedValue({ response: { status: 404 } });
  const { domain, saveProject } = setup();
  const input = sendJson({ ops: [{ op: "deleteElement", selector: { id: "original" } }] });

  await screen.findByText("PATCH aplicado ✅");
  await waitFor(() => expect(within(attemptCard()).getByText("Informe no disponible")).toBeTruthy());
  expect(domain.elements).toEqual([]);
  expect(saveProject).toHaveBeenCalled();
  expect(input.disabled).toBe(false);
  await waitFor(() => expectRuleStatuses({ RG13: "No evaluable", RG16: "No evaluable" }));
  expect(post).toHaveBeenCalledTimes(2);
  expect(JSON.parse(post.mock.calls[0][1]).project.productLines[0].domainEngineering.models[0].elements).toEqual([]);
});

test("natural-language creation handles an incomplete relationship and reaches the validation card", async () => {
  const relationships = {
    Connects: { source: "Node", target: ["Node"], min: 0, max: 1 },
    Incomplete: { source: "Node", min: 0, max: 1 }
  };
  const originalRelationships = JSON.stringify(relationships);
  post.mockImplementation(async (url, body) => {
    const request = typeof body === "string" ? JSON.parse(body) : body;
    if (url === "/api/ai/chat") {
      const verifier = request.messages[0].content.includes("strict patch verifier");
      return {
        data: {
          usedModelId: request.primaryModelId,
          content: JSON.stringify(verifier ? { ops: [] } : {
            name: "Commerce",
            elements: ["Catalogo", "CarritoCompras", "Pagos"].map(name => ({ name, type: "Node" })),
            relationships: [{ type: "Connects", source: "Catalogo", target: "CarritoCompras" }]
          })
        }
      };
    }
    if (url === "/api/ai/validate-transition") return transitionResponse(body);
    return {
      data: {
        schemaVersion: 1, snapshotId: request.snapshotId,
        coverage: { effectiveScope: "complete", models: [{}, {}, {}] },
        rules: [{ ruleId: "RG04", status: "cumple" }],
        findings: []
      }
    };
  });
  const { domainModels, saveProject } = setup(relationships);
  const input = sendText("/create Crea una tienda online con Catalogo, CarritoCompras y Pagos.");

  await waitFor(() => expect(domainModels).toHaveLength(2));
  await waitFor(() => expect(attemptCard().textContent).toContain(
    "Captura completa"
  ));
  expect(domainModels[1].elements).toHaveLength(3);
  expect(domainModels[1].relationships).toHaveLength(1);
  expect(domainModels[1].relationships[0].type).toBe("Connects");
  expect(saveProject).toHaveBeenCalled();
  expect(input.disabled).toBe(false);
  expect(JSON.stringify(relationships)).toBe(originalRelationships);
  const chatCalls = post.mock.calls.filter(([url]) => url === "/api/ai/chat");
  expect(chatCalls).toHaveLength(2);
  expect(post).toHaveBeenCalledTimes(4);
  for (const [, request] of chatCalls) {
    expect(request.messages.map(message => message.role)).toEqual(["system", "user"]);
  }
  expect(chatCalls[0][1].messages[0].content).toContain("Connects: Node→[Node]");
  expect(chatCalls[0][1].messages[0].content).not.toContain("Incomplete:");
  const validationCall = post.mock.calls.find(([url]) => url === "/api/ai/validate-snapshot");
  expect(JSON.parse(validationCall[1]).metamodels["7"].relationships.Incomplete).toEqual(relationships.Incomplete);
  await waitFor(() => expectRuleStatuses({ RG13: "Cumple", RG14: "No aplica", RG15: "No aplica", RG16: "Cumple" }));
});

test("a rename sends detached before/after content and shows its direct dependents once", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? renameResponse(body) : snapshotResponse(body));
  const { domain, saveProject } = setup();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "CatalogoPrueba" }] });
  await waitFor(() => expect(attemptCard().textContent).toContain("Impacto potencial"));

  expect(domain.elements[0].name).toBe("CatalogoPrueba");
  expect(saveProject).toHaveBeenCalled();
  const capture = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  const before = capture.before.project.productLines[0].domainEngineering.models[0].elements[0];
  const after = capture.after.project.productLines[0].domainEngineering.models[0].elements[0];
  expect(before.name).toBe("Original");
  expect(after.name).toBe("CatalogoPrueba");
  expect(before.properties).toEqual([]);
  const details = attemptCard().textContent;
  expectRuleStatuses({ RG13: "Cumple", RG14: "No evaluable", RG15: "No aplica", RG16: "Cumple" });
  expect(details).toContain("pendientes de revisión: 1");
  expect(capture.before.metamodels["7"].elements).toEqual({ Node: {} });
  expect(capture.after.metamodels["7"]).toEqual(capture.before.metamodels["7"]);
  expect(details).toContain("1 dependiente potencial");
  expect(details).toContain("domain/original → adapted/variant (sourceModelElements; antes y después)");
  expect(details.match(/Impacto potencial/g)).toHaveLength(1);
});

test("a deletion with a surviving correspondence appears as RG15 incumple without blocking saving", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? transitionResponse(body, {
    changes: [{ operation: "deleted", entity: { kind: "element", modelId: "domain", id: "original" }, changedFields: [] }],
    rules: [{ ruleId: "RG13", status: "cumple" }, { ruleId: "RG14", status: "incumple" },
      { ruleId: "RG15", status: "incumple" }, { ruleId: "RG16", status: "incumple" }],
    findings: [{
      ruleIds: ["RG15"], status: "incumple", phase: "after", path: "/project/sourceModelElements/0",
      description: "La captura posterior conserva una referencia a un destino eliminado en esta transición.",
      evidence: { dependent: { kind: "element", modelId: "adapted", id: "variant" }, target: { kind: "element", modelId: "domain", id: "original" } }
    }]
  }) : snapshotResponse(body));
  const { domain, adapted, saveProject } = setup();
  const input = sendJson({ ops: [{ op: "deleteElement", selector: { id: "original" } }] });
  await waitFor(() => expectRuleStatuses({ RG15: "Incumple" }));
  expect(domain.elements).toEqual([]);
  expect(adapted.elements[0].sourceModelElements).toHaveLength(1);
  expect(saveProject).toHaveBeenCalled();
  expect(input.disabled).toBe(false);
  expect(attemptCard().textContent).toContain("adapted/variant → domain/original");
});

test("a deletion without surviving references can be reviewed as RG15 cumple", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? transitionResponse(body, {
    changes: [{ operation: "deleted", entity: { kind: "element", modelId: "domain", id: "unused" }, changedFields: [] }],
    rules: [{ ruleId: "RG13", status: "cumple" }, { ruleId: "RG14", status: "no_aplica" },
      { ruleId: "RG15", status: "cumple" }, { ruleId: "RG16", status: "cumple" }]
  }) : snapshotResponse(body));
  const { domain, saveProject } = setup();
  domain.elements.push({ id: "unused", type: "Node", name: "Unused", properties: [] });
  sendJson({ ops: [{ op: "deleteElement", selector: { id: "unused" } }] });
  await waitFor(() => expectRuleStatuses({ RG15: "Cumple", RG16: "Cumple" }));
  expect(domain.elements.map(element => element.id)).toEqual(["original"]);
  expect(saveProject).toHaveBeenCalled();
});

test("a partially applied edit is still reported when a later step throws", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? renameResponse(body) : snapshotResponse(body));
  const { domain, saveProject } = setup();
  saveProject.mockImplementationOnce(() => { throw new Error("Fallo de prueba después del cambio"); });
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "PartialEdit" }] });
  await waitFor(() => expect(attemptCard().textContent).toContain("Capturas completa"));
  expect(screen.getByText("Log").parentElement.textContent).toContain("[error] Fallo de prueba después del cambio");
  expect(domain.elements[0].name).toBe("PartialEdit");
  const capture = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  expect(capture.before.project.productLines[0].domainEngineering.models[0].elements[0].name).toBe("Original");
  expect(capture.after.project.productLines[0].domainEngineering.models[0].elements[0].name).toBe("PartialEdit");
});

test("an unavailable transition endpoint preserves the existing rule report", async () => {
  post.mockImplementation(async (url, body) => {
    if (url === "/api/ai/validate-transition") throw { response: { status: 404 } };
    return snapshotResponse(body);
  });
  const { domain, saveProject } = setup();
  const input = sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "StillWorks" }] });
  await waitFor(() => expectRuleStatuses({ RG13: "No evaluable", RG16: "No evaluable" }));
  expectRuleStatuses({ RG05: "Cumple" });
  expect(within(attemptCard()).getByText("Informe parcial")).toBeTruthy();
  expect(domain.elements[0].name).toBe("StillWorks");
  expect(saveProject).toHaveBeenCalled();
  expect(input.disabled).toBe(false);
});

test("natural-language editing captures the state immediately before applying the generated patch", async () => {
  const { domain, saveProject } = setup();
  post.mockImplementation(async (url, body) => {
    if (url === "/api/ai/validate-transition") return renameResponse(body);
    if (url === "/api/ai/validate-snapshot") return snapshotResponse(body);
    const verifier = body.messages[0].content.includes("strict patch verifier");
    if (!verifier) domain.elements[0].name = "UpdatedWhileWaiting";
    return { data: { usedModelId: body.primaryModelId, content: JSON.stringify({ ops: verifier ? [] : [
      { op: "renameElement", selector: { id: "original" }, newName: "CatalogoPrueba" }
    ] }) } };
  });
  sendText("/edit Cambia el nombre del elemento Original a CatalogoPrueba.");
  await waitFor(() => expectRuleStatuses({ RG13: "Cumple", RG14: "No evaluable", RG15: "No aplica", RG16: "Cumple" }));
  expect(domain.elements[0].name).toBe("CatalogoPrueba");
  expect(saveProject).toHaveBeenCalled();
  const capture = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  expect(capture.before.project.productLines[0].domainEngineering.models[0].elements[0].name).toBe("UpdatedWhileWaiting");
  expect(post.mock.calls.filter(([url]) => url === "/api/ai/chat")).toHaveLength(2);
});

test("a later edit remains available while the first transition report is pending", async () => {
  let respond: (result: unknown) => void;
  let firstBody: string;
  post.mockImplementation((url, body) => {
    if (url === "/api/ai/validate-snapshot") return Promise.resolve(snapshotResponse(body));
    if (JSON.parse(body).before.snapshotId === "chat-1-before") {
      firstBody = body;
      return new Promise(resolve => { respond = resolve; });
    }
    return Promise.resolve(renameResponse(body));
  });
  const { domain } = setup();
  const input = sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "FirstEdit" }] });
  await waitFor(() => expect(input.disabled).toBe(false));
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "SecondEdit" }] });
  await waitFor(() => expectRuleStatuses({ RG13: "Cumple", RG14: "No evaluable" }, 2));
  expect(within(attemptCard(1)).getByText("Evaluando…")).toBeTruthy();
  expect(within(attemptCard(2)).queryByText("Evaluando…")).toBeNull();
  const firstResult = renameResponse(firstBody);
  firstResult.data.rules = firstResult.data.rules.map(rule => rule.ruleId === "RG14" ? { ...rule, status: "incumple" } : rule);
  await act(async () => respond(firstResult));
  expectRuleStatuses({ RG14: "Incumple" }, 1);
  expectRuleStatuses({ RG14: "No evaluable" }, 2);
  expect(screen.getAllByLabelText(/^Validación del intento /)).toHaveLength(2);
  const captures = post.mock.calls.filter(([url]) => url === "/api/ai/validate-transition").map(([, body]) => JSON.parse(body));
  expect(captures[0].before.project.productLines[0].domainEngineering.models[0].elements[0].name).toBe("Original");
  expect(captures[0].after.project.productLines[0].domainEngineering.models[0].elements[0].name).toBe("FirstEdit");
  expect(captures[1].before.project.productLines[0].domainEngineering.models[0].elements[0].name).toBe("FirstEdit");
  expect(captures[1].after.project.productLines[0].domainEngineering.models[0].elements[0].name).toBe("SecondEdit");
  expect(domain.elements[0].name).toBe("SecondEdit");
});

test("a report for different snapshots is shown as unevaluated instead of passing", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition"
    ? transitionResponse(body, { beforeSnapshotId: "other-attempt" }) : snapshotResponse(body));
  const { domain } = setup();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "KeepEdit" }] });
  await waitFor(() => expectRuleStatuses({ RG13: "No evaluable", RG16: "No evaluable" }));
  expect(ruleStatus("RG13")).not.toBe("Cumple");
  expect(domain.elements[0].name).toBe("KeepEdit");
});

test.each(["before", "after"])("a failed %s capture leaves the model operation and original rule report available", async phase => {
  const capture = validationService.captureModelTransition;
  const spy = jest.spyOn(validationService, "captureModelTransition");
  if (phase === "after") spy.mockImplementationOnce(capture);
  spy.mockImplementationOnce(() => { throw new Error("Fallo de captura simulado"); });
  post.mockImplementation(async (_url, body) => snapshotResponse(body));
  const { domain, saveProject } = setup();
  const input = sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "SavedRegardless" }] });
  await waitFor(() => expectRuleStatuses({ RG05: "Cumple" }));
  expectRuleStatuses({ RG13: "No evaluable", RG14: "No evaluable", RG15: "No evaluable", RG16: "No evaluable" });
  expect(attemptCard().textContent).toContain(
    phase === "before" ? "No se pudo obtener la captura anterior." : "El servicio de validación no devolvió un informe."
  );
  expect(domain.elements[0].name).toBe("SavedRegardless");
  expect(saveProject).toHaveBeenCalled();
  expect(input.disabled).toBe(false);
  expect(post).toHaveBeenCalledTimes(1);
});

test("an invalid plan never starts either validation request", async () => {
  const { domainModels, saveProject } = setup();
  sendJson({ name: "Invalid", elements: [], relationships: [] });
  await waitFor(() => expect(screen.getByText("Log").parentElement.textContent).toContain("[error]"));
  expect(post).not.toHaveBeenCalled();
  expect(screen.queryByLabelText(/^Validación del intento /)).toBeNull();
  expect(domainModels).toHaveLength(1);
  expect(saveProject).not.toHaveBeenCalled();
});

test("RG16 distinguishes previous, new and repaired findings in the validation card", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition"
    ? transitionResponse(body, {
      structuralValidation: { delta: { introduced: 1, persisting: 2, resolved: 3, unclassified: 0 } },
      rules: [{ ruleId: "RG13", status: "cumple" }, { ruleId: "RG14", status: "no_aplica" },
        { ruleId: "RG15", status: "no_aplica" }, { ruleId: "RG16", status: "incumple" }]
    }) : snapshotResponse(body));
  const { domain, saveProject } = setup();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "Reviewed" }] });
  await waitFor(() => expect(attemptCard().textContent).toContain(
    "Hallazgos estructurales · nuevos: 1 · anteriores: 2 · resueltos: 3 · sin clasificar: 0"
  ));
  expect(domain.elements[0].name).toBe("Reviewed");
  expect(saveProject).toHaveBeenCalled();
});

test("an older backend does not produce a false pass for missing RG14 and RG16", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition"
    ? transitionResponse(body, { rules: [{ ruleId: "RG13", status: "cumple" }, { ruleId: "RG15", status: "no_aplica" }] })
    : snapshotResponse(body));
  const { domain } = setup();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "Compatible" }] });
  await waitFor(() => expect(attemptCard().textContent).toContain(
    "El backend no incluyó estas reglas: RG14, RG16."
  ));
  expectRuleStatuses({ RG13: "Cumple", RG14: "No evaluable", RG15: "No aplica", RG16: "No evaluable" });
  expect(domain.elements[0].name).toBe("Compatible");
});

test("partial nested data is presented as a possible change", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition"
    ? transitionResponse(body, {
      changes: [{ operation: "updated", entity: { kind: "element", modelId: "domain", id: "original" }, changedFields: [], uncertainFields: ["properties"] }],
      rules: ["RG13", "RG14", "RG15", "RG16"].map(ruleId => ({ ruleId, status: "no_evaluable" }))
    }) : snapshotResponse(body));
  const { domain } = setup();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "KeepOperation" }] });
  await waitFor(() => expect(attemptCard().textContent).toContain(
    "Posible modificación de elemento domain/original · datos incompletos: properties"
  ));
  expect(domain.elements[0].name).toBe("KeepOperation");
});

test("new rules explain missing criteria without changing either earlier report", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? renameResponse(body) : snapshotResponse(body));
  const { domain } = setup();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "ThirdIncrement" }] });
  await waitFor(() => expectRuleStatuses({ RG06: "No evaluable", RG07: "No evaluable", RG08: "No evaluable" }));
  expectRuleStatuses({ RG16: "Cumple" });
  expectRuleStatuses({ RG05: "Cumple" });
  expect(domain.elements[0].name).toBe("ThirdIncrement");
  expect(post).toHaveBeenCalledTimes(2);
});

test("loading criteria is memory-only and does not save or evaluate a project", async () => {
  const { project, saveProject } = setup();
  const original = JSON.stringify(project);
  await loadCriteria();
  expect(JSON.stringify(project)).toBe(original);
  expect(saveProject).not.toHaveBeenCalled();
  expect(post).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Quitar criterios" })).toBeTruthy();
});

test("explicit criteria travel once in the existing request and all three results reach the validation card", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? renameResponse(body) : snapshotResponse(body));
  const { domain, project, saveProject } = setup();
  await loadCriteria();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "WithCriteria" }] });
  await waitFor(() => expectRuleStatuses({ RG06: "Cumple", RG07: "Cumple", RG08: "Cumple" }));
  const body = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  expect(body.correspondenceProfile).toEqual(criteria);
  expect(body.before.correspondenceProfile).toBeUndefined();
  expect(body.after.correspondenceProfile).toBeUndefined();
  expect((project as any).correspondenceProfile).toBeUndefined();
  expect(domain.elements[0].name).toBe("WithCriteria");
  expect(saveProject).toHaveBeenCalled();
  expect(post).toHaveBeenCalledTimes(2);
});

test("dependency and orphan failures are visible while deletion and saving remain applied", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? transitionResponse(body, {
    correspondenceValidation: correspondenceReport(body, {
      rules: [{ ruleId: "RG06", status: "no_evaluable" }, { ruleId: "RG07", status: "incumple" }, { ruleId: "RG08", status: "incumple" }],
      findings: [{ ruleIds: ["RG08"], status: "incumple", description: "No se alcanza la cobertura de correspondencias requerida.",
        location: { path: "/project/variant", modelId: "adapted", elementId: "variant", referenceId: null }, evidence: {} }]
    })
  }) : snapshotResponse(body));
  const { domain, saveProject } = setup();
  await loadCriteria();
  const input = sendJson({ ops: [{ op: "deleteElement", selector: { id: "original" } }] });
  await waitFor(() => expectRuleStatuses({ RG06: "No evaluable", RG07: "Incumple", RG08: "Incumple" }));
  expect(domain.elements).toEqual([]);
  expect(saveProject).toHaveBeenCalled();
  expect(input.disabled).toBe(false);
});

test("invalid criteria files preserve the previously loaded criteria", async () => {
  const { saveProject } = setup();
  await loadCriteria();
  const file = new File(['{"schemaVersion":99}'], "invalid.json", { type: "application/json" });
  fireEvent.change(screen.getByLabelText("Cargar criterios RG06–RG08"), { target: { files: [file] } });
  await waitFor(() => expect(screen.getByText("Log").parentElement.textContent).toContain("[Criterios] No se pudieron cargar."));
  expect(screen.getByText("Criterios RG06–RG08: ui-explicit-criteria")).toBeTruthy();
  expect(post).not.toHaveBeenCalled();
  expect(saveProject).not.toHaveBeenCalled();
});

test("oversized criteria are rejected before any request", async () => {
  setup();
  const file = new File([" ".repeat(128 * 1024 + 1)], "large.json", { type: "application/json" });
  fireEvent.change(screen.getByLabelText("Cargar criterios RG06–RG08"), { target: { files: [file] } });
  await waitFor(() => expect(screen.getByText("Log").parentElement.textContent).toContain("El archivo de criterios supera 128 KiB."));
  expect(post).not.toHaveBeenCalled();
});

test("removing criteria restores explicit non-evaluation without saving a configuration", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? renameResponse(body) : snapshotResponse(body));
  const { saveProject } = setup();
  await loadCriteria();
  fireEvent.click(screen.getByRole("button", { name: "Quitar criterios" }));
  expect(saveProject).not.toHaveBeenCalled();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "Cleared" }] });
  await waitFor(() => expectRuleStatuses({ RG06: "No evaluable", RG07: "No evaluable", RG08: "No evaluable" }));
  const body = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  expect(body.correspondenceProfile).toBeUndefined();
});

test("criteria from a different project are never applied implicitly", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? renameResponse(body) : snapshotResponse(body));
  const { project } = setup();
  await loadCriteria();
  project.id = "another-project";
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "SeparateScope" }] });
  await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
  const body = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  expect(body.after.projectId).toBe("another-project");
  expect(body.correspondenceProfile).toBeUndefined();
});

test.each(["absent", "wrong-snapshot"])("an %s third report cannot hide earlier reports or create false passes", async kind => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? renameResponseWithMissingThird(body) : snapshotResponse(body));
  function renameResponseWithMissingThird(body: string) {
    const response = renameResponse(body);
    (response.data as any).correspondenceValidation = kind === "absent" ? undefined : correspondenceReport(body, {
      snapshotId: "another-attempt", rules: ["RG06", "RG07", "RG08"].map(ruleId => ({ ruleId, status: "cumple" }))
    });
    return response;
  }
  const { domain } = setup();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "CompatibleReports" }] });
  await waitFor(() => expect(attemptCard().textContent).toContain("No se recibió un informe de correspondencias válido"));
  expectRuleStatuses({ RG16: "Cumple" });
  expect(ruleStatus("RG06")).not.toBe("Cumple");
  expect(domain.elements[0].name).toBe("CompatibleReports");
});

test("fourth criteria are memory-only and independent from correspondence criteria", async () => {
  const { project, saveProject } = setup();
  const original = JSON.stringify(project);
  await loadCriteria();
  await loadRestrictionCriteria();
  expect(JSON.stringify(project)).toBe(original);
  expect(saveProject).not.toHaveBeenCalled();
  expect(post).not.toHaveBeenCalled();
  expect(screen.getByText("Criterios RG06–RG08: ui-explicit-criteria")).toBeTruthy();
  expect(screen.getByText("Criterios RG09–RG12: ui-boolean-criteria")).toBeTruthy();
});

test("both profiles travel once in the same request and fourth failures remain advisory", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? transitionResponse(body, {
    constraintValidation: constraintReport(body, {
      rules: [{ ruleId: "RG09", status: "incumple" }, { ruleId: "RG10", status: "no_evaluable" },
        { ruleId: "RG11", status: "cumple" }, { ruleId: "RG12", status: "incumple" }],
      findings: [{ ruleIds: ["RG12"], status: "incumple", description: "Afirmaciones opuestas en modelos vinculados.",
        location: { path: "/constraintProfile", modelId: "domain", elementId: null, referenceId: null }, evidence: {} }]
    })
  }) : snapshotResponse(body));
  const { domain, project, saveProject } = setup();
  await loadCriteria();
  await loadRestrictionCriteria();
  const input = sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "FourthIncrement" }] });
  await waitFor(() => expectRuleStatuses({ RG09: "Incumple", RG10: "No evaluable", RG11: "Cumple", RG12: "Incumple" }));
  const body = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  expect(body.constraintProfile).toEqual(restrictionCriteria);
  expect(body.correspondenceProfile).toEqual(criteria);
  expect(body.before.constraintProfile).toBeUndefined();
  expect(body.after.constraintProfile).toBeUndefined();
  expect((project as any).constraintProfile).toBeUndefined();
  expect(domain.elements[0].name).toBe("FourthIncrement");
  expect(saveProject).toHaveBeenCalled();
  expect(input.disabled).toBe(false);
  expect(post).toHaveBeenCalledTimes(2);
  expect(attemptCard().textContent).toContain("Afirmaciones opuestas");
  expectRuleStatuses({ RG05: "Cumple" });
  expectRuleStatuses({ RG06: "Cumple" });
  expectRuleStatuses({ RG16: "Cumple" });
});

test("creation and saving finish before the fourth report arrives", async () => {
  let respond: (response: unknown) => void;
  let transitionBody: string;
  post.mockImplementation((url, body) => {
    if (url === "/api/ai/validate-snapshot") return Promise.resolve(snapshotResponse(body));
    transitionBody = body;
    return new Promise(resolve => { respond = resolve; });
  });
  const { saveProject } = setup();
  await loadRestrictionCriteria();
  const input = sendJson({ name: "InformativeFourth", elements: [{ type: "Node", name: "A" }], relationships: [] });
  await screen.findByText("Modelo creado ✅");
  await waitFor(() => expect(saveProject).toHaveBeenCalled());
  await waitFor(() => expect(input.disabled).toBe(false));
  await waitFor(() => expect(typeof respond).toBe("function"));
  await act(async () => { respond(transitionResponse(transitionBody)); });
  await waitFor(() => expectRuleStatuses({ RG09: "Cumple", RG10: "Cumple", RG11: "Cumple", RG12: "Cumple" }));
});

test.each(["invalid", "oversized"])("%s fourth criteria leave the previous profile and project intact", async kind => {
  const { project, saveProject } = setup();
  await loadRestrictionCriteria();
  const original = JSON.stringify(project);
  const text = kind === "invalid" ? '{"schemaVersion":99}' : " ".repeat(128 * 1024 + 1);
  fireEvent.change(screen.getByLabelText("Cargar criterios RG09–RG12"), {
    target: { files: [new File([text], "bad.json", { type: "application/json" })] }
  });
  await waitFor(() => expect(screen.getByText("Log").parentElement.textContent).toContain("[Restricciones · criterios] No se pudieron cargar."));
  expect(screen.getByText("Criterios RG09–RG12: ui-boolean-criteria")).toBeTruthy();
  expect(JSON.stringify(project)).toBe(original);
  expect(saveProject).not.toHaveBeenCalled();
  expect(post).not.toHaveBeenCalled();
});

test("removing fourth criteria preserves the third profile without persisting either", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? renameResponse(body) : snapshotResponse(body));
  const { saveProject } = setup();
  await loadCriteria();
  await loadRestrictionCriteria();
  fireEvent.click(screen.getByRole("button", { name: "Quitar criterios RG09–RG12" }));
  expect(saveProject).not.toHaveBeenCalled();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "WithoutFourth" }] });
  await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
  const body = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  expect(body.constraintProfile).toBeUndefined();
  expect(body.correspondenceProfile).toEqual(criteria);
  await waitFor(() => expectRuleStatuses({ RG09: "No evaluable", RG10: "No evaluable", RG11: "No evaluable", RG12: "No evaluable" }));
});

test("fourth criteria never transfer implicitly to another project", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? renameResponse(body) : snapshotResponse(body));
  const { project } = setup();
  await loadRestrictionCriteria();
  project.id = "different-project";
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "SeparatedFourth" }] });
  await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
  const body = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  expect(body.constraintProfile).toBeUndefined();
  await waitFor(() => expectRuleStatuses({ RG09: "No evaluable", RG10: "No evaluable", RG11: "No evaluable", RG12: "No evaluable" }));
});

test.each(["absent", "snapshot", "project", "profile", "kind", "invalid-status", "duplicate-rule"])("a fourth report with %s cannot create a false pass", async kind => {
  post.mockImplementation(async (url, body) => {
    if (url !== "/api/ai/validate-transition") return snapshotResponse(body);
    let report: any = constraintReport(body);
    if (kind === "absent") report = undefined;
    else if (kind === "snapshot") report.snapshotId = "another-attempt";
    else if (kind === "project") report.projectId = "another-project";
    else if (kind === "profile") report.profileId = "another-profile";
    else if (kind === "kind") report.kind = "correspondences";
    else if (kind === "invalid-status") report.rules[0].status = "unknown";
    else report.rules.push(report.rules[0]);
    return transitionResponse(body, { constraintValidation: report });
  });
  const { domain, saveProject } = setup();
  await loadRestrictionCriteria();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "FourthCompatibility" }] });
  await waitFor(() => expect(attemptCard().textContent).toContain("No se recibió un informe de restricciones válido"));
  expect(ruleStatus("RG09")).not.toBe("Cumple");
  expectRuleStatuses({ RG16: "Cumple" });
  expect(domain.elements[0].name).toBe("FourthCompatibility");
  expect(saveProject).toHaveBeenCalled();
});

test("a missing fourth rule is explicitly unevaluable without suppressing other results", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? transitionResponse(body, {
    constraintValidation: constraintReport(body, { rules: [{ ruleId: "RG09", status: "cumple" }] })
  }) : snapshotResponse(body));
  setup();
  await loadRestrictionCriteria();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "MissingRules" }] });
  await waitFor(() => expectRuleStatuses({ RG09: "Cumple", RG10: "No evaluable", RG11: "No evaluable", RG12: "No evaluable" }));
  expect(attemptCard().textContent).toContain("El backend no incluyó estas reglas: RG10, RG11, RG12.");
});

test("loading history evidence is memory-only and independent from earlier profiles", async () => {
  const { project, saveProject } = setup();
  const original = JSON.stringify(project);
  await loadCriteria();
  await loadRestrictionCriteria();
  await loadHistoryContext();
  expect(JSON.stringify(project)).toBe(original);
  expect(saveProject).not.toHaveBeenCalled();
  expect(post).not.toHaveBeenCalled();
  expect(screen.getByText("Criterios RG09–RG12: ui-boolean-criteria")).toBeTruthy();
});

test("fifth failures are advisory and all evidence travels once in the existing transition", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? transitionResponse(body, {
    versionValidation: versionReport(body, {
      rules: [{ ruleId: "RG17", status: "incumple" }, { ruleId: "RG18", status: "no_evaluable" }, { ruleId: "RG19", status: "incumple" }],
      findings: [{ ruleIds: ["RG17"], status: "incumple", description: "Las revisiones son incompatibles.",
        location: { path: "/versionContext", modelId: null, elementId: null, referenceId: null }, evidence: { linkIds: ["link-a"], versionIds: ["v1", "v2"] } }]
    })
  }) : snapshotResponse(body));
  const { domain, project, saveProject } = setup();
  await loadCriteria();await loadRestrictionCriteria();await loadHistoryContext();
  const input = sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "FifthIncrement" }] });
  await waitFor(() => expectRuleStatuses({ RG17: "Incumple", RG18: "No evaluable", RG19: "Incumple" }));
  const body = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  expect(body.versionContext).toEqual(historyContext);
  expect(body.before.versionContext).toBeUndefined();expect(body.after.versionContext).toBeUndefined();
  expect((project as any).versionContext).toBeUndefined();
  expect(body.correspondenceProfile).toEqual(criteria);expect(body.constraintProfile).toEqual(restrictionCriteria);
  expect(post).toHaveBeenCalledTimes(2);
  expect(saveProject).toHaveBeenCalled();expect(input.disabled).toBe(false);
  expect(domain.elements[0].name).toBe("FifthIncrement");
  expect(attemptCard().textContent).toContain("link-a, v1, v2");
  expectRuleStatuses({ RG09: "Cumple" });
  expect(attemptCard().textContent).toContain("RG16");
});

test.each(["invalid", "foreign-project", "oversized"])("%s historical context preserves previous evidence and project", async kind => {
  const { project, saveProject } = setup();
  await loadHistoryContext();
  const original = JSON.stringify(project);
  const content = kind === "oversized" ? " ".repeat(128 * 1024 + 1) : JSON.stringify({ ...historyContext,
    schemaVersion: kind === "invalid" ? 2 : 1, projectId: kind === "foreign-project" ? "other-project" : "project" });
  fireEvent.change(screen.getByLabelText("Cargar contexto RG17–RG19"), { target: { files: [new File([content], "bad.json")] } });
  await waitFor(() => expect(screen.getByText("Log").parentElement.textContent).toContain("[Versiones · contexto] No se pudo cargar."));
  expect(screen.getByText("Contexto RG17–RG19: ui-version-context")).toBeTruthy();
  expect(JSON.stringify(project)).toBe(original);expect(saveProject).not.toHaveBeenCalled();expect(post).not.toHaveBeenCalled();
});

test("removing history context keeps both earlier profiles and does not save anything", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? renameResponse(body) : snapshotResponse(body));
  const { saveProject } = setup();
  await loadCriteria();await loadRestrictionCriteria();await loadHistoryContext();
  fireEvent.click(screen.getByRole("button", { name: "Quitar contexto RG17–RG19" }));
  expect(saveProject).not.toHaveBeenCalled();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "WithoutVersions" }] });
  await waitFor(() => expectRuleStatuses({ RG17: "No evaluable", RG18: "No evaluable", RG19: "No evaluable" }));
  const body = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  expect(body.versionContext).toBeUndefined();expect(body.correspondenceProfile).toEqual(criteria);expect(body.constraintProfile).toEqual(restrictionCriteria);
});

test("historical evidence does not transfer to a different project", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? renameResponse(body) : snapshotResponse(body));
  const { project } = setup();await loadHistoryContext();
  project.id = "different-project";
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "ScopedVersions" }] });
  await waitFor(() => expectRuleStatuses({ RG17: "No evaluable", RG18: "No evaluable", RG19: "No evaluable" }));
  const body = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  expect(body.versionContext).toBeUndefined();
});

test.each(["absent", "snapshot", "project", "context", "kind", "status", "duplicate", "coverage"])("a fifth report with %s cannot produce false passes", async kind => {
  post.mockImplementation(async (url, body) => {
    if (url !== "/api/ai/validate-transition") return snapshotResponse(body);
    let report: any = versionReport(body);
    if (kind === "absent") report = undefined;
    else if (kind === "snapshot") report.snapshotId = "old-snapshot";
    else if (kind === "project") report.projectId = "other-project";
    else if (kind === "context") report.contextId = "other-context";
    else if (kind === "kind") report.kind = "transition";
    else if (kind === "status") report.rules[0].status = "unknown";
    else if (kind === "duplicate") report.rules.push(report.rules[0]);
    else report.versionCoverage.revisionCount = -1;
    return transitionResponse(body, { versionValidation: report });
  });
  const { domain, saveProject } = setup();await loadHistoryContext();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "HistoricalCompatibility" }] });
  await waitFor(() => expect(attemptCard().textContent).toContain("No se recibió un informe de versiones válido"));
  expect(ruleStatus("RG17")).not.toBe("No aplica");
  expect(domain.elements[0].name).toBe("HistoricalCompatibility");expect(saveProject).toHaveBeenCalled();
  expect(attemptCard().textContent).toContain("RG16");
});

test("a missing fifth rule is explicitly unevaluable", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? transitionResponse(body, {
    versionValidation: versionReport(body, { rules: [{ ruleId: "RG17", status: "cumple" }] })
  }) : snapshotResponse(body));
  setup();await loadHistoryContext();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "MissingVersionRules" }] });
  await waitFor(() => expectRuleStatuses({ RG17: "Cumple", RG18: "No evaluable", RG19: "No evaluable" }));
});

test("creation and saving do not wait for historical validation", async () => {
  let respond: (response: unknown) => void;
  let transitionBody: string;
  post.mockImplementation((url, body) => {
    if (url === "/api/ai/validate-snapshot") return Promise.resolve(snapshotResponse(body));
    transitionBody = body;return new Promise(resolve => { respond = resolve; });
  });
  const { saveProject } = setup();await loadHistoryContext();
  const input = sendJson({ name: "HistoricalAdvisory", elements: [{ type: "Node", name: "A" }], relationships: [] });
  await screen.findByText("Modelo creado ✅");
  await waitFor(() => expect(input.disabled).toBe(false));expect(saveProject).toHaveBeenCalled();
  await waitFor(() => expect(typeof respond).toBe("function"));
  await act(async () => { respond(transitionResponse(transitionBody)); });
  await waitFor(() => expectRuleStatuses({ RG17: "No aplica", RG18: "No aplica", RG19: "No aplica" }));
});

test("automatic trace metadata identifies each attempt without copying its request text or saving history", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? renameResponse(body) : snapshotResponse(body));
  const { domain, project, saveProject } = setup();
  const input = sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "OriginTest" }] });
  await waitFor(() => expectRuleStatuses({ RG20: "Cumple", RG21: "No evaluable", RG22: "No evaluable" }));
  const bodies = () => post.mock.calls.filter(([url]) => url === "/api/ai/validate-transition").map(([, body]) => JSON.parse(body));
  const first = bodies()[0];
  expect(first.attemptContext.beforeSnapshotId).toBe(first.before.snapshotId);
  expect(first.attemptContext.afterSnapshotId).toBe(first.after.snapshotId);
  expect(first.attemptContext.projectId).toBe(project.id);
  expect(first.attemptContext.origin).toEqual({ id: first.attemptContext.id, kind: "interaction", source: "chatbot" });
  expect(JSON.stringify(first.attemptContext)).not.toContain("OriginTest");
  expect((project as any).attemptContext).toBeUndefined();expect(first.before.attemptContext).toBeUndefined();expect(first.after.attemptContext).toBeUndefined();
  expect(domain.elements[0].name).toBe("OriginTest");expect(saveProject).toHaveBeenCalled();expect(input.disabled).toBe(false);
  expect(attemptCard().textContent).toContain("Modificación de elemento domain/original");
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "NextAttempt" }] });
  await waitFor(() => expect(bodies()).toHaveLength(2));
  expect(bodies()[1].attemptContext.id).not.toBe(first.attemptContext.id);
  await waitFor(() => expectRuleStatuses({ RG20: "Cumple" }, 2));
  expect(post).toHaveBeenCalledTimes(4);
});

test("loading trace context is memory-only and independent from the three earlier contexts", async () => {
  const { project, saveProject } = setup();const original = JSON.stringify(project);
  await loadCriteria();await loadRestrictionCriteria();await loadHistoryContext();await loadTraceContext();
  expect(JSON.stringify(project)).toBe(original);expect(saveProject).not.toHaveBeenCalled();expect(post).not.toHaveBeenCalled();
  expect(screen.getByText("Contexto RG17–RG19: ui-version-context")).toBeTruthy();
});

test("trace violations preserve the applied edit and use the same two validation requests", async () => {
  post.mockImplementation(async (url, body) => {
    if (url !== "/api/ai/validate-transition") return snapshotResponse(body);
    const response = renameResponse(body);
    response.data.traceabilityValidation = traceReport(body, response.data.changes as any[], {
      rules: [{ ruleId: "RG20", status: "cumple" }, { ruleId: "RG21", status: "incumple" }, { ruleId: "RG22", status: "incumple" }],
      findings: [{ ruleIds: ["RG22"], status: "incumple", description: "El enlace apunta a otro artefacto.",
        location: { path: "/traceContext", modelId: "domain", elementId: null, referenceId: null }, evidence: { linkIds: ["bad-link"] } }]
    });return response;
  });
  const { domain, project, saveProject } = setup();
  await loadCriteria();await loadRestrictionCriteria();await loadHistoryContext();await loadTraceContext();
  const input = sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "AdvisoryTrace" }] });
  await waitFor(() => expectRuleStatuses({ RG20: "Cumple", RG21: "Incumple", RG22: "Incumple" }));
  const body = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  expect(body.traceContext).toEqual(traceContext);expect(body.correspondenceProfile).toEqual(criteria);
  expect(body.constraintProfile).toEqual(restrictionCriteria);expect(body.versionContext).toEqual(historyContext);
  expect((project as any).traceContext).toBeUndefined();expect(body.before.traceContext).toBeUndefined();expect(body.after.traceContext).toBeUndefined();
  expect(domain.elements[0].name).toBe("AdvisoryTrace");expect(input.disabled).toBe(false);expect(saveProject).toHaveBeenCalled();
  expect(post).toHaveBeenCalledTimes(2);expect(attemptCard().textContent).toContain("bad-link");
  expectRuleStatuses({ RG17: "No aplica" });
});

test.each(["invalid", "project", "oversized", "long-id"])("%s trace context preserves previous context and does not save", async kind => {
  const { project, saveProject } = setup();await loadTraceContext();const original = JSON.stringify(project);
  const text = kind === "oversized" ? " ".repeat(128 * 1024 + 1) : JSON.stringify({ ...traceContext,
    schemaVersion: kind === "invalid" ? 0 : 1, projectId: kind === "project" ? "foreign" : "project", id: kind === "long-id" ? "x".repeat(257) : traceContext.id });
  fireEvent.change(screen.getByLabelText("Cargar contexto RG20–RG22"), { target: { files: [new File([text], "bad.json")] } });
  await waitFor(() => expect(screen.getByText("Log").parentElement.textContent).toContain("[Trazabilidad · contexto] No se pudo cargar."));
  expect(screen.getByText("Contexto RG20–RG22: ui-trace-context")).toBeTruthy();expect(JSON.stringify(project)).toBe(original);
  expect(saveProject).not.toHaveBeenCalled();expect(post).not.toHaveBeenCalled();
});

test("removing trace evidence preserves automatic origin metadata and earlier contexts", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? renameResponse(body) : snapshotResponse(body));
  const { saveProject } = setup();await loadHistoryContext();await loadTraceContext();
  fireEvent.click(screen.getByRole("button", { name: "Quitar contexto RG20–RG22" }));expect(saveProject).not.toHaveBeenCalled();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "AutomaticOriginOnly" }] });
  await waitFor(() => expectRuleStatuses({ RG20: "Cumple", RG21: "No evaluable", RG22: "No evaluable" }));
  const body = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  expect(body.traceContext).toBeUndefined();expect(body.attemptContext).toBeTruthy();expect(body.versionContext).toEqual(historyContext);
});

test("trace context cannot transfer to another project", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? renameResponse(body) : snapshotResponse(body));
  const { project } = setup();await loadTraceContext();project.id = "other-project";
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "IsolatedTrace" }] });
  await waitFor(() => expectRuleStatuses({ RG20: "Cumple", RG21: "No evaluable", RG22: "No evaluable" }));
  const body = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  expect(body.traceContext).toBeUndefined();expect(body.attemptContext.projectId).toBe("other-project");
});

test.each(["absent", "snapshot", "before", "project", "attempt", "context", "kind", "status", "duplicate-rule", "trace-entity", "change-count"])("a sixth report with %s cannot create false passes", async kind => {
  post.mockImplementation(async (url, body) => {
    if (url !== "/api/ai/validate-transition") return snapshotResponse(body);
    const response = renameResponse(body);let report: any = response.data.traceabilityValidation;
    if (kind === "absent") report = undefined;
    else if (kind === "snapshot") report.snapshotId = "another";
    else if (kind === "before") report.beforeSnapshotId = "another";
    else if (kind === "project") report.projectId = "another";
    else if (kind === "attempt") report.attemptId = "another";
    else if (kind === "context") report.contextId = "another";
    else if (kind === "kind") report.kind = "versions";
    else if (kind === "status") report.rules[0].status = "unknown";
    else if (kind === "duplicate-rule") report.rules.push(report.rules[0]);
    else if (kind === "trace-entity") report.traces[0].entity = { kind: "element", modelId: "domain", id: "wrong" };
    else report.traceCoverage.observedChangeCount = 99;
    response.data.traceabilityValidation = report;return response;
  });
  const { domain, saveProject } = setup();await loadTraceContext();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "TraceCompatibility" }] });
  await waitFor(() => expect(attemptCard().textContent).toContain("No se recibió un informe de trazabilidad válido"));
  expect(ruleStatus("RG20")).not.toBe("Cumple");
  expect(domain.elements[0].name).toBe("TraceCompatibility");expect(saveProject).toHaveBeenCalled();
  expect(attemptCard().textContent).toContain("RG16");
});

test("a missing trace rule remains explicitly unevaluable", async () => {
  post.mockImplementation(async (url, body) => {
    if (url !== "/api/ai/validate-transition") return snapshotResponse(body);
    const response = renameResponse(body);response.data.traceabilityValidation.rules = [{ ruleId: "RG20", status: "cumple" }];return response;
  });
  setup();sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "PartialTraceRules" }] });
  await waitFor(() => expectRuleStatuses({ RG20: "Cumple", RG21: "No evaluable", RG22: "No evaluable" }));
  expect(attemptCard().textContent).toContain("El backend no incluyó estas reglas: RG21, RG22.");
});

test("creation and saving finish while sixth validation is still pending", async () => {
  let respond: (response: unknown) => void;let transitionBody: string;
  post.mockImplementation((url, body) => {
    if (url === "/api/ai/validate-snapshot") return Promise.resolve(snapshotResponse(body));
    transitionBody = body;return new Promise(resolve => { respond = resolve; });
  });
  const { saveProject } = setup();await loadTraceContext();
  const input = sendJson({ name: "TraceAdvisory", elements: [{ name: "A", type: "Node" }], relationships: [] });
  await screen.findByText("Modelo creado ✅");await waitFor(() => expect(input.disabled).toBe(false));expect(saveProject).toHaveBeenCalled();
  await waitFor(() => expect(typeof respond).toBe("function"));await act(async () => { respond(transitionResponse(transitionBody)); });
  await waitFor(() => expectRuleStatuses({ RG20: "Cumple", RG21: "Incumple", RG22: "No aplica" }));
});
