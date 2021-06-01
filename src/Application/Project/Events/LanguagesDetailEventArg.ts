import { Language } from "../../../Domain/ProductLineEngineering/Entities/Language";

export class LanguagesDetailEventArg {
    public target: any;
    public languages: Language[];
  
    constructor(target: any, languages: Language[]) {
      this.target = target;
      this.languages = languages;
    }
  }