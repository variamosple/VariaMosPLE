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

export interface Language {
  name: string;
  abstractSyntax: string;
  concreteSyntax: string;
  type: string;
  stateAccept: string;
  semantics: string;
}


export interface LanguageManagerProps {
  setLanguage: (value) => void;
  setCreatingLanguage: (value) => void;
  requestLanguages: boolean;
  setRequestLanguages: (value) => void;
}