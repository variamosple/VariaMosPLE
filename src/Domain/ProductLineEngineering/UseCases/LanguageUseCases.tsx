import ExternalFuntionService from "../../../DataProvider/Services/externalFunctionService";
import LanguageService from "../../../DataProvider/Services/languageService";
import { ExternalFuntion } from "../Entities/ExternalFuntion";
import { Language } from "../Entities/Language";

export default class LanguageUseCases {
  private languageService: LanguageService = new LanguageService();
  private externalFunctionService: ExternalFuntionService =
    new ExternalFuntionService();

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

  callExternalFuntion(callback: any, externalFunction: ExternalFuntion): any[] {
    return this.externalFunctionService.callExternalFuntion(
      callback,
      externalFunction
    );
  }

  getExternalFunctions(callback: any, languageName: string) {
    return this.externalFunctionService.getExternalFunctions(
      callback,
      languageName
    );
  }
}
