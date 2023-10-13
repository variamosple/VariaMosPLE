import {render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import TreeExplorer from "./TreeExplorer";
import ProjectService from "../../Application/Project/ProjectService";


describe('On render, all elements of the component should appear', ()=>{
    test('The name of the project should appear on the screen', ()=>{

        //Arrange
        let project_service = new ProjectService();
        project_service.project.name = "VariaMos Project Name"
        render(<TreeExplorer projectService={project_service} />);

        //Assert
        expect(screen.getByText(/variamos project name/i)).toBeVisible();
    });

    test('The name of the product line should appear on the screen', ()=>{

        //Arrange
        let project_service = new ProjectService();
        project_service.project.name = "Product Line Name"
        // @ts-ignore
        project_service.project.productLines = ['Product line name']
        render(<TreeExplorer projectService={project_service} />);

        //Assert
        expect(screen.getByText(/product line name/i)).toBeVisible();
    });

    test('Domain engineering should appear on the screen', ()=>{

        //Arrange
        let project_service = new ProjectService();
        project_service.project.name = "Product Line Name"
        // @ts-ignore
        project_service.project.productLines = ['Product line name']
        render(<TreeExplorer projectService={project_service} />);

        //Assert
        expect(screen.getByText(/domain engineering/i)).toBeVisible();
    });

    test('Application engineering should appear on the screen', ()=>{

        //Arrange
        let project_service = new ProjectService();
        project_service.project.name = "Product Line Name"
        // @ts-ignore
        project_service.project.productLines = ['Product line name']
        render(<TreeExplorer projectService={project_service} />);

        //Assert
        expect(screen.getByText(/application engineering/i)).toBeVisible();

    });

})

describe('The collaspe feature should be functional',()=>{

    test('When you left click on "Application Engineering" the + should become -', ()=>{

        //Arrange
        let project_service = new ProjectService();
        project_service.project.name = "Product Line Name"
        // @ts-ignore
        project_service.project.productLines = ['Product line name']
        render(<TreeExplorer projectService={project_service} />);


        const clickableElement = screen.getByText(/application engineering/i);
        expect(clickableElement).toHaveAttribute("class", "fa fa-plus-square fa-minus-square-o appE");
        //Act
        clickableElement.click();
        //Assert
        expect(clickableElement).not.toHaveAttribute("class", "fa fa-plus-square fa-minus-square-o appE")

    });

    test('When you left click on "Domain Engineering" the + should become -', ()=>{

        //Arrange
        let project_service = new ProjectService();
        project_service.project.name = "Product Line Name"
        // @ts-ignore
        project_service.project.productLines = ['Product line name']
        render(<TreeExplorer projectService={project_service} />);

        const clickableElement = screen.getByText(/domain engineering/i);
        expect(clickableElement).toHaveAttribute("class", "fa fa-plus-square fa-minus-square-o domainE");
        //Act
        clickableElement.click();
        //Assert
        expect(clickableElement).not.toHaveAttribute("class", "fa fa-plus-square fa-minus-square-o domainE")
    });
})

describe('Each method should be functional',()=>{

    test('btn_viewDomainModel should use ProjectServices', ()=>{

        //Arrange
        let modelDomainSelectedMock = jest.spyOn(ProjectService.prototype, "modelDomainSelected").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});
        let project_service = new ProjectService();
        let treeExplorer = new TreeExplorer(project_service);
        // @ts-ignore
        treeExplorer.props.projectService = project_service;

        //Act
        treeExplorer.btn_viewDomainModel(window.event,345, 667);

        //Assert
        expect(modelDomainSelectedMock).toHaveBeenCalledTimes(1);
        expect(modelDomainSelectedMock).toHaveBeenCalledWith(345,667);
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });

    test('btn_viewApplicationModel should use ProjectServices', ()=>{

        //Arrange
        let modelApplicationSelectedMock = jest.spyOn(ProjectService.prototype, "modelApplicationSelected").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});
        let project_service = new ProjectService();
        let treeExplorer = new TreeExplorer(project_service);
        // @ts-ignore
        treeExplorer.props.projectService = project_service;

        //Act
        treeExplorer.btn_viewApplicationModel(window.event, 345, 667, 910);

        //Assert
        expect(modelApplicationSelectedMock).toHaveBeenCalledTimes(1);
        expect(modelApplicationSelectedMock).toHaveBeenCalledWith(345,667,910);
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('btn_viewAdaptationModel should use ProjectServices', ()=>{

        //Arrange
        let modelAdaptationSelectedMock = jest.spyOn(ProjectService.prototype, "modelAdaptationSelected").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});
        let project_service = new ProjectService();
        let treeExplorer = new TreeExplorer(project_service);
        // @ts-ignore
        treeExplorer.props.projectService = project_service;

        //Act
        treeExplorer.btn_viewAdaptationModel(window.event,345, 667, 910, 369);

        //Assert
        expect(modelAdaptationSelectedMock).toHaveBeenCalledTimes(1);
        expect(modelAdaptationSelectedMock).toHaveBeenCalledWith(345,667,910,369);
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });

    test('btn_viewApplicationEngModel should use ProjectServices', ()=>{

        //Arrange
        let modelApplicationEngSelectedMock = jest.spyOn(ProjectService.prototype, "modelApplicationEngSelected").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});
        let project_service = new ProjectService();
        let treeExplorer = new TreeExplorer(project_service);
        // @ts-ignore
        treeExplorer.props.projectService = project_service;

        //Act
        treeExplorer.btn_viewApplicationEngModel(345, 667);

        //Assert
        expect(modelApplicationEngSelectedMock).toHaveBeenCalledTimes(1);
        expect(modelApplicationEngSelectedMock).toHaveBeenCalledWith(345,667);
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('updateLpSelected should use ProjectServices', ()=>{

        //Arrange
        let updateLpSelectedMock = jest.spyOn(ProjectService.prototype, "updateLpSelected").mockImplementation(() => {});
        let updateDomainEngSelectedMock = jest.spyOn(ProjectService.prototype, "updateDomainEngSelected").mockImplementation(() => {});
        let updateAppEngSelectedMock = jest.spyOn(ProjectService.prototype, "updateAppEngSelected").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});
        let project_service = new ProjectService();
        let treeExplorer = new TreeExplorer(project_service);
        // @ts-ignore
        treeExplorer.props.projectService = project_service;

        let e = {"target": {
            "id": "test_id"
            }}
        console.log(e.target.id)
        //Act
        treeExplorer.updateLpSelected(e, 667);

        // Assert
        expect(updateLpSelectedMock).toHaveBeenCalledTimes(1);
        expect(updateLpSelectedMock).toHaveBeenCalledWith(667);
        expect(updateDomainEngSelectedMock).not.toHaveBeenCalled();
        expect(updateAppEngSelectedMock).not.toHaveBeenCalled();
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('updateLpSelected should use ProjectServices with domainEngineering', ()=>{

        //Arrange
        let updateLpSelectedMock = jest.spyOn(ProjectService.prototype, "updateLpSelected").mockImplementation(() => {});
        let updateDomainEngSelectedMock = jest.spyOn(ProjectService.prototype, "updateDomainEngSelected").mockImplementation(() => {});
        let updateAppEngSelectedMock = jest.spyOn(ProjectService.prototype, "updateAppEngSelected").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});
        let project_service = new ProjectService();
        let treeExplorer = new TreeExplorer(project_service);
        // @ts-ignore
        treeExplorer.props.projectService = project_service;

        let e = {"target": {
                "id": "domainEngineering"
            }}
        console.log(e.target.id)
        //Act
        treeExplorer.updateLpSelected(e, 667);

        // Assert
        expect(updateLpSelectedMock).toHaveBeenCalledTimes(1);
        expect(updateLpSelectedMock).toHaveBeenCalledWith(667);
        expect(updateDomainEngSelectedMock).toHaveBeenCalled();
        expect(updateDomainEngSelectedMock).toHaveBeenCalledWith();
        expect(updateAppEngSelectedMock).not.toHaveBeenCalled();
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('updateLpSelected should use ProjectServices with applicationEngineering', ()=>{

        //Arrange
        let updateLpSelectedMock = jest.spyOn(ProjectService.prototype, "updateLpSelected").mockImplementation(() => {});
        let updateDomainEngSelectedMock = jest.spyOn(ProjectService.prototype, "updateDomainEngSelected").mockImplementation(() => {});
        let updateAppEngSelectedMock = jest.spyOn(ProjectService.prototype, "updateAppEngSelected").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});
        let project_service = new ProjectService();
        let treeExplorer = new TreeExplorer(project_service);
        // @ts-ignore
        treeExplorer.props.projectService = project_service;

        let e = {"target": {
                "id": "applicationEngineering"
            }}
        console.log(e.target.id)
        //Act
        treeExplorer.updateLpSelected(e, 667);

        // Assert
        expect(updateLpSelectedMock).toHaveBeenCalledTimes(1);
        expect(updateLpSelectedMock).toHaveBeenCalledWith(667);
        expect(updateDomainEngSelectedMock).not.toHaveBeenCalled();
        expect(updateAppEngSelectedMock).toHaveBeenCalled();
        expect(updateAppEngSelectedMock).toHaveBeenCalledWith();
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('updateApplicationSelected should use ProjectServices', ()=>{

        //Arrange
        let updateApplicationSelectedMock = jest.spyOn(ProjectService.prototype, "updateApplicationSelected").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});
        let project_service = new ProjectService();
        let treeExplorer = new TreeExplorer(project_service);
        // @ts-ignore
        treeExplorer.props.projectService = project_service;

        //Act
        treeExplorer.updateApplicationSelected(window.event,345, 667);

        // Assert
        expect(updateApplicationSelectedMock).toHaveBeenCalledTimes(1);
        expect(updateApplicationSelectedMock).toHaveBeenCalledWith(345,667);
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('updateAdaptationSelected should use ProjectServices', ()=>{

        //Arrange
        let updateAdaptationSelectedMock = jest.spyOn(ProjectService.prototype, "updateAdaptationSelected").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});
        let project_service = new ProjectService();
        let treeExplorer = new TreeExplorer(project_service);
        // @ts-ignore
        treeExplorer.props.projectService = project_service;

        //Act
        treeExplorer.updateAdaptationSelected(window.event,345, 667, 910);

        // Assert
        expect(updateAdaptationSelectedMock).toHaveBeenCalledTimes(1);
        expect(updateAdaptationSelectedMock).toHaveBeenCalledWith(345,667,910);
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('projectService_addListener should use ProjectServices', ()=>{

        //Arrange
        let forceUpdateMock = jest.spyOn(TreeExplorer.prototype, "forceUpdate").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});
        let project_service = new ProjectService();
        let treeExplorer = new TreeExplorer(project_service);
        // @ts-ignore
        treeExplorer.props.projectService = project_service;

        //Act
        treeExplorer.projectService_addListener(345);

        // Assert
        expect(forceUpdateMock).toHaveBeenCalledTimes(1);
        expect(forceUpdateMock).toHaveBeenCalledWith();
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('btnSave_onClick should use ProjectServices', ()=>{

        //Arrange
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});
        let project_service = new ProjectService();
        let treeExplorer = new TreeExplorer(project_service);
        // @ts-ignore
        treeExplorer.props.projectService = project_service;

        //Act
        treeExplorer.btnSave_onClick(345);

        // Assert
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('componentDidMount should use ProjectServices', ()=>{

        //Arrange
        let addNewProductLineListenerMock = jest.spyOn(ProjectService.prototype, "addNewProductLineListener").mockImplementation(() => {});
        let addNewApplicationListenerMock = jest.spyOn(ProjectService.prototype, "addNewApplicationListener").mockImplementation(() => {});
        let addNewApplicationModelListenerMock = jest.spyOn(ProjectService.prototype, "addNewApplicationModelListener").mockImplementation(() => {});
        let addNewAdaptationListenerMock = jest.spyOn(ProjectService.prototype, "addNewAdaptationListener").mockImplementation(() => {});
        let addNewAdaptationModelListenerMock = jest.spyOn(ProjectService.prototype, "addNewAdaptationModelListener").mockImplementation(() => {});
        let addNewDomainEngineeringModelListenerMock = jest.spyOn(ProjectService.prototype, "addNewDomainEngineeringModelListener").mockImplementation(() => {});
        let addNewApplicationEngineeringModelListenerMock = jest.spyOn(ProjectService.prototype, "addNewApplicationEngineeringModelListener").mockImplementation(() => {});
        let addUpdateProjectListenerMock = jest.spyOn(ProjectService.prototype, "addUpdateProjectListener").mockImplementation(() => {});
        let project_service = new ProjectService();
        let treeExplorer = new TreeExplorer(project_service);
        // @ts-ignore
        treeExplorer.props.projectService = project_service;

        //Act
        treeExplorer.componentDidMount();

        // Assert
        expect(addNewProductLineListenerMock).toHaveBeenCalledTimes(1);
        expect(addNewProductLineListenerMock).toHaveBeenCalledWith(treeExplorer.projectService_addListener);
        expect(addNewApplicationListenerMock).toHaveBeenCalledTimes(1);
        expect(addNewApplicationListenerMock).toHaveBeenCalledWith(treeExplorer.projectService_addListener);
        expect(addNewApplicationModelListenerMock).toHaveBeenCalledTimes(1);
        expect(addNewApplicationModelListenerMock).toHaveBeenCalledWith(treeExplorer.projectService_addListener);
        expect(addNewAdaptationListenerMock).toHaveBeenCalledTimes(1);
        expect(addNewAdaptationListenerMock).toHaveBeenCalledWith(treeExplorer.projectService_addListener);
        expect(addNewAdaptationModelListenerMock).toHaveBeenCalledTimes(1);
        expect(addNewAdaptationModelListenerMock).toHaveBeenCalledWith(treeExplorer.projectService_addListener);
        expect(addNewDomainEngineeringModelListenerMock).toHaveBeenCalledTimes(1);
        expect(addNewDomainEngineeringModelListenerMock).toHaveBeenCalledWith(treeExplorer.projectService_addListener);
        expect(addNewApplicationEngineeringModelListenerMock).toHaveBeenCalledTimes(1);
        expect(addNewApplicationEngineeringModelListenerMock).toHaveBeenCalledWith(treeExplorer.projectService_addListener);
        expect(addUpdateProjectListenerMock).toHaveBeenCalledTimes(1);
        expect(addUpdateProjectListenerMock).toHaveBeenCalledWith(treeExplorer.projectService_addListener);


    });


});
