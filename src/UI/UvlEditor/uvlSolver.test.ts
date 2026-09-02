import { analyzeUvlWithSolver } from "./uvlSolver";

describe("UVL SAT and BDD analysis", () => {
  const basicModel = `namespace demo

features
    Root
        mandatory
            Core
        optional
            Docs

constraints
    Core => !Docs
`;

  it("finds a real SAT witness for a valid Boolean model", () => {
    const result = analyzeUvlWithSolver("sat", basicModel);
    expect(result.status).toBe("sat");
    expect(result.model).toEqual({ Root: true, Core: true, Docs: false });
    expect(result.clauseCount).toBeGreaterThan(0);
    expect(result.details.join(" ")).toContain("DPLL decisions");
  });

  it("detects an unsatisfiable hierarchy and constraint combination", () => {
    const result = analyzeUvlWithSolver("sat", `features
    Root
        mandatory
            Core

constraints
    Core => !Core
`);
    expect(result.status).toBe("unsat");
    expect(result.summary).toContain("No feature configuration");
  });

  it("builds a reduced BDD and counts alternative configurations", () => {
    const result = analyzeUvlWithSolver("bdd", `features
    Root
        alternative
            A
            B
`);
    expect(result.status).toBe("sat");
    expect(result.modelCount).toBe(2);
    expect(result.bddNodeCount).toBeGreaterThan(0);
    expect(Object.keys(result.model || {})).toEqual(["Root", "A", "B"]);
  });

  it("encodes an or group as an at-least-one cardinality", () => {
    const result = analyzeUvlWithSolver("bdd", `features
    Root
        or
            A
            B
`);
    expect(result.status).toBe("sat");
    expect(result.modelCount).toBe(3);
  });

  it("enforces explicit cardinality bounds in both engines", () => {
    const source = `features
    Root
        [1..1]
            A
            B
            C
`;
    const sat = analyzeUvlWithSolver("sat", source);
    const bdd = analyzeUvlWithSolver("bdd", source);
    expect(sat.status).toBe("sat");
    expect(bdd.status).toBe("sat");
    expect(bdd.modelCount).toBe(3);
  });

  it("does not weaken an at-most cardinality during SAT encoding", () => {
    const result = analyzeUvlWithSolver("sat", `features
    Root
        [1..1]
            A
            B
            C

constraints
    A & B
`);
    expect(result.status).toBe("unsat");
  });

  it("makes nested group cardinalities conditional on their parent", () => {
    const source = `features
    Root
        optional
            Parent
                or
                    A
                    B
`;
    expect(analyzeUvlWithSolver("sat", source).status).toBe("sat");
    expect(analyzeUvlWithSolver("bdd", source).modelCount).toBe(4);
  });

  it("supports Boolean equality and equivalence constraints", () => {
    const result = analyzeUvlWithSolver("sat", `features
    Root
        optional
            A
            B

constraints
    A == B
`);
    expect(result.status).toBe("sat");
    expect(result.model?.Root).toBe(true);
    expect(result.model?.A).toBe(result.model?.B);
  });

  it("fails closed for typed UVL semantics instead of claiming an exact result", () => {
    const result = analyzeUvlWithSolver("sat", `include
    Arithmetic

features
    Root
        Integer Count

constraints
    Count > 0
`);
    expect(result.status).toBe("unknown");
    expect(result.details.join(" ")).toContain("Not encoded");
  });

  it("analyzes composed imported Boolean features", () => {
    const root = `imports
    submodels.Part as Part

features
    Product
        optional
            Part.Core
`;
    const submodel = `namespace submodels.Part

features
    Core
        optional
            Extra
`;
    const result = analyzeUvlWithSolver("sat", root, { "submodels/Part.uvl": submodel });
    expect(result.status).toBe("sat");
    expect(Object.keys(result.model || {})).toEqual(expect.arrayContaining(["Part.Core", "Part.Extra"]));
  });
});
