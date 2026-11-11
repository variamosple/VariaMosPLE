import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProjectService from "../../../Application/Project/ProjectService";
import { PROJECTS_CLIENT } from "../../../Infraestructure/AxiosConfig";
import Chatbot from "./Chatbot";

jest.mock("../../../Infraestructure/AxiosConfig", () => ({
  PROJECTS_CLIENT: { post: jest.fn() }
}));
jest.mock("./OrganicRAGService", () => ({ getOrganicRAG: jest.fn() }));
jest.mock("../../../DataProvider/Services/collab/treeCollaborationService", () => ({}));

const post = PROJECTS_CLIENT.post as jest.Mock;

function setup() {
  const language = {
    id: 7, name: "Test language", type: "DOMAIN",
    abstractSyntax: { elements: { Node: {} }, relationships: {} }
  };
  const domain = {
    id: "domain", type: language.name, languageId: "7", name: "Domain",
    elements: [{ id: "original", name: "Original", type: "Node", properties: [] }],
    relationships: []
  };
  const adapted = {
    id: "adapted", languageId: "7", relationships: [],
    elements: [{
      id: "variant",
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
    createDomainEngineeringModel: jest.fn(() => {
      const model = { ...domain, id: "created", elements: [] };
      domainModels.push(model);
      return model;
    }),
    findModelById: () => domain,
    getTreeIdItemSelected: () => domain.id,
    getProject: () => project,
    getProjectInformation: () => null,
    raiseEventDomainEngineeringModel: jest.fn(),
    removeModelElementById: (model: typeof domain, id: string) => {
      model.elements = model.elements.filter(element => element.id !== id);
    },
    saveProject: jest.fn()
  };
  render(<Chatbot projectService={service as unknown as ProjectService} />);
  return { domain, domainModels, saveProject: service.saveProject };
}

function sendJson(value: object) {
  const input = screen.getByRole("textbox") as HTMLInputElement;
  fireEvent.change(input, { target: { value: JSON.stringify(value) } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  return input;
}

beforeEach(() => post.mockReset());

test("a model is created and saved while its validation is still pending", async () => {
  let respond: (result: unknown) => void;
  post.mockReturnValueOnce(new Promise(resolve => { respond = resolve; }));
  const { domainModels, saveProject } = setup();
  const input = sendJson({ name: "New", elements: [{ name: "New node", type: "Node" }], relationships: [] });

  await screen.findByText("Modelo creado ✅");
  await waitFor(() => expect(input.disabled).toBe(false));
  expect(saveProject).toHaveBeenCalled();
  expect(domainModels[1].elements).toHaveLength(1);
  expect(post).toHaveBeenCalledTimes(1);
  const [url, body] = post.mock.calls[0];
  expect(url).toBe("/api/ai/validate-snapshot");
  const capture = JSON.parse(body);
  const line = capture.project.productLines[0];
  expect(line.domainEngineering.models[1].elements[0]).toEqual({
    id: domainModels[1].elements[0].id, type: "Node", parentId: null
  });
  expect(line.applicationEngineering.applications[0].adaptations[0].models[0].id).toBe("adapted");
  expect(capture.metamodels["7"].elements.Node).toEqual({});

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
  expect(screen.getByText("Log").parentElement.textContent).toContain(
    "[RG05] incumple · El destino no existe. (adapted/variant → domain/original)"
  );
  expect(domainModels[1].elements).toHaveLength(1);
});

test("an unavailable validation service leaves the applied patch and saving intact", async () => {
  post.mockRejectedValueOnce({ response: { status: 404 } });
  const { domain, saveProject } = setup();
  const input = sendJson({ ops: [{ op: "deleteElement", selector: { id: "original" } }] });

  await screen.findByText("PATCH aplicado ✅");
  await waitFor(() => expect(screen.getByText("Log").parentElement.textContent).toContain(
    "[Validación · intento 1] No evaluado"
  ));
  expect(domain.elements).toEqual([]);
  expect(saveProject).toHaveBeenCalled();
  expect(input.disabled).toBe(false);
  expect(post).toHaveBeenCalledTimes(1);
  expect(JSON.parse(post.mock.calls[0][1]).project.productLines[0].domainEngineering.models[0].elements).toEqual([]);
});
