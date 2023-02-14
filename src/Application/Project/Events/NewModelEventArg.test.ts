//@ts-nocheck
import { Project } from "../../../Domain/ProductLineEngineering/Entities/Project";
import {NewModelEventArg} from "./NewModelEventArg";
import ProjectService from "../ProjectService";
import {Model} from "../../../Domain/ProductLineEngineering/Entities/Model";

describe('The passed argument should be correct',()=>{
    let project_service = new ProjectService();
    let project = new Project('Project id', 'Project Name')
    let model: Model[] = []

    test('The target argument passed should be correct', ()=>{
        let newModelEventArg = new NewModelEventArg(project_service, project, model);
        expect(newModelEventArg.target).toBe(project_service)
    })
    test('The project argument passed should be correct',()=>{
        let newModelEventArg = new NewModelEventArg(project_service, project, model);
        expect(newModelEventArg.project).toBe(project)
    })
    test('The model argument passed should be correct',()=>{
        let newModelEventArg = new NewModelEventArg(project_service, project, model);
        expect(newModelEventArg.model).toBe(model)
    })
})
