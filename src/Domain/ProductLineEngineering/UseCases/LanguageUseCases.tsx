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
      (language) => language.type === languageType
    );
    return languagesFilter;
  }

  getLanguageByName(languageName: string, languages: Language[]): Language {
    const languagesFilter: Language = languages.filter(
      (language) => language.name === languageName
    )[0];
    return languagesFilter;
  }

  getLanguagesByUser(user:string): Language[] {
    return this.languageService.getLanguagesByUser(user);
  }

  getLanguagesDetail(): Language[] {
    return this.languageService.getLanguagesDetail();
  }

  getLanguagesDetailCll(callBack: any) {
    return this.languageService.getLanguages(callBack);
  }

  createLanguage(callback: any, language: Language, user: string) {
    return this.languageService.createLanguage(callback, language, user);
  }

  updateLanguage(callback: any, language: Language, user: string) {
    return this.languageService.updateLanguage(callback, language, user);
  }

  deleteLanguage(callback: any, languageId: string, user: string) {
    return this.languageService.deleteLanguage(callback, languageId, user);
  }

  callExternalFuntion(callback: any, externalFunction: ExternalFuntion): any[] {
    return this.externalFunctionService.callExternalFuntion(
      callback,
      externalFunction
    );
  }

  getExternalFunctions(callback: any, languageId: number) {
    return this.externalFunctionService.getExternalFunctions(
      callback,
      languageId
    );
  }
}
