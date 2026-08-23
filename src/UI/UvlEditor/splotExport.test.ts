import { buildSplotSxfm } from "./splotExport";

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
      "Optional excludes ChoiceA",
      "ChoiceA <=> ChoiceB",
    ]);
    expect(result).toContain("c1: ~Required or Optional");
    expect(result).toContain("c2: ~Optional or ~ChoiceA");
    expect(result).toContain("c3: ~ChoiceA or ChoiceB");
    expect(result).toContain("c4: ~ChoiceB or ChoiceA");
  });
});
