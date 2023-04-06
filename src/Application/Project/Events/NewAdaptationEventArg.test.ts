//@ts-nocheck
import { Project } from "../../../Domain/ProductLineEngineering/Entities/Project";
import { Adaptation } from "../../../Domain/ProductLineEngineering/Entities/Adaptation";
import {NewAdaptationEventArg} from "./NewAdaptationEventArg";
import ProjectService from "../ProjectService";
import {Model} from "../../../Domain/ProductLineEngineering/Entities/Model";
import {Element} from "../../../Domain/ProductLineEngineering/Entities/Element";
import {Relationship} from "../../../Domain/ProductLineEngineering/Entities/Relationship";

describe('The passed argument should be correct',()=>{
    let project_service = new ProjectService();
    let project = new Project('Project Id', 'Project Name')
    let element: Element[]=[]
    let relationShip: Relationship[] = []
    let model = new Model('Model Id','Model Name','Type',element,relationShip, "Type Engineering")
    let adaptation = new Adaptation("Adaptation Id","Adaptation Name", model)

    test('The target argument passed should be correct', ()=>{
        let newAdaptationEventArg = new NewAdaptationEventArg(project_service, project, adaptation);
        expect(newAdaptationEventArg.target).toBe(project_service)
    })
    test('The project argument passed should be correct',()=>{
        let newAdaptationEventArg = new NewAdaptationEventArg(project_service, project, adaptation);
        expect(newAdaptationEventArg.project).toBe(project)
    })
    test('The adaptation argument passed should be correct',()=>{
        let newAdaptationEventArg = new NewAdaptationEventArg(project_service, project, adaptation);
        expect(newAdaptationEventArg.adaptation).toBe(adaptation)
    })
})
