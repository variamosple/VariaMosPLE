//@ts-nocheck
import {SelectedElementEventArg} from "./SelectedElementEventArg";
import ProjectService from "../ProjectService";
import {Model} from "../../../Domain/ProductLineEngineering/Entities/Model";
import {Element} from "../../../Domain/ProductLineEngineering/Entities/Element";
import {Relationship} from "../../../Domain/ProductLineEngineering/Entities/Relationship";

describe('The passed argument should be correct',()=>{
    let project_service = new ProjectService();
    // let property = new Property()
    // let element = new Element('Element Name', 'Element Type', )
    let elements: Element[]=[]
    let relationShip: Relationship[] = []
    let model = new Model('Model Id','Model Name','Type',elements,relationShip, "Type Engineering")

    test('The target argument passed should be correct', ()=>{
        let selectedElementEventArg = new SelectedElementEventArg(project_service, model, elements);
        expect(selectedElementEventArg.target).toBe(project_service)
    })
    test('The model argument passed should be correct',()=>{
        let selectedElementEventArg = new SelectedElementEventArg(project_service, model, elements);
        expect(selectedElementEventArg.model).toBe(model)
    })
    test('The element argument passed should be correct',()=>{
        let selectedElementEventArg = new SelectedElementEventArg(project_service, model, elements);
        expect(selectedElementEventArg.element).toBe(elements)
    })
})
