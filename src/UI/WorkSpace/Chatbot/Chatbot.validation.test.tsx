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

function correspondenceReport(body: string, overrides: Record<string, unknown> = {}) {
  const request = JSON.parse(body);
  return {
    schemaVersion: 1, kind: "correspondences", projectId: request.after.projectId, snapshotId: request.after.snapshotId,
    profileId: null,
    coverage: { effectiveScope: "complete", models: [{}, {}] },
    rules: ["RG06", "RG07", "RG08"].map(ruleId => ({ ruleId, status: "no_evaluable" })),
    findings: [{
      ruleIds: ["RG06", "RG07", "RG08"], status: "no_evaluable", description: "Faltan criterios explícitos para evaluar RG06 a RG08.",
      location: { path: "/project", modelId: null, elementId: null, referenceId: null }, evidence: {}
    }],
    ...overrides
  };
}

function constraintReport(body: string, overrides: Record<string, unknown> = {}) {
  const request = JSON.parse(body);
  return {
    schemaVersion: 1, kind: "constraints", projectId: request.after.projectId, snapshotId: request.after.snapshotId,
    profileId: null,
    coverage: { effectiveScope: "complete", models: [{}, {}] },
    rules: ["RG09", "RG10", "RG11", "RG12"].map(ruleId => ({ ruleId, status: "no_evaluable" })),
    findings: [], ...overrides
  };
}

function versionReport(body: string, overrides: Record<string, unknown> = {}) {
  const request = JSON.parse(body);
  return {
    schemaVersion: 1, kind: "versions", projectId: request.after.projectId, snapshotId: request.after.snapshotId,
    contextId: null, coverage: { effectiveScope: "complete", models: [{}, {}] },
    versionCoverage: { catalogScope: null, historyScope: null, revisionCount: 0 },
    rules: ["RG17", "RG18", "RG19"].map(ruleId => ({ ruleId, status: "no_evaluable" })),
    findings: [], ...overrides
  };
}

function traceReport(body: string, changes: any[], overrides: Record<string, unknown> = {}) {
  const request = JSON.parse(body);
  return { schemaVersion: 1, kind: "traceability", projectId: request.after.projectId, snapshotId: request.after.snapshotId,
    beforeSnapshotId: request.before.snapshotId, attemptId: request.attemptContext?.id ?? null, contextId: null,
    coverage: { effectiveScope: "complete", models: [{}, {}] },
    traceCoverage: { contextAccepted: false, contextScope: null, observedChangeCount: changes.length },
    rules: [{ ruleId: "RG20", status: "cumple" }, { ruleId: "RG21", status: "no_evaluable" },
      { ruleId: "RG22", status: "no_evaluable" }], findings: [],
    traces: changes.map((change, index) => ({ id: `trace-${index}`, changeIndex: index, entity: change.entity, operation: change.operation,
      originRefs: [{ kind: "origin", catalog: "attempt", id: request.attemptContext?.origin?.id ?? "unknown" }], historyIds: [] })), ...overrides };
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

test("the chatbot shows validation cards in the conversation and keeps the technical log free of file inputs", async () => {
  post.mockImplementation(async (url, body) => url === "/api/ai/validate-transition" ? renameResponse(body) : snapshotResponse(body));
  const { domain, saveProject } = setup();
  const logSummary = screen.getByText("Log");
  const logPanel = logSummary.parentElement;
  fireEvent.click(logSummary);
  expect(Array.from(logPanel.children, child => child.tagName)).toEqual(["SUMMARY", "PRE"]);
  expect(logPanel.closest(".chatbot").querySelector('input[type="file"]')).toBeNull();

  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "NoExternalFiles" }] });
  await waitFor(() => expectRuleStatuses({
    RG05: "Cumple", RG06: "No evaluable", RG07: "No evaluable", RG08: "No evaluable",
    RG09: "No evaluable", RG10: "No evaluable", RG11: "No evaluable", RG12: "No evaluable",
    RG16: "Cumple", RG17: "No evaluable", RG18: "No evaluable", RG19: "No evaluable",
    RG20: "Cumple", RG21: "No evaluable", RG22: "No evaluable"
  }));
  expect(attemptCard().closest(".chat-body")).toBeTruthy();
  expect(logPanel.textContent).not.toContain("No evaluable");
  expect(domain.elements[0].name).toBe("NoExternalFiles");
  expect(saveProject).toHaveBeenCalled();
  expect(post).toHaveBeenCalledTimes(2);
  const transition = JSON.parse(post.mock.calls.find(([url]) => url === "/api/ai/validate-transition")[1]);
  expect(Object.keys(transition).sort()).toEqual(["after", "attemptContext", "before", "schemaVersion"]);
  expect(transition.attemptContext.origin.source).toBe("chatbot");
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

