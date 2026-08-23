export const UVL_LANGUAGE_NAME = "Feature model UVL";

type LanguageRegistry = {
  languages?: any[];
  raiseEventLanguagesDetail?: (languages: any[]) => void;
};

const stringProperty = (name: string, possibleValues = "", defaultValue = "") => ({
  name,
  type: "String",
  possibleValues,
  defaultValue,
  comment: `${name} used by the UVL textual adapter`,
});

export const UVL_ABSTRACT_SYNTAX = {
  elements: {
    RootFeature: {
      properties: [
        stringProperty("FeatureType", "Untyped,Boolean,Integer,Real,String", "Untyped"),
        stringProperty("Cardinality"),
        stringProperty("Attributes"),
      ],
    },
    Feature: {
      properties: [
        stringProperty("FeatureType", "Untyped,Boolean,Integer,Real,String", "Untyped"),
        stringProperty("Cardinality"),
        stringProperty("Attributes"),
      ],
    },
    Group: {
      properties: [
        stringProperty("GroupType", "Or,Alternative,Cardinality", "Or"),
        stringProperty("Cardinality", "", "[1..*]"),
      ],
    },
    Constraint: {
      properties: [stringProperty("Expression")],
    },
  },
  restrictions: {
    quantity_element: [{ element: "RootFeature", min: 1, max: 1 }],
    unique_name: { elements: [["RootFeature", "Feature"]] },
    parent_child: [
      { parentElement: ["RootFeature", "Feature"], childElement: "Feature" },
      { parentElement: ["RootFeature", "Feature"], childElement: "Group" },
      { parentElement: ["Group"], childElement: "Feature" },
    ],
  },
  relationships: {
    RootFeature_Child: {
      min: 0,
      max: 9999999,
      source: "RootFeature",
      target: ["Feature", "Group"],
      properties: [stringProperty("Relation", "Mandatory,Optional", "Optional")],
    },
    Feature_Child: {
      min: 0,
      max: 9999999,
      source: "Feature",
      target: ["Feature", "Group"],
      properties: [stringProperty("Relation", "Mandatory,Optional", "Optional")],
    },
    Group_Feature: {
      min: 1,
      max: 9999999,
      source: "Group",
      target: ["Feature"],
      properties: [],
    },
  },
};

export const UVL_CONCRETE_SYNTAX = {
  elements: {
    RootFeature: { label: "Root feature", width: 150, height: 50, design: "rounded=1;strokeWidth=2", label_property: "" },
    Feature: { label: "Feature", width: 130, height: 45, design: "rounded=1", label_property: "" },
    Group: { label: "Group", width: 90, height: 40, design: "shape=rhombus", label_property: "GroupType" },
    Constraint: { label: "Constraint", width: 180, height: 55, design: "shape=note", label_property: "Expression" },
  },
  relationships: {
    RootFeature_Child: { styles: [{ style: "endArrow=none;strokeWidth=2" }], label_property: "Relation" },
    Feature_Child: { styles: [{ style: "endArrow=none;strokeWidth=2" }], label_property: "Relation" },
    Group_Feature: { styles: [{ style: "endArrow=none;strokeWidth=2" }], label_property: "" },
  },
};

export const UVL_LANGUAGE_DEFINITION = {
  name: UVL_LANGUAGE_NAME,
  type: "DOMAIN",
  stateAccept: "ACTIVE",
  abstractSyntax: UVL_ABSTRACT_SYNTAX,
  concreteSyntax: UVL_CONCRETE_SYNTAX,
  semantics: {},
};

const parseDefinition = (definition: any): any | null => {
  if (definition && typeof definition === "object") return definition;
  if (typeof definition !== "string" || !definition.trim()) return null;

  try {
    const parsed = JSON.parse(definition);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const hasUsableAbstractSyntax = (definition: any): boolean => {
  const parsed = parseDefinition(definition);
  return !!(
    parsed &&
    parsed.elements &&
    Object.keys(parsed.elements).length > 0 &&
    parsed.relationships &&
    Object.keys(parsed.relationships).length > 0
  );
};

export function ensureUvlLanguageRegistered(projectService: LanguageRegistry): void {
  const service = projectService as any;
  const languages = Array.isArray(service.languages) ? service.languages : null;
  if (!languages) return;

  const registeredDefinitions = languages.filter(
    (language: any) => language?.name === UVL_LANGUAGE_NAME
  );
  let changed = false;

  if (!registeredDefinitions.length) {
    languages.push({
      ...UVL_LANGUAGE_DEFINITION,
      abstractSyntax: UVL_ABSTRACT_SYNTAX,
      concreteSyntax: UVL_CONCRETE_SYNTAX,
      semantics: {},
    } as any);
    changed = true;
  } else {
    // A language stub can already exist (for example after creating it without
    // persisting its syntax). Keep its database id, but hydrate the metadata the
    // chatbot needs instead of treating the matching name as sufficient.
    registeredDefinitions.forEach((language: any) => {
      if (!hasUsableAbstractSyntax(language.abstractSyntax)) {
        language.abstractSyntax = UVL_ABSTRACT_SYNTAX;
        changed = true;
      }
      if (!parseDefinition(language.concreteSyntax)) {
        language.concreteSyntax = UVL_CONCRETE_SYNTAX;
        changed = true;
      }
      if (!language.type) {
        language.type = UVL_LANGUAGE_DEFINITION.type;
        changed = true;
      }
      if (!language.stateAccept) {
        language.stateAccept = UVL_LANGUAGE_DEFINITION.stateAccept;
        changed = true;
      }
      if (!parseDefinition(language.semantics)) {
        language.semantics = {};
        changed = true;
      }
    });
  }

  if (changed) {
    service.raiseEventLanguagesDetail?.(languages);
  }
}
