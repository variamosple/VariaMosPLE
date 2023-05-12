import { Project } from "../../../Domain/ProductLineEngineering/Entities/Project";
import {ProjectEventArg} from "./ProjectEventArg";
import ProjectService from "../ProjectService";

describe('The passed argument should be correct',()=>{
    let project_service = new ProjectService();
    let project = new Project('Project Id', 'Project Name')

    test('The target argument passed should be correct', ()=>{
        let projectEventArg = new ProjectEventArg(project_service, project, null);
        expect(projectEventArg.target).toBe(project_service)
    })
    test('The project argument passed should be correct',()=>{
        let projectEventArg = new ProjectEventArg(project_service, project, null);
        expect(projectEventArg.project).toBe(project)
    })
})
