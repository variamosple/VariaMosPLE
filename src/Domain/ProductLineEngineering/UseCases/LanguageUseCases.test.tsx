//@ts-nocheck
import LanguageUseCases from "./LanguageUseCases";
import {mockReturnedValue} from "../../../mockReturnedValue";
import LanguageService from "../../../DataProvider/Services/languageService";
import {Language} from "../Entities/Language";
import externalFunctionService from "../../../DataProvider/Services/externalFunctionService";
import {ExternalFuntion} from "../Entities/ExternalFuntion";

afterEach(() => {
  jest.clearAllMocks();
});

describe('all methods should work', ()=>{
  test('Using getLanguagesByType should return the right values', () => {
    /*
    In the variable mockReturnedValue, all the languages type are DOMAIN
    so the result should be the same before and after the filter
     */
    //Arrange
    // @ts-ignore
    jest.spyOn(LanguageService.prototype, "getLanguagesDetail").mockImplementation(() => mockReturnedValue);
    let languageUseCases = new LanguageUseCases();
    // @ts-ignore
    let languages: any = languageUseCases.getLanguagesDetail().data;
    let languageType = "DOMAIN"

    //Act
    let languagesFilter = languageUseCases.getLanguagesByType(languageType, languages)
    //Assert
    expect(languagesFilter).toStrictEqual(languages)
  });

  test('Using getLanguageByName should return the right values', () => {
    //Arrange
    // @ts-ignore
    jest.spyOn(LanguageService.prototype, "getLanguagesDetail").mockImplementation(() => mockReturnedValue);
    let languageUseCases = new LanguageUseCases();
    // @ts-ignore
    let languages: any = languageUseCases.getLanguagesDetail().data;
    let languageName = "istar3"

    //Act
    let languagesFilter = languageUseCases.getLanguageByName(languageName, languages)

    //Assert
    expect(languagesFilter).toStrictEqual(languages[2])
  });

  test('Using getLanguagesDetail should use LanguageService method and return the right values', ()=>{
    //Arrange
    // @ts-ignore
    let langServGetLanguagesDetailMock = jest.spyOn(LanguageService.prototype, "getLanguagesDetail").mockImplementation(() => mockReturnedValue);
    let languageUseCases = new LanguageUseCases();

    //Act
    // @ts-ignore
    let languages: any = languageUseCases.getLanguagesDetail().data;

    //Assert
    expect(languages).toStrictEqual(mockReturnedValue.data)
    expect(langServGetLanguagesDetailMock).toHaveBeenCalled()
  });

  test('Using getLanguagesDetailCll should use LanguageService method', ()=>{

    //Arrange
    let langServGetLanguagesDetailMock = jest.spyOn(LanguageService.prototype, 'getLanguages').mockImplementation((callback) => callback());
    const logSpy = jest.spyOn(console, 'log')
    let languageUseCases = new LanguageUseCases();
    // @ts-ignore

    //Act
    languageUseCases.getLanguagesDetailCll(()=>{console.log("checked getLanguagesDetailCll")});

    //Assert
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).toHaveBeenCalledWith("checked getLanguagesDetailCll")
    expect(langServGetLanguagesDetailMock).toHaveBeenCalledTimes(1)


  });

  test('Using getLanguagesDetailCll should use LanguageService method and return the right values', ()=>{
    //Arrange
    let langServGetLanguagesDetailMock = jest.spyOn(LanguageService.prototype, 'getLanguages').mockImplementation((callback) => callback());
    let languageUseCases = new LanguageUseCases();

    //Act
    let languages: any = languageUseCases.getLanguagesDetailCll(()=>"callback return value");

    //Assert
    expect(langServGetLanguagesDetailMock).toHaveBeenCalledTimes(1)
    expect(languages).toBe("callback return value")
  });

  test('Using createLanguage should use LanguageService method and return the right values', ()=>{
    //Arrange
    let langServCreateLanguageMock = jest.spyOn(LanguageService.prototype, 'createLanguage').mockImplementation((callback: any, language:Language) => callback(language));
    jest.spyOn(LanguageUseCases.prototype, "getLanguagesDetail").mockImplementation(() => mockReturnedValue); // comment this line if just want to "spy"
    let languageUseCases = new LanguageUseCases();
    // @ts-ignore
    let languages: any = languageUseCases.getLanguagesDetail().data;
    let languageByName: Language = languageUseCases.getLanguageByName(
        'istar3',
        languages
    );

    //Act
    let result: any = languageUseCases.createLanguage(()=>"callback return value", languageByName);

    //Assert
    expect(langServCreateLanguageMock).toHaveBeenCalledTimes(1)
    expect(result).toBe("callback return value")
  });

  test('Using updateLanguage should use LanguageService method and return the right values', ()=>{
    //Arrange
    let langServUpdateLanguageMock = jest.spyOn(LanguageService.prototype, 'updateLanguage').mockImplementation((callback: any, language:Language) => callback(language));
    // @ts-ignore
    jest.spyOn(LanguageUseCases.prototype, "getLanguagesDetail").mockImplementation(() => mockReturnedValue); // comment this line if just want to "spy"
    let languageUseCases = new LanguageUseCases();
    // @ts-ignore
    let languages: any = languageUseCases.getLanguagesDetail().data;
    let languageByName: Language = languageUseCases.getLanguageByName(
        'istar3',
        languages
    );

    //Act
    let result: any = languageUseCases.updateLanguage(()=>"callback return value", languageByName);

    //Assert
    expect(langServUpdateLanguageMock).toHaveBeenCalledTimes(1)
    expect(result).toBe("callback return value")
  });

  test('Using deleteLanguage should use LanguageService method and return the right values', ()=>{
    //Arrange
    let langServDeleteLanguageMock = jest.spyOn(LanguageService.prototype, 'deleteLanguage').mockImplementation((callback: any, languageId: string) => callback(languageId));
    // @ts-ignore
    jest.spyOn(LanguageUseCases.prototype, "getLanguagesDetail").mockImplementation(() => mockReturnedValue); // comment this line if just want to "spy"
    let languageUseCases = new LanguageUseCases();
    let languageID = '121' // Test id
    //Act
    let result: any = languageUseCases.deleteLanguage(()=>"callback return value", languageID);

    //Assert
    expect(langServDeleteLanguageMock).toHaveBeenCalledTimes(1)
    expect(result).toBe("callback return value")
  });


  test('Using callExternalFuntion should use externalFunctionService method and return the right values', ()=>{
    //Arrange
    let callExternalFuntionMock = jest.spyOn(externalFunctionService.prototype, 'callExternalFuntion').mockImplementation((callback: any, externalFunction: ExternalFuntion) => callback(externalFunction));
    // @ts-ignore
    let languageUseCases = new LanguageUseCases();
    let externalFunction = new ExternalFuntion(1,"test_name", "test_label", "test_url",{},{},"test_resulting_action",121)

    //Act
    let result: any = languageUseCases.callExternalFuntion(()=>"callback return value", externalFunction);

    //Assert
    expect(callExternalFuntionMock).toHaveBeenCalledTimes(1)
    expect(result).toBe("callback return value")
  });

  test('Using getExternalFuntion should use externalFunctionService method and return the right values', ()=>{
    //Arrange
    let getExternalFuntionMock = jest.spyOn(externalFunctionService.prototype, 'getExternalFunctions').mockImplementation((callback: any, languageId: number) => callback(languageId));
    // @ts-ignore
    let languageUseCases = new LanguageUseCases();
    let languageId = 121;
    //Act
    let result: any = languageUseCases.getExternalFunctions(()=>"callback return value", languageId);

    //Assert
    expect(getExternalFuntionMock).toHaveBeenCalledTimes(1)
    expect(result).toBe("callback return value")
  });


})
