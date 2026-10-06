import { buildAfm } from "./afmExport";

const leaf = (name: string, relation: string) => ({ name, relation, children: [] });

describe("AFM exporter", () => {
  it("writes mixed mandatory, optional and cardinality relationships", () => {
    const source = buildAfm("Example", [{
      name: "Root",
      relation: "root",
      children: [
        leaf("Core", "mandatory"),
        leaf("Docs", "optional"),
        {
          ...leaf("Web", "alternative"),
          groupId: "alternative-1",
          groupCardinality: { min: 1, max: 1 as number | "*" },
        },
        {
          ...leaf("Mobile", "alternative"),
          groupId: "alternative-1",
          groupCardinality: { min: 1, max: 1 as number | "*" },
        },
        {
          ...leaf("English", "cardinality"),
          groupId: "cardinality-1",
          groupCardinality: { min: 1, max: 2 as number | "*" },
        },
        {
          ...leaf("Spanish", "cardinality"),
          groupId: "cardinality-1",
          groupCardinality: { min: 1, max: 2 as number | "*" },
        },
      ],
    }], ["Docs => Core", "Web <=> !Mobile"]);

    expect(source).toContain("%Relationships");
    expect(source).toContain("Root : Core [Docs] [1,1]{Web Mobile} [1,2]{English Spanish};");
    expect(source).not.toContain("Core :");
    expect(source).toContain("(Docs REQUIRES Core);");
    expect(source).toContain("(Web IFF (NOT Mobile));");
    expect(source).toContain("%Attributes\n\n%Constraints");
  });

  it("rejects a model without a relationship specification", () => {
    expect(() => buildAfm("Example", [{ name: "Root", relation: "root", children: [] }], []))
      .toThrow("root feature to have at least one child relationship");
  });

  it("sanitises quoted UVL names for AFM and detects collisions", () => {
    const source = buildAfm("Example", [{
      name: "Root",
      relation: "root",
      children: [leaf("Feature A", "mandatory")],
    }], ["\"Feature A\" => Root"]);
    expect(source).toContain("Root : FeatureXA;");
    expect(source).toContain("(FeatureXA REQUIRES Root);");

    expect(() => buildAfm("Example", [{
      name: "Root",
      relation: "root",
      children: [leaf("A B", "mandatory"), leaf("A-B", "mandatory")],
    }], [])).toThrow("after identifier sanitisation");
  });

  it("avoids AFM reserved words in generated feature identifiers", () => {
    const source = buildAfm("Example", [{
      name: "Root",
      relation: "root",
      children: [leaf("and", "mandatory")],
    }], ["\"and\" => Root"]);
    expect(source).toContain("Root : Fand;");
    expect(source).toContain("(Fand REQUIRES Root);");

    expect(() => buildAfm("Example", [{
      name: "root",
      relation: "root",
      children: [leaf("feature", "mandatory")],
    }], ["\"feature\" => \"root\""])).not.toThrow();
  });
});