test("creation and saving finish before transition validation arrives", async () => {
  let respond: (response: unknown) => void;
  let transitionBody: string;
  post.mockImplementation((url, body) => {
    if (url === "/api/ai/validate-snapshot") return Promise.resolve(snapshotResponse(body));
    transitionBody = body;
    return new Promise(resolve => { respond = resolve; });
  });
  const { saveProject } = setup();
  const input = sendJson({ name: "InformativeFourth", elements: [{ type: "Node", name: "A" }], relationships: [] });
  await screen.findByText("Modelo creado ✅");
  await waitFor(() => expect(saveProject).toHaveBeenCalled());
  await waitFor(() => expect(input.disabled).toBe(false));
  await waitFor(() => expect(typeof respond).toBe("function"));
  await act(async () => { respond(transitionResponse(transitionBody)); });
  await waitFor(() => expectRuleStatuses({ RG09: "No evaluable", RG10: "No evaluable", RG11: "No evaluable", RG12: "No evaluable", RG20: "Cumple" }));
});

test.each(["absent", "snapshot", "project", "profile", "kind", "invalid-status", "duplicate-rule"])("a fourth report with %s cannot create a false pass", async kind => {
  post.mockImplementation(async (url, body) => {
    if (url !== "/api/ai/validate-transition") return snapshotResponse(body);
    let report: any = constraintReport(body);
    if (kind === "absent") report = undefined;
    else if (kind === "snapshot") report.snapshotId = "another-attempt";
    else if (kind === "project") report.projectId = "another-project";
    else if (kind === "profile") {
      report.profileId = "another-profile";
      report.rules[0].status = "cumple";
    }
    else if (kind === "kind") report.kind = "correspondences";
    else if (kind === "invalid-status") report.rules[0].status = "unknown";
    else report.rules.push(report.rules[0]);
    return transitionResponse(body, { constraintValidation: report });
  });
  const { domain, saveProject } = setup();
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
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "MissingRules" }] });
  await waitFor(() => expectRuleStatuses({ RG09: "Cumple", RG10: "No evaluable", RG11: "No evaluable", RG12: "No evaluable" }));
  expect(attemptCard().textContent).toContain("El backend no incluyó estas reglas: RG10, RG11, RG12.");
});

test.each(["absent", "snapshot", "project", "context", "kind", "status", "duplicate", "coverage"])("a fifth report with %s cannot produce false passes", async kind => {
  post.mockImplementation(async (url, body) => {
    if (url !== "/api/ai/validate-transition") return snapshotResponse(body);
    let report: any = versionReport(body);
    if (kind === "absent") report = undefined;
    else if (kind === "snapshot") report.snapshotId = "old-snapshot";
    else if (kind === "project") report.projectId = "other-project";
    else if (kind === "context") {
      report.contextId = "other-context";
      report.rules[0].status = "no_aplica";
    }
    else if (kind === "kind") report.kind = "transition";
    else if (kind === "status") report.rules[0].status = "unknown";
    else if (kind === "duplicate") report.rules.push(report.rules[0]);
    else {
      report.contextId = "invalid-coverage";
      report.versionCoverage.revisionCount = -1;
    }
    return transitionResponse(body, { versionValidation: report });
  });
  const { domain, saveProject } = setup();
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
  setup();
  sendJson({ ops: [{ op: "renameElement", selector: { id: "original" }, newName: "MissingVersionRules" }] });
  await waitFor(() => expectRuleStatuses({ RG17: "Cumple", RG18: "No evaluable", RG19: "No evaluable" }));
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
  const { domain, saveProject } = setup();
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
