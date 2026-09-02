import { buildSplotSxfm, getSplotCompatibilityWarnings } from "./splotExport";
import { parseUVLDiagram } from "./UvlEditor";

describe("buildSplotSxfm", () => {
  const model = [{
    name: "Root",
    relation: "root",
    children: [
      { name: "Required", relation: "mandatory", children: [] },
      { name: "Optional", relation: "optional", children: [] },
      { name: "ChoiceA", relation: "alternative", children: [] },
      { name: "ChoiceB", relation: "alternative", children: [] },
    ],
  }];

  it("writes SPLOT feature markers, groups, IDs, and the .sxfm XML structure", () => {
    const result = buildSplotSxfm("Example & model", model, []);
    expect(result).toContain('<feature_model name="Example &amp; model">');
    expect(result).toContain(":r Root (Root)");
    expect(result).toContain("\t:m Required (Required)");
    expect(result).toContain("\t:o Optional (Optional)");
    expect(result).toContain("\t:g [1,1]");
    expect(result).toContain("\t\t: ChoiceA (ChoiceA)");
  });

  it("converts implication, exclusion, and equivalence to SPLOT CNF clauses", () => {
    const result = buildSplotSxfm("Example", model, [
      "Required => Optional",
      "!(Optional & ChoiceA)",
      "ChoiceA <=> ChoiceB",
    ]);
    expect(result).toContain("\tC1: ~Required or Optional");
    expect(result).toContain("\tC2: ~Optional or ~ChoiceA");
    expect(result).toContain("\tC3: ~ChoiceA or ChoiceB");
    expect(result).toContain("\tC4: ~ChoiceB or ChoiceA");
  });

  it("preserves distinct adjacent groups and writes finite OR bounds", () => {
    const groupedModel = [{
      name: "Root",
      relation: "root",
      children: [
        { name: "A", relation: "alternative", groupId: "alt-1", groupCardinality: { min: 1, max: 1 }, children: [] },
        { name: "B", relation: "alternative", groupId: "alt-1", groupCardinality: { min: 1, max: 1 }, children: [] },
        { name: "C", relation: "alternative", groupId: "alt-2", groupCardinality: { min: 1, max: 1 }, children: [] },
        { name: "D", relation: "alternative", groupId: "alt-2", groupCardinality: { min: 1, max: 1 }, children: [] },
        { name: "English", relation: "or", groupId: "or-1", groupCardinality: { min: 1, max: "*" as const }, children: [] },
        { name: "Spanish", relation: "or", groupId: "or-1", groupCardinality: { min: 1, max: "*" as const }, children: [] },
      ],
    }];

    const result = buildSplotSxfm("Groups", groupedModel, []);
    expect(result.match(/:g \[1,1\]/g)).toHaveLength(2);
    expect(result).toContain(":g [1,2]");
    expect(result).not.toContain(":g [1,*]");
  });

  it("writes general group cardinalities and quoted feature references", () => {
    const cardinalModel = [{
      name: "Root",
      relation: "root",
      children: [
        { name: "One format", relation: "cardinality", groupId: "card-1", groupCardinality: { min: 2, max: 3 }, children: [] },
        { name: "Second", relation: "cardinality", groupId: "card-1", groupCardinality: { min: 2, max: 3 }, children: [] },
        { name: "Third", relation: "cardinality", groupId: "card-1", groupCardinality: { min: 2, max: 3 }, children: [] },
      ],
    }];

    const result = buildSplotSxfm("Cardinality", cardinalModel, ['"One format" => Second']);
    expect(result).toContain(":g [2,3]");
    expect(result).toContain(": One format (One_format)");
    expect(result).toContain("\tC1: ~One_format or Second");
  });

  it("rejects group bounds that exceed the number of members", () => {
    const invalid = [{
      name: "Root",
      relation: "root",
      children: [
        { name: "Only", relation: "cardinality", groupId: "card-1", groupCardinality: { min: 2, max: 3 }, children: [] },
      ],
    }];

    expect(() => buildSplotSxfm("Invalid", invalid, [])).toThrow("bounds cannot exceed the group size");
  });

  it("preserves UVL group boundaries from source text", () => {
    const source = `features
    Root
        alternative
            A
            B
        alternative
            C
            D
        [2..*]
            E
            F
            G
`;

    const result = buildSplotSxfm("Integrated", parseUVLDiagram(source), []);
    expect(result.match(/:g \[1,1\]/g)).toHaveLength(2);
    expect(result).toContain(":g [2,3]");
  });

  it("reports UVL constructs that SXFM cannot preserve", () => {
    const warnings = getSplotCompatibilityWarnings(`imports
    other.model

features
    Root {abstract}
        optional
            Integer Copies cardinality [0..4] {default 1}
`);

    expect(warnings).toEqual(expect.arrayContaining([
      expect.stringContaining("imported UVL models"),
      expect.stringContaining("Integer feature"),
      expect.stringContaining("feature cardinality"),
      expect.stringContaining("attributes/modifiers"),
    ]));
  });
});
