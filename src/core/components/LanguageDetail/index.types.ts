import { Language } from "../../../Domain/ProductLineEngineering/Entities/Language";

export interface LanguageDetailProps {
  language: Language;
  isCreatingLanguage: boolean;
  setRequestLanguages: (value) => void;
}
