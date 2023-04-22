//@ts-nocheck
import { Point } from "../Entities/Point";
import { Property } from "../Entities/Property";
import '@testing-library/jest-dom/extend-expect';
import React from "react";
import ProjectUseCases from "./ProjectUseCases";


beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.123456789);
    jest.useFakeTimers('modern');
    jest.setSystemTime(1655108206699);
});

afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore();
    jest.useRealTimers();
    jest.resetAllMocks()
})
describe('Testing ProjectUseCases', ()=>{
    describe('Testing generateId', function () {
        test('The generated ID has the right number of digits', () => {
            let basic_id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
            let generated_id = ProjectUseCases.generateId();
            expect(generated_id.length).toBe(basic_id.length);
        });

        test('The default ID has been changed', () => {
            let basic_id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
            let generated_id = ProjectUseCases.generateId();
            expect(generated_id).not.toBe(basic_id);
        });

        test('The digit 4 has not been changed', () => {
            let generated_id = ProjectUseCases.generateId();
            expect(generated_id[14]).toBe("4");
        });

        test('The dashes have not been changed', () => {
            let generated_id = ProjectUseCases.generateId();
            expect(generated_id[13]).toBe("-");
        });

        test('The randomizer should return the right result with mocked date "1655108206699"', () => {
            let mocked_generated_id = "c71143d6-2921-4111-9111-111111111111";
            let generated_id = ProjectUseCases.generateId();
            expect(generated_id).toBe(mocked_generated_id);
        });
    });
    test('creatProject should return project',()=>{
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');

        expect(project.name).toBe('test_project_name');
        expect(project.id).toBe('c71143d6-2921-4111-9111-111111111111');
    })
    // test('renameItemProject should return project with modifications',()=>{
    //
    // })
    test('createLps should return a productLine',()=>{
        //Arrange
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');

        //Act
        let productLine = projectUseCases.createLps(project,'test_productLine_name');

        //ASsert
        expect(productLine.name).toBe('test_productLine_name');
        expect(productLine.id).toBe('c71143d6-2921-4111-9111-111111111111');
        expect(project.productLines).toMatchObject([productLine]);
    })
    test('createApplication should return an application',()=>{
        //Arrange
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');

        //Act
        let application = projectUseCases.createApplication(project,'test_application_name', 0);

        //Assert
        expect(application.name).toBe('test_application_name');
        expect(application.id).toBe('c71143d6-2921-4111-9111-111111111111');
        expect(project.productLines[0].applicationEngineering.applications).toMatchObject([application]);
    })
    test('createAdaptation should return an adaptation',()=>{
        //Arrange
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        projectUseCases.createApplication(project,'test_application_name', 0);

        //Act
        let adaptation = projectUseCases.createAdaptation(project,'test_adaptation_name', 0,0);

        //Assert
        expect(adaptation.name).toBe('test_adaptation_name');
        expect(adaptation.id).toBe('c71143d6-2921-4111-9111-111111111111');
        expect(project.productLines[0].applicationEngineering.applications[0].adaptations).toMatchObject([adaptation]);
    })
    test('createDomainEngineeringModel should return a domainEngineeringModel',()=>{
        //Arrange
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');

        //Act
        let domainEngineeringModel = projectUseCases.createDomainEngineeringModel(project,'test_language_type', 0);

        //Assert
        expect(domainEngineeringModel.name).toBe('test_language_type');
        expect(domainEngineeringModel.id).toBe('c71143d6-2921-4111-9111-111111111111');
        expect(project.productLines[0].domainEngineering.models).toMatchObject([domainEngineeringModel]);
    })
    test('createApplicationEngineeringModel should return an applicationEngineeringModel',()=>{
        //Arrange
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');

        //Act
        let applicationEngineeringModel = projectUseCases.createApplicationEngineeringModel(project,'test_language_type', 0);

        //Assert
        expect(applicationEngineeringModel.name).toBe('test_language_type');
        expect(applicationEngineeringModel.id).toBe('c71143d6-2921-4111-9111-111111111111');
        expect(project.productLines[0].applicationEngineering.models).toMatchObject([applicationEngineeringModel]);
    })
    test('createApplicationModel should return an applicationModel',()=>{
        //Arrange
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        projectUseCases.createApplication(project,'test_application_name', 0);
        //Act
        let applicationModel = projectUseCases.createApplicationModel(project,'test_language_type', 0, 0);

        //Assert
        expect(applicationModel.name).toBe('test_language_type');
        expect(applicationModel.id).toBe('c71143d6-2921-4111-9111-111111111111');
        expect(project.productLines[0].applicationEngineering.applications[0].models).toMatchObject([applicationModel]);
    })
    test('createAdaptationModel should return an adaptationModel',()=>{
        //Arrange
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        projectUseCases.createApplication(project,'test_application_name', 0);
        projectUseCases.createAdaptation(project,'test_adaptation_name', 0,0);
        //Act
        let adaptationModel = projectUseCases.createAdaptationModel(project,'test_language_type', 0, 0, 0);

        //Assert
        expect(adaptationModel.name).toBe('test_language_type');
        expect(adaptationModel.id).toBe('c71143d6-2921-4111-9111-111111111111');
        expect(project.productLines[0].applicationEngineering.applications[0].adaptations[0].models).toMatchObject([adaptationModel]);
    })
    test('createRelationship should return a relationship',()=>{
        //Arrange
        //Arrange
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        let domainEngineeringModel = projectUseCases.createDomainEngineeringModel(project,'test_language_type', 0);
        let points: Point[] = [];
        let properties: Property[] = [];
        //Act
        let relationship = projectUseCases.createRelationship(domainEngineeringModel,'test_relationship_name','test_type','test_source_id','test_target_id',points, 0,10,properties);

        //Assert
        expect(relationship.name).toBe('test_relationship_name');
        expect(relationship.id).toBe('c71143d6-2921-4111-9111-111111111111');
        expect(relationship.type).toBe('test_type');
        expect(relationship.sourceId).toBe('test_source_id');
        expect(relationship.targetId).toBe('test_target_id');
        expect(relationship.points).toBe(points);
        expect(relationship.min).toBe(0);
        expect(relationship.max).toBe(10);
        expect(relationship.properties).toBe(properties);

        expect(domainEngineeringModel.relationships).toMatchObject([relationship]);
    })
    test('updateProperty should have been called', ()=>{

        //Arrange
        let deleteTreeItemSelectedMock = jest.spyOn(ProjectUseCases.prototype, "deleteTreeItemSelected");
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');

        //Act
        projectUseCases.deleteTreeItemSelected(project,'test_language', 0,0,0,0);

        //Assert
        expect(deleteTreeItemSelectedMock).toHaveBeenCalledTimes(1);
        expect(deleteTreeItemSelectedMock).toHaveBeenCalledWith(project,'test_language',0,0,0,0);
    })
    // test('saveProject should call setItem', ()=>{
    //
    //     //Arrange
    //     let setItemMock = jest.spyOn(sessionStorage, "setItem");
    //     let projectUseCases = new ProjectUseCases();
    //     let project = projectUseCases.createProject('test_project_name');
    //
    //     //Act
    //     projectUseCases.saveProject(project);
    //
    //     //Assert
    //     expect(setItemMock).toHaveBeenCalledTimes(1);
    //     expect(setItemMock).toHaveBeenCalledWith("Project",JSON.stringify(project));
    // })

    // test('deleteProject should have been called', ()=>{
    //
    //     //Arrange
    //     let removeItemMock = jest.spyOn(sessionStorage, "removeItem");
    //     let clearMock = jest.spyOn(sessionStorage, "clear");
    //     let projectUseCases = new ProjectUseCases();
    //
    //     //Act
    //     projectUseCases.deleteProject();
    //
    //     //Assert
    //     expect(clearMock).toHaveBeenCalledTimes(1);
    //     expect(removeItemMock).toHaveBeenCalledTimes(1);
    //     expect(removeItemMock).toHaveBeenCalledWith("Project");
    // })

    test('findModelElementById should return null', ()=>{
        //Arrange
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        let domainEngineeringModel = projectUseCases.createDomainEngineeringModel(project,'test_language_type', 0);

        let result = ProjectUseCases.findModelElementById(domainEngineeringModel, 'test_id')

        expect(result).toBe(null)
    })
    test('findModelElementById should return an element', ()=>{
        //Arrange
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        let domainEngineeringModel = projectUseCases.createDomainEngineeringModel(project,'test_language_type', 0);
        domainEngineeringModel.elements = [{id: 1},{id: 2},{id: 3}]

        // console.log(domainEngineeringModel.elements[0])

        let result = ProjectUseCases.findModelElementById(domainEngineeringModel, 1)

        expect(result).toEqual({id: 1})
    })
    test('findModelRelationshipById should return null', ()=>{
        //Arrange
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        let domainEngineeringModel = projectUseCases.createDomainEngineeringModel(project,'test_language_type', 0);

        let result = ProjectUseCases.findModelRelationshipById(domainEngineeringModel, 'test_id')

        expect(result).toBe(null)
    })
    test('findModelRelationshipById should return an relationship', ()=>{
        //Arrange
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        let domainEngineeringModel = projectUseCases.createDomainEngineeringModel(project,'test_language_type', 0);
        domainEngineeringModel.relationships = [{id: 1},{id: 2},{id: 3}]

        // console.log(domainEngineeringModel.elements[0])

        let result = ProjectUseCases.findModelRelationshipById(domainEngineeringModel, 1)

        expect(result).toEqual({id: 1})
    })
    test('findModelElementByIdInProject should return null',()=>{
        //Arrange
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        projectUseCases.createApplication(project,'test_application_name', 0);
        projectUseCases.createAdaptation(project,'test_adaptation_name', 0,0);
        projectUseCases.createAdaptationModel(project,'test_language_type', 0, 0, 0);

        //Act
        let result = ProjectUseCases.findModelElementByIdInProject(project,'test_id');

        //Assert
        expect(result).toBe(null);

    })
    test('findModelElementByIdInProject should return true with adaptation model',()=>{
        //Arrange
        let findModelElementByIdMock = jest.spyOn(ProjectUseCases, 'findModelElementById')
            .mockImplementation(()=>true)
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        projectUseCases.createApplication(project,'test_application_name', 0);
        projectUseCases.createAdaptation(project,'test_adaptation_name', 0,0);
        projectUseCases.createAdaptationModel(project,'test_language_type',0,0,0);

        //Act
        let result = ProjectUseCases.findModelElementByIdInProject(project,'test_id');
        //Assert
        expect(result).toBe(true);
        expect(findModelElementByIdMock).toHaveBeenCalledTimes(1)

    })
    test('findModelElementByIdInProject should return true with application model',()=>{
        //Arrange
        let findModelElementByIdMock = jest.spyOn(ProjectUseCases, 'findModelElementById')
            .mockImplementation(()=>true)
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        projectUseCases.createApplication(project,'test_application_name', 0);
        projectUseCases.createApplicationModel(project,'test_language_type', 0, 0);


        //Act
        let result = ProjectUseCases.findModelElementByIdInProject(project,'test_id');
        //Assert
        expect(result).toBe(true);
        expect(findModelElementByIdMock).toHaveBeenCalledTimes(1)

    })
    test('findModelElementByIdInProject should return true with domain engineering model',()=>{
        //Arrange
        let findModelElementByIdMock = jest.spyOn(ProjectUseCases, 'findModelElementById')
            .mockImplementation(()=>true)
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        projectUseCases.createDomainEngineeringModel(project,'test_language_type', 0);

        //Act
        let result = ProjectUseCases.findModelElementByIdInProject(project,'test_id');
        //Assert
        expect(result).toBe(true);
        expect(findModelElementByIdMock).toHaveBeenCalledTimes(1)

    })
    test('removeModelRelationshipsOfElement should splice relationships',()=>{
        //Arrange

        let arrayMock = jest.spyOn(Array.prototype, 'splice');
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        let model = projectUseCases.createDomainEngineeringModel(project,'test_language_type', 0);
        let points: Point[] = [];
        let properties: Property[] = [];
        //Act
        projectUseCases.createRelationship(model,'test_relationship_name','test_type','test_id','test_id',points, 0,10,properties);

        //Act
        ProjectUseCases.removeModelRelationshipsOfElement(model,'test_id');
        //Assert
        expect(arrayMock).toHaveBeenCalledWith(0,1);
    })
    test('removeModelRelationshipById should return undefined',()=>{
        //Arrange

        let arrayMock = jest.spyOn(Array.prototype, 'splice');
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        let model = projectUseCases.createDomainEngineeringModel(project,'test_language_type', 0);
        let points: Point[] = [];
        let properties: Property[] = [];
        //Act
        projectUseCases.createRelationship(model,'test_relationship_name','test_type','test_id','test_id',points, 0,10,properties);
        projectUseCases.createRelationship(model,'test_relationship_name_2','test_type','test_id','test_id',points, 0,10,properties);

        //Act
        let result = ProjectUseCases.removeModelRelationshipById(model,3);
        //Assert
        expect(result).toBe(undefined);
        expect(arrayMock).not.toHaveBeenCalled();
    })
    test('removeModelRelationshipById should splice',()=>{
        //Arrange

        let arrayMock = jest.spyOn(Array.prototype, 'splice');
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        let model = projectUseCases.createDomainEngineeringModel(project,'test_language_type', 0);
        let points: Point[] = [];
        let properties: Property[] = [];
        //Act
        projectUseCases.createRelationship(model,'test_relationship_name','test_type','test_id','test_id',points, 0,10,properties);
        projectUseCases.createRelationship(model,'test_relationship_name_2','test_type','test_id','test_id',points, 0,10,properties);

        //Act
        ProjectUseCases.removeModelRelationshipById(model,'c71143d6-2921-4111-9111-111111111111');
        //Assert
        expect(arrayMock).toHaveBeenCalled();
        expect(arrayMock).toHaveBeenCalledWith(0,1);
    })
    test('removeModelElementById should splice',()=>{
        //Arrange
        let arrayMock = jest.spyOn(Array.prototype, 'splice');
        let removeMock = jest.spyOn(ProjectUseCases, 'removeModelRelationshipsOfElement');
        let projectUseCases = new ProjectUseCases();
        let project = projectUseCases.createProject('test_project_name');
        projectUseCases.createLps(project,'test_productLine_name');
        let model = projectUseCases.createDomainEngineeringModel(project,'test_language_type', 0);
        model.elements = [{id: 1},{id: 2},{id: 3}]
        let points: Point[] = [];
        let properties: Property[] = [];
        //Act
        projectUseCases.createRelationship(model,'test_relationship_name','test_type','test_id','test_id',points, 0,10,properties);
        projectUseCases.createRelationship(model,'test_relationship_name_2','test_type','test_id','test_id',points, 0,10,properties);
        //Act
        ProjectUseCases.removeModelElementById(model,1);
        //Assert
        expect(arrayMock).toHaveBeenCalledTimes(1);
        expect(arrayMock).toHaveBeenCalledWith(0,1);
        expect(removeMock).toHaveBeenCalledTimes(1);
        expect(removeMock).toHaveBeenCalledWith(model,1);
    })
})


