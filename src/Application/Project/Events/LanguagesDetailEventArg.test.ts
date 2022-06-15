import { Language } from "../../../Domain/ProductLineEngineering/Entities/Language";
import {LanguagesDetailEventArg} from "./LanguagesDetailEventArg";
import ProjectService from "../ProjectService";
import {render} from "@testing-library/react";
import ProjectManagement from "../../../UI/ProjectManagement/ProjectManagement";

describe('The passed arguement should be correct',()=>{
    test('The target argument passed should be correct', ()=>{
        let project_service = new ProjectService();
        project_service.project.name = "Product Line Name"
        let languages: Language[] = [new Language(3,'Language name','Language abstract syntax','Language concrete syntax','Language type','Language state')];
        const languagesDetailEventArg = new LanguagesDetailEventArg(project_service, languages);

        expect(languagesDetailEventArg.target.project.name).toBe("Product Line Name")
    })
    test('The languages argument passed should be correct',()=>{
        let project_service = new ProjectService();
        project_service.project.name = "Product Line Name"
        let languages: Language[] = [new Language(3,'Language name','Language abstract syntax','Language concrete syntax','Language type','Language state')];
        const languagesDetailEventArg = new LanguagesDetailEventArg(project_service, languages);

        expect(languagesDetailEventArg.languages[0].name).toBe("Language name")
    })
})
