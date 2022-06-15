import { Language } from "../../../Domain/ProductLineEngineering/Entities/Language";
import {LanguagesDetailEventArg} from "./LanguagesDetailEventArg";
import ProjectService from "../ProjectService";

describe('The passed argument should be correct',()=>{
    let project_service = new ProjectService();
    let languages: Language[] = [new Language(3,'Language name','Language abstract syntax','Language concrete syntax','Language type','Language state')];

    test('The target argument passed should be correct', ()=>{
        let languagesDetailEventArg = new LanguagesDetailEventArg(project_service, languages);
        expect(languagesDetailEventArg.target).toBe(project_service)
    })
    test('The languages argument passed should be correct',()=>{
        let languagesDetailEventArg = new LanguagesDetailEventArg(project_service, languages);
        expect(languagesDetailEventArg.languages).toBe(languages)
    })
})
