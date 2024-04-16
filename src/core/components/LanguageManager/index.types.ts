export interface CreateLanguageEvents {
  handleClose: () => void;
  handleCreateClick: () => void;
}

export interface CreateLanguageStates {
  show: boolean;
}

export interface CreateLanguageProps {
  handleCreateClick: (event) => void;
}


//These types are wrong...
export interface Language {
  name: string;
  abstractSyntax: string;
  concreteSyntax: string;
  type: string;
  stateAccept: string;
  //I should probably modify this to be of type Semantics
  semantics: string;
}

export interface LanguageManagerProps {
  setLanguage: (value) => void;
  setCreatingLanguage: (value) => void;
  requestLanguages: boolean;
  setRequestLanguages: (value) => void;
}

//Complete type definitions for the semantics specification rules
//Up to date as of 2024-02-15
export interface SimpleElementRule {
  param: string;
  constraint: string;
  enumMapping?: EnumParameterMapping;
  selectedConstraint?: string;
  deselectedConstraint?: string;
}

export interface EnumParameterMapping {
  var: string;
  attribute: string;
}

export interface MappingConfig {
  unique: boolean;
  var: string;
}

export interface ReifiedRelationParameterMapping {
  inboundEdges: MappingConfig;
  outboundEdges: MappingConfig;
  node?: string;
}

export interface ReifiedRelationElementRule {
  param: string[];
  paramMapping: ReifiedRelationParameterMapping;
  constraint: Record<string, string>;
}

export interface RelationRule {
  params: string[];
  constraint: string;
}

export interface RelationPropertyLookupRule {
  index: number;
  key: string;
}

export interface RelationTypedElementRule {
  param: string[];
  relationLookupSchema: Record<string, RelationPropertyLookupRule>;
  derivingRelationInbound: boolean;
  constraint: string;
}

export interface AttributeTranslationRule {
  parent: string;
  param: string;
  template: string;
  constraint: string;
  unsetConstraint?: string;
  value?: string;
  values?: string;
}

export interface HierarchyNodeRule {
  param: string[];
  paramMapping: HierarchyNodeParameterMapping;
  constraint: string;
}

export interface HierarchyNodeParameterMapping {
  incoming: boolean;
  var: string;
  node: string;
}

export interface HierarchyTranslationRule {
  nodeRule: HierarchyNodeRule;
  leafRule: SimpleElementRule;
}

export interface Semantics {
  elementTypes: string[];
  elementTranslationRules: Record<string, SimpleElementRule>;
  attributeTypes: string[];
  attributeTranslationRules: Record<string, AttributeTranslationRule>;
  typingRelationTypes: string[];
  typingRelationTranslationRules: Record<string, RelationTypedElementRule>;
  hierarchyTypes: string[];
  hierarchyTranslationRules: Record<string, HierarchyTranslationRule>;
  relationReificationTypes: string[];
  relationReificationTranslationRules: Record<string, ReifiedRelationElementRule>;
  relationReificationExpansions: Record<string, string[]>;
  relationReificationPropertySchema: Record<string, RelationPropertyLookupRule>;
  relationReificationTypeDependentExpansions: Record<string, Record<string, string[]>>;
  relationTypes: string[];
  relationPropertySchema: Record<string, RelationPropertyLookupRule>;
  relationTranslationRules: Record<string, RelationRule>;
  ignoredRelationTypes?: string[];
  symbolMap?: Record<string, string>;
}
