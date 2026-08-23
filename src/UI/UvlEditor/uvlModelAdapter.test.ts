import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { parseUvlForChatbot, serializeChatbotModelToUvl, syncUvlSourceToModel } from "./uvlModelAdapter";
import { ensureUvlLanguageRegistered, UVL_LANGUAGE_NAME } from "./uvlLanguageDefinition";

describe("UVL chatbot model adapter", () => {
  const source = `namespace shop

features
    Shop
        mandatory
            Catalog {visible true}
        optional
            Search
        alternative
            Card
            Transfer

constraints
    Search => Catalog
    Card <=> !Transfer
`;

  it("maps UVL hierarchy and Boolean constraints to chatbot elements", () => {
    const parsed = parseUvlForChatbot(source, "model-1");
    expect(parsed.valid).toBe(true);
    expect(parsed.elements.filter((element) => element.type === "RootFeature")).toHaveLength(1);
    expect(parsed.elements.filter((element) => element.type === "Feature")).toHaveLength(4);
    expect(parsed.elements.filter((element) => element.type === "Group")).toHaveLength(1);
    expect(parsed.elements.filter((element) => element.type === "Constraint")).toHaveLength(2);
  });

  it("round-trips mandatory, optional, alternative, attributes and constraints", () => {
    const model = new Model("model-1", "Shop", "Feature model UVL", "uvl");
    expect(syncUvlSourceToModel(model, source)).toBe(true);
    const serialized = serializeChatbotModelToUvl(model, source) ?? "";
    expect(serialized).toContain("mandatory\n            Catalog {visible true}");
    expect(serialized).toContain("optional\n            Search");
    expect(serialized).toContain("alternative\n            Card\n            Transfer");
    expect(serialized).toContain("Search => Catalog");
  });

  it("turns chatbot parentId hints into UVL relationships", () => {
    const model = new Model("model-parent", "Editor", "Feature model UVL", "uvl");
    expect(syncUvlSourceToModel(model, "namespace Example\n\nfeatures\n    Root {abstract}\n")).toBe(true);
    const root = model.elements.find((element: any) => element.type === "RootFeature") as any;
    const child: any = {
      id: "created-zip",
      name: "Zip",
      type: "Feature",
      parentId: root.id,
      properties: [
        { name: "FeatureType", value: "Untyped" },
        { name: "Cardinality", value: "" },
        { name: "Attributes", value: "" },
        { name: "UVLOrder", value: "1" },
      ],
      x: 0,
      y: 0,
      width: 130,
      height: 50,
    };
    model.elements.push(child);

    const serialized = serializeChatbotModelToUvl(model, (model as any).uvl) ?? "";

    expect(serialized).toContain("optional\n            Zip");
    expect(model.relationships).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: "RootFeature_Child",
        sourceId: root.id,
        targetId: child.id,
      }),
    ]));
    expect(child.parentId).toBeNull();
  });

  it("registers the built-in UVL language once for chatbot discovery", () => {
    const registry: any = { languages: [] };
    ensureUvlLanguageRegistered(registry);
    ensureUvlLanguageRegistered(registry);
    expect(registry.languages).toHaveLength(1);
    expect(registry.languages[0].name).toBe(UVL_LANGUAGE_NAME);
    expect(registry.languages[0].abstractSyntax.elements.RootFeature).toBeDefined();
  });

  it("hydrates an existing UVL language whose abstract syntax is empty", () => {
    const existing = {
      id: 42,
      name: UVL_LANGUAGE_NAME,
      type: "DOMAIN",
      abstractSyntax: "",
      concreteSyntax: "",
      semantics: "",
    };
    const listener = jest.fn();
    const registry: any = {
      languages: [existing],
      raiseEventLanguagesDetail: listener,
    };

    ensureUvlLanguageRegistered(registry);

    expect(registry.languages).toHaveLength(1);
    expect(registry.languages[0]).toBe(existing);
    expect(registry.languages[0].id).toBe(42);
    expect(registry.languages[0].abstractSyntax.elements.RootFeature).toBeDefined();
    expect(registry.languages[0].abstractSyntax.relationships.RootFeature_Child).toBeDefined();
    expect(listener).toHaveBeenCalledWith(registry.languages);
  });

  it("preserves a complete persisted UVL definition", () => {
    const persistedAbstractSyntax = JSON.stringify({
      elements: { PersistedRoot: { properties: [] } },
      relationships: { PersistedChild: { source: "PersistedRoot", target: ["PersistedRoot"] } },
    });
    const registry: any = {
      languages: [{
        name: UVL_LANGUAGE_NAME,
        type: "DOMAIN",
        stateAccept: "ACTIVE",
        abstractSyntax: persistedAbstractSyntax,
        concreteSyntax: "{}",
        semantics: "{}",
      }],
      raiseEventLanguagesDetail: jest.fn(),
    };

    ensureUvlLanguageRegistered(registry);

    expect(registry.languages[0].abstractSyntax).toBe(persistedAbstractSyntax);
    expect(registry.raiseEventLanguagesDetail).not.toHaveBeenCalled();
  });
});
