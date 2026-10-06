import { buildGlencoeGfmJson } from "./glencoeExport";

const leaf = (name: string, relation: string) => ({ name, relation, children: [] });

describe("Glencoe GFM JSON exporter", () => {
  it("writes the official Glencoe schema for a simple tree", () => {
    const result = JSON.parse(buildGlencoeGfmJson("Ignored file name", [{
      name: "Root",
      relation: "root",
      children: [leaf("Core", "mandatory"), leaf("Docs", "optional")],
    }], ["Docs => Core", "Core <=> !Docs"]));

    expect(result.id).toBe("FM_Root");
    expect(result.name).toBe("FM_Root");
    expect(result.features.Core).toEqual({ name: "Core", optional: false, type: "FEATURE", note: "" });
    expect(result.features.Docs).toEqual({ name: "Docs", optional: true, type: "FEATURE", note: "" });
    expect(result.features.Root).toEqual({ name: "Root", optional: true, type: "FEATURE", note: "" });
    expect(result.tree).toEqual({
      id: "Root",
      children: [{ id: "Core" }, { id: "Docs" }],
    });
    expect(result.constraints["Constraint 0"]).toEqual({
      type: "ImpliesTerm",
      operands: [
        { type: "FeatureTerm", operands: ["Docs"] },
        { type: "FeatureTerm", operands: ["Core"] },
      ],
    });
    expect(result.constraints["Constraint 1"].operands[1]).toEqual({
      type: "NotTerm",
      operands: [{ type: "FeatureTerm", operands: ["Docs"] }],
    });
  });

  it("writes XOR and GENOR groups with their cardinalities", () => {
    const result = JSON.parse(buildGlencoeGfmJson("Example", [{
      name: "Root",
      relation: "root",
      children: [
        { ...leaf("Web", "alternative"), groupId: "g1", groupCardinality: { min: 1, max: 1 } },
        { ...leaf("Mobile", "alternative"), groupId: "g1", groupCardinality: { min: 1, max: 1 } },
      ],
    }], []));
    expect(result.features.Root.type).toBe("XOR");
    expect(result.features.Web.optional).toBe(true);
    expect(result.tree.children).toEqual([{ id: "Mobile" }, { id: "Web" }]);

    const genor = JSON.parse(buildGlencoeGfmJson("Example", [{
      name: "Root",
      relation: "root",
      children: [
        { ...leaf("A", "cardinality"), groupId: "g1", groupCardinality: { min: 1, max: 2 } },
        { ...leaf("B", "cardinality"), groupId: "g1", groupCardinality: { min: 1, max: 2 } },
      ],
    }], []));
    expect(genor.features.Root).toMatchObject({ type: "GENOR", min: 1, max: 2 });
  });

  it("rejects mixed relations that Glencoe cannot encode without changing semantics", () => {
    expect(() => buildGlencoeGfmJson("Example", [{
      name: "Root",
      relation: "root",
      children: [
        leaf("Core", "mandatory"),
        { ...leaf("Web", "alternative"), groupId: "g1", groupCardinality: { min: 1, max: 1 } },
        { ...leaf("Mobile", "alternative"), groupId: "g1", groupCardinality: { min: 1, max: 1 } },
      ],
    }], [])).toThrow("mixed or multiple child relations");
  });

  it("maps quoted constraint references to Glencoe-safe identifiers", () => {
    const result = JSON.parse(buildGlencoeGfmJson("Example", [{
      name: "Root",
      relation: "root",
      children: [leaf("Feature A", "mandatory")],
    }], ["\"Feature A\" => Root"]));
    expect(result.features.Feature_A).toBeDefined();
    expect(result.constraints["Constraint 0"].operands[0].operands).toEqual(["Feature_A"]);
  });
});
