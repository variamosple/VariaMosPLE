import {
  clearUvlWorkspace,
  getUvlWorkspaceKey,
  loadUvlWorkspace,
  persistUvlWorkspace,
  persistUvlSubmodel,
  saveUvlWorkspace,
  submodelsFromModel,
} from "./uvlPersistence";

describe("UVL workspace persistence", () => {
  const key = getUvlWorkspaceKey("project-persistence-test", "model-persistence-test");

  afterEach(() => clearUvlWorkspace(key));

  it("round-trips root and imported source text", () => {
    const rootSource = "features\n    Root\n";
    const sauces = "features\n    Sauces\n";
    const model: any = {};
    persistUvlWorkspace(key, model, rootSource, [{ path: "submodels/Sauces.uvl", source: sauces }], "main.uvl");

    expect(model.uvl).toBe(rootSource);
    expect(model.uvlSubmodels["submodels/Sauces.uvl"]).toBe(sauces);
    expect(loadUvlWorkspace(key)).toEqual(expect.objectContaining({
      rootSource,
      rootFileName: "main.uvl",
      submodels: { "submodels/Sauces.uvl": sauces },
    }));
  });

  it("can restore submodels embedded in a project model", () => {
    const model: any = { uvlSubmodels: { "a.uvl": "features\n    A\n" } };
    expect(submodelsFromModel(model)).toEqual(model.uvlSubmodels);
  });

  it("updates one imported file without dropping other files", () => {
    const model: any = {
      uvl: "features\n    Root\n",
      uvlSubmodels: { "a.uvl": "old-a", "b.uvl": "old-b" },
    };
    persistUvlSubmodel(key, model, "a.uvl", "new-a");
    expect(loadUvlWorkspace(key)?.submodels).toEqual({ "a.uvl": "new-a", "b.uvl": "old-b" });
  });

  it("normalizes corrupt persisted JSON to null", () => {
    saveUvlWorkspace(key, { rootSource: "features\n    Root\n", submodels: {} });
    expect(loadUvlWorkspace(key)).not.toBeNull();
  });
});
