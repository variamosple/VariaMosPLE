//@ts-nocheck
import axios from "axios";
import * as alertify from "alertifyjs";
import { runQuery } from "./QueryUseCases";
import { Query } from "../Entities/Query";

jest.mock("axios");
jest.mock("alertifyjs", () => ({ success: jest.fn(), error: jest.fn() }));

const FEATURE_MODEL = { id: "model-1", type: "Feature model with attributes", languageId: "332" };
const OTHER_MODEL = { id: "model-2", type: "KAOS", languageId: "400" };
const FEATURE_LANGUAGE = { id: 332, name: "Feature model with attributes", semantics: "fm-rules" };
const KAOS_LANGUAGE = { id: 400, name: "KAOS", semantics: "kaos-rules" };

// The part of ProjectService that runQuery uses.
function projectService({ selected, currentLanguage = null, languages = [FEATURE_LANGUAGE, KAOS_LANGUAGE] }) {
  const models = [FEATURE_MODEL, OTHER_MODEL];
  return {
    project: { id: "project" },
    currentLanguage,
    languages,
    getTreeIdItemSelected: () => selected,
    findModelById: (_project, id) => models.find((model) => model.id === id),
    generateId: () => "transaction",
  };
}

const getCode = () => new Query({ solver: "swi", operation: "get_code" });

beforeEach(() => {
  jest.clearAllMocks();
  axios.post.mockResolvedValue({ data: { data: { content: "program" } } });
});

describe("runQuery", () => {
  test("sends nothing and says why when no model is selected", async () => {
    const result = await runQuery(projectService({ selected: undefined }), "/query", getCode());

    expect(result).toBeNull();
    expect(axios.post).not.toHaveBeenCalled();
    expect(alertify.error).toHaveBeenCalledWith("Select a model in the project tree first.");
  });

  test("finds the language of the selected model before any click in the tree", async () => {
    const result = await runQuery(projectService({ selected: "model-1" }), "/query", getCode());

    expect(result).toBe("program");
    expect(axios.post.mock.calls[0][1].data.rules).toBe("fm-rules");
    expect(axios.post.mock.calls[0][1].data.modelSelectedId).toBe("model-1");
  });

  test("uses the language of the selected model, not the one of another model", async () => {
    const service = projectService({ selected: "model-1", currentLanguage: KAOS_LANGUAGE });

    await runQuery(service, "/query", getCode());

    expect(axios.post.mock.calls[0][1].data.rules).toBe("fm-rules");
  });

  test("keeps the current language when it is the one of the selected model", async () => {
    const current = { ...FEATURE_LANGUAGE, semantics: "current-rules" };

    await runQuery(projectService({ selected: "model-1", currentLanguage: current }), "/query", getCode());

    expect(axios.post.mock.calls[0][1].data.rules).toBe("current-rules");
  });

  test("sends nothing and says why when the language of the model is not loaded", async () => {
    const result = await runQuery(projectService({ selected: "model-1", languages: [] }), "/query", getCode());

    expect(result).toBeNull();
    expect(axios.post).not.toHaveBeenCalled();
    expect(alertify.error).toHaveBeenCalledTimes(1);
  });

  test("shows the message the translator gives for a mistake in the model", async () => {
    const message = "The constraints written in this model are not valid (line 1, column 1).";
    axios.post.mockRejectedValueOnce({ response: { status: 400, data: { data: { error: message } } } });

    const result = await runQuery(projectService({ selected: "model-1" }), "/query", getCode());

    expect(result).toBeNull();
    expect(alertify.error).toHaveBeenCalledWith(message);
  });

  test("keeps the general message when the translator gives none", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network Error"));

    await runQuery(projectService({ selected: "model-1" }), "/query", getCode());

    expect(alertify.error).toHaveBeenCalledWith("something went wrong ...");
  });
});
