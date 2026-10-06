import { validateUVL } from "./UvlEditor";

describe("UVL validation against the official grammar", () => {
  it("accepts Boolean symbols, comparisons, arithmetic, aggregates, types and cardinalities", () => {
    const source = `include
    Boolean.group-cardinality
    Arithmetic.aggregate-function

features
    Root
        /* This block comment may span
           multiple lines without declaring features. */
        mandatory
            Boolean Enabled {cost 10}
        optional
            Numeric cardinality [0..2] {cost 20}
        [1..*]
            "First option"
            Second

constraints
    Enabled => !Second
    Enabled <=> ("First option" | Second)
    Numeric.cost + Enabled.cost <= 50
    sum(cost) >= 10
`;
    expect(validateUVL(source)).toEqual([]);
  });

  it("rejects word aliases that are not UVL Boolean operators", () => {
    const source = `features
    Root
        optional
            A
            B

constraints
    A requires B
`;
    expect(validateUVL(source).some((problem) => problem.message.includes("requires"))).toBe(true);
  });
});
