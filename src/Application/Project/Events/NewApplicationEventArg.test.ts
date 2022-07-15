import { Project } from "../../../Domain/ProductLineEngineering/Entities/Project";
import { Adaptation } from "../../../Domain/ProductLineEngineering/Entities/Adaptation";
import {NewApplicationEventArg} from "./NewApplicationEventArg";
import ProjectService from "../ProjectService";
import {Model} from "../../../Domain/ProductLineEngineering/Entities/Model";
import {Application} from "../../../Domain/ProductLineEngineering/Entities/Application";

describe('The passed argument should be correct',()=>{
    let project_service = new ProjectService();
    let project = new Project('Project id', 'Project Name')
    let model: Model[] = []
    let adaptation: Adaptation[] = []
    let application = new Application("Application Id","Application Name", model, adaptation)

    test('The target argument passed should be correct', ()=>{
        let newApplicationEventArg = new NewApplicationEventArg(project_service, project, application);
        expect(newApplicationEventArg.target).toBe(project_service)
    })
    test('The project argument passed should be correct',()=>{
        let newApplicationEventArg = new NewApplicationEventArg(project_service, project, application);
        expect(newApplicationEventArg.project).toBe(project)
    })
    test('The application argument passed should be correct',()=>{
        let newApplicationEventArg = new NewApplicationEventArg(project_service, project, application);
        expect(newApplicationEventArg.application).toBe(application)
    })
})
