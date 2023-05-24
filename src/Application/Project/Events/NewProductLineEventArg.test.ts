import { Project } from "../../../Domain/ProductLineEngineering/Entities/Project";
import {NewProductLineEventArg} from "./NewProductLineEventArg";
import ProjectService from "../ProjectService";
import {ProductLine} from "../../../Domain/ProductLineEngineering/Entities/ProductLine";
import {DomainEngineering} from "../../../Domain/ProductLineEngineering/Entities/DomainEngineering";
import {ApplicationEngineering} from "../../../Domain/ProductLineEngineering/Entities/ApplicationEngineering";

describe('The passed argument should be correct',()=>{
    let project_service = new ProjectService();
    let project = new Project('Project Id', 'Project Name')
    let domainEngineering: DomainEngineering = new DomainEngineering();
    let applicationEngineering: ApplicationEngineering = new ApplicationEngineering();
    let productLine = new ProductLine('Product Line Id', 'Product Line Name', 'System', 'Retail', domainEngineering, applicationEngineering)

    test('The target argument passed should be correct', ()=>{
        let newModelEventArg = new NewProductLineEventArg(project_service, project, productLine);
        expect(newModelEventArg.target).toBe(project_service)
    })
    test('The project argument passed should be correct',()=>{
        let newModelEventArg = new NewProductLineEventArg(project_service, project, productLine);
        expect(newModelEventArg.project).toBe(project)
    })
    test('The product line argument passed should be correct',()=>{
        let newModelEventArg = new NewProductLineEventArg(project_service, project, productLine);
        expect(newModelEventArg.productLine).toBe(productLine)
    })
})
