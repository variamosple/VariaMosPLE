import { parseUvlForChatbot } from "./uvlModelAdapter";
import { serializeChatbotModelToUvl, syncUvlSourceToModel } from "./uvlModelAdapter";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { parseUVLDiagram } from "./UvlEditor";
import { buildSplotSxfm } from "./splotExport";
import {
  composeUvlSources,
  resolveUvlImportSource,
} from "./uvlComposition";

describe("UVL imports and submodel composition", () => {
  const sauces = `namespace submodels.Sauces

features
    Type
        alternative
            Ketchup
            Mustard

constraints
    Ketchup => Type
`;

  const root = `namespace shop

imports
    submodels.Sauces as Sauce

features
    Product
        optional
            Sauce.Type

constraints
    Sauce.Ketchup => Product
`;

  it("resolves dotted imports from slash-separated UVL files", () => {
    expect(resolveUvlImportSource("submodels.Sauces", {
      "submodels/Sauces.uvl": sauces,
    })).toEqual({ path: "submodels/Sauces.uvl", source: sauces });
  });

  it("composes imported roots and qualifies imported constraints", () => {
    const composed = composeUvlSources(root, { "submodels/Sauces.uvl": sauces });
    expect(composed.valid).toBe(true);
    expect(composed.resolvedImports).toEqual(expect.arrayContaining([
      expect.objectContaining({ namespace: "submodels.Sauces", alias: "Sauce", missing: false }),
    ]));
    const importedRoot = composed.document.root?.groups[0]?.features[0];
    expect(importedRoot?.name).toBe("Sauce.Type");
    expect(importedRoot?.groups[0]?.features.map((feature) => feature.name)).toEqual(["Sauce.Ketchup", "Sauce.Mustard"]);
    expect(composed.document.constraints.map((constraint) => constraint.raw)).toEqual(expect.arrayContaining([
      "Sauce.Ketchup => Sauce.Type",
      "Sauce.Ketchup => Product",
    ]));
  });

  it("projects a composed submodel into the chatbot graph", () => {
    const parsed = parseUvlForChatbot(root, "shop-model", { "submodels/Sauces.uvl": sauces });
    expect(parsed.valid).toBe(true);
    expect(parsed.elements.map((element: any) => element.name)).toEqual(expect.arrayContaining([
      "Product",
      "Sauce.Type",
      "Sauce.Ketchup",
      "Sauce.Mustard",
    ]));
    expect(parsed.metadata.resolvedImports[0]).toEqual(expect.objectContaining({ path: "submodels/Sauces.uvl", missing: false }));
  });

  it("uses the composed hierarchy for diagram/export projections", () => {
    const nodes = parseUVLDiagram(root, { "submodels/Sauces.uvl": sauces });
    expect(nodes[0].children[0].name).toBe("Sauce.Type");
    expect(nodes[0].children[0].children.map((child) => child.name)).toEqual(["Sauce.Ketchup", "Sauce.Mustard"]);
    expect(buildSplotSxfm("shop", nodes, ["Sauce.Ketchup => Product"])).toContain("Sauce.Ketchup");
  });

  it("keeps imported children out of the editable root serialization", () => {
    const model = new Model("shop-model", "Shop", "Feature model UVL", "uvl");
    expect(syncUvlSourceToModel(model, root, { "submodels/Sauces.uvl": sauces })).toBe(true);
    const serialized = serializeChatbotModelToUvl(model, root) || "";
    expect(serialized).toContain("Sauce.Type");
    expect(serialized).not.toMatch(/^\s+Sauce\.Ketchup$/m);
  });

  it("reports missing files only when a source registry was supplied", () => {
    expect(composeUvlSources(root, {}).diagnostics.some((item) => item.code === "IMPORT_SOURCE_MISSING")).toBe(true);
    expect(parseUvlForChatbot(root, "shop-model").diagnostics.some((item) => item.code === "IMPORT_SOURCE_MISSING")).toBe(false);
  });

  it("reports references that do not exist in an imported submodel", () => {
    const invalid = root.replace("Sauce.Ketchup => Product", "Sauce.DoesNotExist => Product");
    const result = composeUvlSources(invalid, { "submodels/Sauces.uvl": sauces });
    expect(result.diagnostics.some((item) => item.code === "IMPORT_REFERENCE_UNKNOWN")).toBe(true);
    expect(result.valid).toBe(false);
  });

  it("keeps the complete namespace when an import has no alias", () => {
    const noAliasRoot = root
      .replace("submodels.Sauces as Sauce", "submodels.Sauces")
      .replace(/Sauce\./g, "submodels.Sauces.");
    const result = composeUvlSources(noAliasRoot, { "submodels/Sauces.uvl": sauces });
    expect(result.valid).toBe(true);
    expect(result.document.root?.groups[0]?.features[0]?.name).toBe("submodels.Sauces.Type");
    expect(result.document.root?.groups[0]?.features[0]?.groups[0]?.features[0]?.name).toBe("submodels.Sauces.Ketchup");
  });

  it("detects import cycles", () => {
    const a = `imports\n    b\n\nfeatures\n    A\n`;
    const b = `imports\n    a\n\nfeatures\n    B\n`;
    const result = composeUvlSources(a, { "a.uvl": a, "b.uvl": b });
    expect(result.diagnostics.some((item) => item.code === "IMPORT_CYCLE")).toBe(true);
  });

  it("keeps nested import aliases qualified through the parent alias", () => {
    const inner = `features\n    Inner\n        optional\n            Leaf\n\nconstraints\n    Leaf => Inner\n`;
    const outer = `imports\n    inner as I\n\nfeatures\n    Outer\n        optional\n            I.Inner\n`;
    const composed = composeUvlSources(
      `imports\n    outer as O\n\nfeatures\n    Root\n        optional\n            O.Outer\n`,
      { "outer.uvl": outer, "inner.uvl": inner }
    );
    const importedOuter = composed.document.root?.groups[0]?.features[0];
    expect(importedOuter?.name).toBe("O.Outer");
    expect(importedOuter?.groups[0]?.features[0]?.name).toBe("O.I.Inner");
    expect(composed.document.constraints.map((constraint) => constraint.raw)).toContain("O.I.Leaf => O.I.Inner");
  });
});
