import {
  parseAndValidateUvl,
  parseUvlDocument,
  uvlAttributesToJson,
} from "./uvlParser";
import { parseUvlForChatbot, validateUvlSourceStructure } from "./uvlModelAdapter";
import { parseUVLDiagram } from "./UvlEditor";

describe("complete UVL parser and semantic levels", () => {
  const source = `namespace catalog

include
    Boolean.group-cardinality
    Arithmetic.aggregate-function
    Arithmetic.feature-cardinality
    Type.string-constraints

imports
    submodels.Sauces as Sauce

features
    Sandwich
        mandatory
            Integer Calories {cost 100, tags ['hot', 'cold']}
        optional
            String Label cardinality [1] {constraint len(Label) > 0}
        [0..2]
            Cheddar {cost 60}
            Gouda {cost 50}

constraints
    sum(cost) < 160
    Label == 'x'
    Sauce.Ketchup => Sandwich
`;

  it("parses sections, levels, imports, groups and typed attributes", () => {
    const result = parseAndValidateUvl(source);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(validateUvlSourceStructure(result.document.source, "complex-example").valid).toBe(true);
    expect(result.document.namespace?.name).toBe("catalog");
    expect(result.document.includes.map((level) => level.raw)).toEqual([
      "Boolean.group-cardinality",
      "Arithmetic.aggregate-function",
      "Arithmetic.feature-cardinality",
      "Type.string-constraints",
    ]);
    expect(result.document.imports[0].alias?.name).toBe("Sauce");
    expect(result.document.root?.groups.map((group) => group.kind)).toEqual([
      "mandatory",
      "optional",
      "cardinality",
    ]);
    expect(result.document.root?.groups[2].cardinality).toEqual({ min: 0, max: 2 });
    expect(result.document.root?.groups[0].features[0].featureType).toBe("Integer");
    expect(result.document.root?.groups[1].features[0].cardinality).toEqual({ min: 1, max: 1 });
    expect(result.document.constraints).toHaveLength(3);
  });

  it("converts nested and vector attributes to typed JSON", () => {
    const document = parseUvlDocument(`features
    Product
        optional
            Item {enabled true, labels ['a', 'b'], metadata {rank 2, active false}}
`);
    const item = document.root?.groups[0].features[0];
    expect(item).toBeDefined();
    expect(uvlAttributesToJson(item?.attributes || [])).toEqual({
      enabled: true,
      labels: ["a", "b"],
      metadata: { rank: 2, active: false },
    });
  });

  it("projects the AST into a chatbot graph without losing semantic metadata", () => {
    const parsed = parseUvlForChatbot(source, "complex-model");
    expect(parsed.valid).toBe(true);
    expect(parsed.elements.filter((element) => element.type === "RootFeature")).toHaveLength(1);
    expect(parsed.elements.filter((element) => element.type === "Feature")).toHaveLength(4);
    expect(parsed.elements.filter((element) => element.type === "Group")).toHaveLength(1);
    expect(parsed.relationships.filter((relationship) => relationship.type === "Group_Feature")).toHaveLength(2);
    const calories = parsed.elements.find((element) => element.name === "Calories");
    expect(calories?.properties.find((property) => property.name === "AttributeValues")?.value).toContain("cost");
    expect(parsed.metadata).toEqual(expect.objectContaining({
      namespace: "catalog",
      includes: expect.arrayContaining(["Arithmetic.feature-cardinality"]),
    }));
  });

  it("reports unknown language levels and semantic type errors", () => {
    const result = parseAndValidateUvl(`features
    Root
        optional
            String Label

include
    Boolean.unknown-extension

constraints
    Label & true
`);
    expect(result.errors.map((item) => item.code)).toEqual(expect.arrayContaining([
      "SECTION_ORDER_INVALID",
      "LANGUAGE_LEVEL_MINOR_UNKNOWN",
      "OPERATOR_TYPE_INVALID",
    ]));
  });

  it("accepts singleton feature cardinalities and rejects invalid ranges", () => {
    const valid = parseAndValidateUvl(`include
    Arithmetic.feature-cardinality

features
    Root
        optional
            Item cardinality [2]
`);
    expect(valid.document.root?.groups[0].features[0].cardinality).toEqual({ min: 2, max: 2 });
    expect(valid.errors).toHaveLength(0);

    const invalid = parseAndValidateUvl(`features
    Root
        optional
            Item cardinality [3..1]
`);
    expect(invalid.errors.map((item) => item.code)).toContain("CARDINALITY_INVALID");
  });

  it("resolves forward references after collecting the complete symbol table", () => {
    const result = parseAndValidateUvl(`features
    Root
        optional
            A {constraint B + 1}
            B
`);
    expect(result.errors.map((item) => item.code)).not.toContain("REFERENCE_UNKNOWN");
    expect(result.errors.map((item) => item.code)).toContain("OPERATOR_TYPE_INVALID");
  });

  it("accepts the official language-level example with aggregate and attribute constraints", () => {
    const result = parseAndValidateUvl(`include
    Boolean.group-cardinality
    Arithmetic.aggregate-function
    Arithmetic.feature-cardinality
    Type

features
    Sandwich
        mandatory
            Bread {Calories 100, Sugar 20}
        optional
            Sauce
                or
                    Ketchup {Calories 40, Sugar 35}
                    Mustard {Calories 25, Sugar 5}
        [0..2]
            Cheddar {Calories 60}
            Gouda {Calories 50}
        Pickle cardinality [1..3]

constraints
    Ketchup => Sauce
    Bread.Sugar + Ketchup.Sugar + Mustard.Sugar < 60
    sum(Calories) < 160
`);
    expect(result.errors).toHaveLength(0);
    expect(validateUvlSourceStructure(result.document.source, "official-example").valid).toBe(true);
    expect(result.document.root?.groups[2].kind).toBe("cardinality");
    expect(result.document.root?.groups[3].features[0].cardinality).toEqual({ min: 1, max: 3 });
  });

  it("applies numeric and string semantic levels to aggregate functions", () => {
    const result = parseAndValidateUvl(`include
    Arithmetic
    Type.numeric-constraints
    Type.string-constraints

features
    Root
        optional
            Integer Count
            String Name

constraints
    floor(Count) == 1
    len(Name) > 0
`);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("treats direct feature-cardinality declarations as optional children in the diagram", () => {
    const roots = parseUVLDiagram(`features
    Root
        Item cardinality [1..3]
`);
    expect(roots[0].children[0].relation).toBe("optional");
  });
});
