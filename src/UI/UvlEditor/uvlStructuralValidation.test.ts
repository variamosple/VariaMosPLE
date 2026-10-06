import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import {
  normalizeUvlStructuredModel,
  parseUvlCardinality,
  serializeChatbotModelToUvl,
  syncUvlSourceToModel,
  validateUvlSourceStructure,
  validateUvlStructuredModel,
} from "./uvlModelAdapter";

describe("UVL structural validation and normalization", () => {
  const validSource = `namespace demo

features
    Product
        mandatory
            Core
        or
            Web
            Mobile

constraints
    Core => (Web | Mobile)
`;

  it("accepts a valid hierarchy and assigns group cardinality", () => {
    const result = validateUvlSourceStructure(validSource, "validation-model");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(parseUvlCardinality("[1 .. *]")).toEqual({ min: 1, max: "*" });
    expect(parseUvlCardinality("[2]")).toEqual({ min: 2, max: 2 });
  });

  it("keeps multiple groups under the same parent distinct", () => {
    const source = `features
    Product
        or
            Web
            Mobile
        alternative
            Local
            Cloud
`;
    const model: any = new Model("multiple-groups", "Product", "Feature model UVL", "uvl");
    expect(syncUvlSourceToModel(model, source)).toBe(true);
    expect(model.elements.filter((element: any) => element.type === "Group")).toHaveLength(2);
  });

  it("detects orphan features before persistence", () => {
    const result = validateUvlSourceStructure("features\n    A\n    B\n", "invalid-model");
    expect(result.valid).toBe(false);
    expect(result.issues.map((problem) => problem.code)).toEqual(expect.arrayContaining([
      "RELATION_PARENT_MISSING",
    ]));
  });

  it("detects a source without a root feature", () => {
    const result = validateUvlSourceStructure("namespace demo\n\nfeatures\n", "invalid-root");
    expect(result.issues.map((problem) => problem.code)).toContain("ROOT_MISSING");
  });

  it("does not hide invalid cardinalities while normalizing", () => {
    const model: any = new Model("invalid-cardinality", "Product", "Feature model UVL", "uvl");
    model.elements = [
      { id: "root", name: "Product", type: "RootFeature", properties: [] },
      { id: "child", name: "Core", type: "Feature", properties: [{ name: "Cardinality", value: "[3..1]" }] },
    ];
    model.relationships = [
      { id: "r1", type: "RootFeature_Child", sourceId: "root", targetId: "child", min: 0, max: 1, properties: [{ name: "Relation", value: "Optional" }] },
    ];
    normalizeUvlStructuredModel(model);
    expect(validateUvlStructuredModel(model).issues.map((problem) => problem.code)).toContain("FEATURE_CARDINALITY_INVALID");
  });

  it("turns chatbot parentId hints into relationships and normalizes defaults", () => {
    const model: any = new Model("model-parent", "Product", "Feature model UVL", "uvl");
    model.elements = [
      { id: "root", name: "Product", type: "RootFeature", properties: [] },
      { id: "child", name: "Core", type: "Feature", parentId: "root", properties: [] },
    ];
    model.relationships = [];

    normalizeUvlStructuredModel(model);

    expect(model.elements[1].parentId).toBeNull();
    expect(model.relationships).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "RootFeature_Child", sourceId: "root", targetId: "child" }),
    ]));
    expect(validateUvlStructuredModel(model).valid).toBe(true);
  });

  it("rejects cycles and prevents serialization of an invalid graph", () => {
    const model: any = new Model("model-cycle", "Product", "Feature model UVL", "uvl");
    model.elements = [
      { id: "root", name: "Product", type: "RootFeature", properties: [] },
      { id: "a", name: "A", type: "Feature", properties: [] },
      { id: "b", name: "B", type: "Feature", properties: [] },
    ];
    model.relationships = [
      { id: "r1", type: "RootFeature_Child", sourceId: "root", targetId: "a", min: 0, max: 1, properties: [{ name: "Relation", value: "Optional" }] },
      { id: "r2", type: "Feature_Child", sourceId: "a", targetId: "b", min: 0, max: 1, properties: [{ name: "Relation", value: "Optional" }] },
      { id: "r3", type: "Feature_Child", sourceId: "b", targetId: "a", min: 0, max: 1, properties: [{ name: "Relation", value: "Optional" }] },
    ];

    const validation = validateUvlStructuredModel(model);
    expect(validation.valid).toBe(false);
    expect(validation.issues.map((problem) => problem.code)).toContain("RELATION_CYCLE");
    expect(serializeChatbotModelToUvl(model, "namespace demo\n")).toBeNull();
  });

  it("round-trips valid text only after structural validation", () => {
    const model: any = new Model("model-roundtrip", "Product", "Feature model UVL", "uvl");
    expect(syncUvlSourceToModel(model, validSource)).toBe(true);
    const serialized = serializeChatbotModelToUvl(model, validSource);
    expect(serialized).toContain("mandatory");
    expect(serialized).toContain("or");
    expect(validateUvlSourceStructure(serialized || "", "model-roundtrip").valid).toBe(true);
  });
});
