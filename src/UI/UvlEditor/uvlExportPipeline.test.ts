import {
  buildUvlExportContent,
  buildUvlExportContext,
  createUvlWorkspaceBundle,
  parseUvlWorkspaceBundle,
  uvlDocumentToExportNodes,
} from "./uvlExportPipeline";

describe("UVL export pipeline", () => {
  const source = `namespace shop
include
    Boolean.group-cardinality

features
    Product {abstract}
        [1..2]
            Web
            Mobile

constraints
    Web => Product
`;

  it("projects the composed AST without losing group boundaries", () => {
    const context = buildUvlExportContext(source, {}, "splot", "shop.uvl");
    expect(context.valid).toBe(true);
    expect(context.nodes).toHaveLength(1);
    expect(context.nodes[0].children.map((child) => child.name)).toEqual(["Web", "Mobile"]);
    expect(context.nodes[0].children[0].groupId).toBe(context.nodes[0].children[1].groupId);
    expect(context.nodes[0].children[0].groupCardinality).toEqual({ min: 1, max: 2 });
    expect(context.constraints).toEqual(["Web => Product"]);
  });

  it("creates a lossless workspace bundle and reads it back", () => {
    const submodels = { "submodels/Feature.uvl": "namespace submodels.Feature\n\nfeatures\n    Feature\n" };
    const bundle = createUvlWorkspaceBundle(source, submodels, "shop.uvl");
    const parsed = parseUvlWorkspaceBundle(JSON.stringify(bundle));
    expect(parsed).not.toBeNull();
    expect(parsed?.rootSource).toBe(source);
    expect(parsed?.rootFileName).toBe("shop.uvl");
    expect(parsed?.submodels).toEqual(submodels);
    expect(parsed?.metadata.namespace).toBe("shop");
  });

  it("accepts the legacy JSON export shape", () => {
    const parsed = parseUvlWorkspaceBundle(JSON.stringify({ format: "UVL", source, submodels: {} }));
    expect(parsed?.rootSource).toBe(source);
    expect(parsed?.format).toBe("variamos-uvl-workspace");
  });

  it("reports standard-format losses explicitly", () => {
    const typed = `features
    Root {abstract}
        Integer Copies
`;
    const context = buildUvlExportContext(typed, {}, "afm");
    expect(context.losses.map((loss) => loss.message).join(" ")).toContain("type 'Integer'");
  });

  it("builds each standard export from the same AST context", () => {
    const context = buildUvlExportContext(`features
    Root
        mandatory
            Core
`, {}, "uvl", "example.uvl");
    expect(buildUvlExportContent("uvl", context, "example")).toContain("features");
    expect(buildUvlExportContent("json", context, "example")).toContain("variamos-uvl-workspace");
    expect(buildUvlExportContent("splot", context, "example")).toContain("<feature_model");
    expect(buildUvlExportContent("afm", context, "example")).toContain("%Relationships");
    expect(buildUvlExportContent("glencoe", context, "example")).toContain('"features"');
  });

  it("keeps the AST converter available for consumers that already have a document", () => {
    const context = buildUvlExportContext("features\n    Root\n");
    expect(uvlDocumentToExportNodes(context.document)[0].name).toBe("Root");
  });
});
