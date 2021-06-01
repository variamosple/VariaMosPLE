import LanguageService from "../../../DataProvider/Services/languageService";
import { Language } from "../Entities/Language";

export default class LanguageUseCases {
  private languageService: LanguageService = new LanguageService();

  getLanguagesByType(languageType: string, languages: Language[]): Language[] {
    const languagesFilter: Language[] = languages.filter(
      (language) => (language.type = languageType)
    );
    return languagesFilter;
  }
  getLanguageByName(languageName: string, languages: Language[]): Language {
    const languagesFilter: Language = languages.filter(
      (language) => (language.name = languageName)
    )[0];
    return languagesFilter;
  }

  getLanguagesDetail(): Language[] {
    return this.languageService.getLanguagesDetail();
  }
}
