//@ts-nocheck
import {UpdatedElementEventArg} from "./UpdatedElementEventArg";
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
        let updatedElementEventArg = new UpdatedElementEventArg(project_service, model, elements);
        expect(updatedElementEventArg.target).toBe(project_service)
    })
    test('The model argument passed should be correct',()=>{
        let updatedElementEventArg = new UpdatedElementEventArg(project_service, model, elements);
        expect(updatedElementEventArg.model).toBe(model)
    })
    test('The element argument passed should be correct',()=>{
        let updatedElementEventArg = new UpdatedElementEventArg(project_service, model, elements);
        expect(updatedElementEventArg.element).toBe(elements)
    })
})
