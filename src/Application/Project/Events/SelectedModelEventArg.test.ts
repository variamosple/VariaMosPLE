import {SelectedModelEventArg} from "./SelectedModelEventArg";
import ProjectService from "../ProjectService";
import {Model} from "../../../Domain/ProductLineEngineering/Entities/Model";
import {Element} from "../../../Domain/ProductLineEngineering/Entities/Element";
import {Relationship} from "../../../Domain/ProductLineEngineering/Entities/Relationship";

describe('The passed argument should be correct',()=>{
    let project_service = new ProjectService();
    let elements: Element[]=[]
    let relationShip: Relationship[] = []
    let model = new Model('Model Id','Model Name','Type',elements,relationShip, "Type Engineering")

    test('The target argument passed should be correct', ()=>{
        let selectedModelEventArg = new SelectedModelEventArg(project_service, model);
        expect(selectedModelEventArg.target).toBe(project_service)
    })
    test('The model argument passed should be correct',()=>{
        let selectedModelEventArg = new SelectedModelEventArg(project_service, model);
        expect(selectedModelEventArg.model).toBe(model)
    })
})
