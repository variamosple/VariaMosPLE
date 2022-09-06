import RestrictionsUseCases from "./RestrictionsUseCases";
import LanguageUseCases from "./LanguageUseCases";
import {Language} from "../Entities/Language";
import {mockReturnedValue} from "../../../mockReturnedValue";
import {Element} from "../Entities/Element";
import {Relationship} from "../Entities/Relationship";
import {Model} from "../Entities/Model";
import RestrictionService from "../../../DataProvider/Services/restrictionService";


afterEach(() => {
  jest.clearAllMocks();
});

describe('all methods should work', ()=>{
  test('Getting restriction should return the right values', () => {
    // @ts-ignore
    jest.spyOn(LanguageUseCases.prototype, "getLanguagesDetail").mockImplementation(() => mockReturnedValue);
    let restrictionsUseCases = new RestrictionsUseCases();
    let languageUseCases = new LanguageUseCases();
    // @ts-ignore
    let languages: any = languageUseCases.getLanguagesDetail().data;
    let languageByName: Language = languageUseCases.getLanguageByName(
        'istar2',
        languages
    );

    let restrictions = restrictionsUseCases.getRestrictions(languageByName);

    expect(restrictions.quantity_element[0].min).toBe(3)
    expect(restrictions.quantity_element[0].max).toBe(2)
    expect(restrictions.quantity_element[0].element).toBe('RootFeatureForTest')

  });


  test('Applying restriction with restriction length < 1 ', async () => {

    //ARRANGE
    //Mocks
    // @ts-ignore
    jest.spyOn(LanguageUseCases.prototype, "getLanguagesDetail").mockImplementation(() => mockReturnedValue);
    const logSpy = jest.spyOn(console, 'log')
    //Variables
    let restrictionsUseCases = new RestrictionsUseCases();
    let languageUseCases = new LanguageUseCases();
    // @ts-ignore
    let languages: any = languageUseCases.getLanguagesDetail().data;
    let element: Element[]=[]
    let relationShip: Relationship[] = []
    let model = new Model('Model Id','Model Name','Type',element,relationShip, "Type Engineering")
    let languageByName: Language = languageUseCases.getLanguageByName(
        'istar3',
        languages
    );
    let restrictions = await restrictionsUseCases.getRestrictions(languageByName);

    //ACT
    restrictionsUseCases.applyRestrictions(()=>{console.log('check');}, model, restrictions )

    //ASSERT
    expect(logSpy).toHaveBeenCalledWith('check');
    expect(logSpy).toHaveBeenCalledTimes(2); // expected 2 because console.log is called once in applyRestrictions and once in the testabove

  });


  test('Applying restriction with restriction length >= 1 ', async () => {

    //ARRANGE
    //Mocks
    // @ts-ignore
    jest.spyOn(LanguageUseCases.prototype, "getLanguagesDetail").mockImplementation(() => mockReturnedValue);
    const logSpy = jest.spyOn(console, 'log')
    const applyRestrictionMock = jest.spyOn(RestrictionService.prototype, "applyRestriction");
    //Variables
    let restrictionsUseCases = new RestrictionsUseCases();
    let languageUseCases = new LanguageUseCases();
    // @ts-ignore
    let languages: any = languageUseCases.getLanguagesDetail().data;
    let element: Element[]=[]
    let relationShip: Relationship[] = []
    let model = new Model('Model Id','Model Name','Type',element,relationShip, "Type Engineering")
    let languageByName: Language = languageUseCases.getLanguageByName(
        'istar2',
        languages
    );
    let restrictions = await restrictionsUseCases.getRestrictions(languageByName);

    //
    // //ACT
    restrictionsUseCases.applyRestrictions(()=>{console.log('check');},model,restrictions)

    //ASSERT
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).toHaveBeenCalledWith()
    expect(applyRestrictionMock).toHaveBeenCalledTimes(1)
  });

})
