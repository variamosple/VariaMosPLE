//@ts-nocheck
import {render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import TreeMenu from "./TreeMenu";
import ProjectService from "../../Application/Project/ProjectService";
import * as alertify from "alertifyjs";
import {ExternalFuntion} from "../../Domain/ProductLineEngineering/Entities/ExternalFuntion";



describe('Testing the Tree menu', ()=>{
    beforeEach(()=>{
        jest.clearAllMocks();
    })
    afterEach(()=>{
        jest.clearAllMocks();
    })
    test('On render, the tree menu is hidden', async ()=> {
        let project_service = new ProjectService();
        render(<TreeMenu projectService={project_service}/>);
        expect(screen.getByText("New model")).toHaveAttribute("class", "hidden dropdown-item")
    });
    test('the method addNewProductLine should use ProjectService', ()=>{

        //Arrange
        let createLPSMock = jest.spyOn(ProjectService.prototype, "createLPS").mockImplementation(() => {});
        let raiseEventNewProductLineMock = jest.spyOn(ProjectService.prototype, "raiseEventNewProductLine").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});

        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.addNewProductLine('test_product_line_name');

        // Assert
        expect(createLPSMock).toHaveBeenCalledTimes(1);
        expect(createLPSMock).toHaveBeenCalledWith(project_service.project, 'test_product_line_name');
        expect(raiseEventNewProductLineMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('the method addNewApplication should use ProjectService', ()=>{

        //Arrange
        let createApplicationMock = jest.spyOn(ProjectService.prototype, "createApplication").mockImplementation(() => {});
        let raiseEventApplicationMock = jest.spyOn(ProjectService.prototype, "raiseEventApplication").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});

        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.addNewApplication('test_application_name');

        // Assert
        expect(createApplicationMock).toHaveBeenCalledTimes(1);
        expect(createApplicationMock).toHaveBeenCalledWith(project_service.project, 'test_application_name');
        expect(raiseEventApplicationMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('the method addNewAdaptation should use ProjectService', ()=>{

        //Arrange
        let createAdaptationMock = jest.spyOn(ProjectService.prototype, "createAdaptation").mockImplementation(() => {});
        let raiseEventAdaptationMock = jest.spyOn(ProjectService.prototype, "raiseEventAdaptation").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});

        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.addNewAdaptation('test_adaptation_name');

        // Assert
        expect(createAdaptationMock).toHaveBeenCalledTimes(1);
        expect(createAdaptationMock).toHaveBeenCalledWith(project_service.project, 'test_adaptation_name');
        expect(raiseEventAdaptationMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('the method updateModal should be functional with correct arguments', ()=>{

        //Arrange
        let project_service = new ProjectService();
        render(<TreeMenu projectService={project_service}/>);
        let treeMenu = new TreeMenu(project_service);
        let state = {
            modalTittle: 'New product line',
            modalInputText: 'Enter new product line name',
            newSelected: 'PRODUCTLINE',
        }
        // @ts-ignore
        treeMenu.props.projectService = project_service;
        treeMenu.state = state
        //Act
        treeMenu.updateModal("APPLICATION");

        //Assert
        expect(treeMenu.state.modalTittle).toBe('New application');
        expect(treeMenu.state.modalInputText).toBe('Enter new application name');

        //Act
        treeMenu.updateModal("ADAPTATION");

        //Assert
        expect(treeMenu.state.modalTittle).toBe('New Adaptation');
        expect(treeMenu.state.modalInputText).toBe('Enter new adaptation name');

        //Act
        treeMenu.updateModal("renameItem");

        //Assert
        expect(treeMenu.state.modalTittle).toBe('Rename');
        expect(treeMenu.state.modalInputText).toBe('Enter new name');

        //Act
        treeMenu.updateModal("default");

        //Assert
        expect(treeMenu.state.modalTittle).toBe('New ');
        expect(treeMenu.state.modalInputText).toBe('Enter name');

    });
    test('the method updateModal should correctly use the method setState', ()=>{
        //Arrange
        let getElementByIdMock = jest.spyOn(document, 'getElementById')
        let setStateMock = jest.spyOn(TreeMenu.prototype, "setState");
        let state = {
            modalTittle: 'New product line',
            modalInputText: 'Enter new product line name',
            newSelected: 'PRODUCTLINE',
        }
        let project_service = new ProjectService();

        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;
        treeMenu.state = state;
        render(<TreeMenu projectService={project_service}/>);

        //Act
        treeMenu.updateModal("PRODUCTLINE");

        expect(getElementByIdMock).toHaveBeenCalledTimes(1);
        expect(getElementByIdMock).toHaveBeenCalledWith('modalInputValue');

        expect(treeMenu.state.modalTittle).toBe('New product line');
        expect(treeMenu.state.modalInputText).toBe('Enter new product line name');
        expect(treeMenu.state.newSelected).toBe('PRODUCTLINE');

        expect(setStateMock).toHaveBeenCalledTimes(1);
        expect(setStateMock).toHaveBeenCalledWith(state);
    });
    test('the method renameItemProject should use ProjectService', ()=>{

        //Arrange
        let renameItemProjectMock = jest.spyOn(ProjectService.prototype, "renameItemProject").mockImplementation(() => {});
        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.renameItemProject('test_newName');

        // Assert
        expect(renameItemProjectMock).toHaveBeenCalledTimes(1);
        expect(renameItemProjectMock).toHaveBeenCalledWith('test_newName');
    });
    test('the method callExternalFuntion should use ProjectService', ()=>{

        //Arrange
        let callExternalFuntionMock = jest.spyOn(ProjectService.prototype, "callExternalFuntion").mockImplementation(() => {});
        let externalFuntion = new ExternalFuntion(345, 'test_name','test_label','test_url',{},{}, 'test_resulting_action', 667);
        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.callExternalFuntion(externalFuntion);

        // Assert
        expect(callExternalFuntionMock).toHaveBeenCalledTimes(1);
        expect(callExternalFuntionMock).toHaveBeenCalledWith(externalFuntion, null);
    });
    test('the method addNewFolder should use alertify and return false', ()=>{

        //Arrange
        let getElementByIdMock = jest.spyOn(document, 'getElementById');
        let alertifyMock = jest.spyOn(alertify, "error");
        let state = {
            modalInputValue: ''
        }
        let e:any = null;
        let project_service = new ProjectService();
        render(<TreeMenu projectService={project_service}/>);
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;
        treeMenu.state = state

        //Act
        let result = treeMenu.addNewFolder(e);

        expect(getElementByIdMock).toHaveBeenCalledTimes(1);
        expect(getElementByIdMock).toHaveBeenCalledWith('modalInputValue');

        expect(alertifyMock).toHaveBeenCalledTimes(1);
        expect(alertifyMock).toHaveBeenCalledWith('The name is required');

        expect(result).toBe(false)
    });
    test('the method addNewFolder should use setState and getElementById', ()=>{

        //Arrange
        let getElementByIdMock = jest.spyOn(document, 'getElementById');
        let setStateMock = jest.spyOn(TreeMenu.prototype, 'setState');
        let state = {
            modalInputValue: 'test_input_value',
            newSelected: 'PRODUCTLINE'
        }
        let e:any = null;
        let project_service = new ProjectService();
        render(<TreeMenu projectService={project_service}/>);
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.state = state
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.addNewFolder(e);

        expect(getElementByIdMock).toHaveBeenCalledTimes(1);
        expect(getElementByIdMock).toHaveBeenCalledWith('closeModal');

        state = {
            modalInputValue: "",
        }
        expect(setStateMock).toHaveBeenCalledTimes(1);
        expect(setStateMock).toHaveBeenCalledWith(state);
    });
    test('the method addNewFolder should be functional with correct arguments', ()=>{

        //Arrange
        let addNewProductLineMock = jest.spyOn(TreeMenu.prototype, 'addNewProductLine');
        let addNewApplicationMock = jest.spyOn(TreeMenu.prototype, 'addNewApplication');
        let addNewAdaptationMock = jest.spyOn(TreeMenu.prototype, 'addNewAdaptation');
        let renameItemProjectMock = jest.spyOn(TreeMenu.prototype, 'renameItemProject');
        let state = {
            modalInputValue: 'test_input_value',
            newSelected: 'PRODUCTLINE'
        }
        let e:any = null;
        let project_service = new ProjectService();
        render(<TreeMenu projectService={project_service}/>);
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.state = state
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.addNewFolder(e);
        //Assert
        expect(addNewProductLineMock).toHaveBeenCalledTimes(1);
        expect(addNewProductLineMock).toHaveBeenCalledWith('test_input_value');

        //Act
        treeMenu.state.newSelected = 'APPLICATION'
        treeMenu.addNewFolder(e);
        //Assert
        expect(addNewApplicationMock).toHaveBeenCalledTimes(1);
        expect(addNewApplicationMock).toHaveBeenCalledWith('test_input_value');

        //Act
        treeMenu.state.newSelected = 'ADAPTATION'
        treeMenu.addNewFolder(e);
        //Assert
        expect(addNewAdaptationMock).toHaveBeenCalledTimes(1);
        expect(addNewAdaptationMock).toHaveBeenCalledWith('test_input_value');

        //Act
        treeMenu.state.newSelected = 'renameItem'
        treeMenu.addNewFolder(e);
        //Assert
        expect(renameItemProjectMock).toHaveBeenCalledTimes(1);
        expect(renameItemProjectMock).toHaveBeenCalledWith('test_input_value');

    });
    test('the method onEnterModal should use the method addNewFolder', ()=>{

        //Arrange
        let addNewFolderMock = jest.spyOn(TreeMenu.prototype, "addNewFolder");
        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        let event = {key: "Enter"}
        console.log(event)
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.onEnterModal(event);

        // Assert
        expect(addNewFolderMock).toHaveBeenCalledTimes(1);
        expect(addNewFolderMock).toHaveBeenCalledWith(event);
        jest.clearAllMocks();
    });
    test('the method onEnterModal should not use the method addNewFolder', ()=>{

        //Arrange
        let addNewFolderMock = jest.spyOn(TreeMenu.prototype, "addNewFolder");
        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        let event = {"key": "Not Enter"}
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.onEnterModal(event);

        // Assert
        expect(addNewFolderMock).not.toHaveBeenCalled();
        jest.clearAllMocks();
    });
    test('the method deleteItemProject should use ProjectService', ()=>{

        //Arrange
        let deleteItemProjectMock = jest.spyOn(ProjectService.prototype, "deleteItemProject").mockImplementation(() => {});
        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.deleteItemProject();

        // Assert
        expect(deleteItemProjectMock).toHaveBeenCalledTimes(1);
        expect(deleteItemProjectMock).toHaveBeenCalledWith();
    });
    test('the method removeHidden should use the method setState', ()=>{

        //Arrange
        let setStateMock = jest.spyOn(TreeMenu.prototype, "setState");
        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;
        let state = {
            optionAllowModelEnable: false,
            optionAllowModelDomain: false,
            optionAllowModelApplication: false,
            optionAllowModelAdaptation: false,
            optionAllowProductLine: false,
            optionAllowApplication: false,
            optionAllowAdaptation: false,
            optionAllowRename: false,
            optionAllowDelete: false,
            optionAllowEFunctions: false,
        }

        //Act
        treeMenu.removeHidden();

        // Assert
        expect(setStateMock).toHaveBeenCalledTimes(1);
        expect(setStateMock).toHaveBeenCalledWith(state);

    });
    test('the method componentDidMount should use ProjectService', ()=>{

        //Arrange
        let addLanguagesDetailListenerMock = jest.spyOn(ProjectService.prototype, "addLanguagesDetailListener").mockImplementation(() => {});
        let addUpdateSelectedListenerMock = jest.spyOn(ProjectService.prototype, "addUpdateSelectedListener").mockImplementation(() => {});
        let addUpdateProjectListenerMock = jest.spyOn(ProjectService.prototype, "addUpdateProjectListener").mockImplementation(() => {});

        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.componentDidMount();

        // Assert
        expect(addLanguagesDetailListenerMock).toHaveBeenCalledTimes(1);
        expect(addLanguagesDetailListenerMock).toHaveBeenCalledWith(treeMenu.projectService_addListener);
        expect(addUpdateSelectedListenerMock).toHaveBeenCalledTimes(1);
        expect(addUpdateSelectedListenerMock).toHaveBeenCalledWith(treeMenu.viewMenuTree_addListener);
        expect(addUpdateProjectListenerMock).toHaveBeenCalledTimes(1);
        expect(addUpdateProjectListenerMock).toHaveBeenCalledWith(treeMenu.projectService_addListener);

    });
    test('the method handleUpdateEditorText should use the method setState', ()=>{

        //Arrange
        let setStateMock = jest.spyOn(TreeMenu.prototype, "setState");
        let event = {target: {value: "test_value"}}
        let state = {modalInputValue: event.target.value}
        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.handleUpdateEditorText(event);

        // Assert
        expect(event.target.value).toBe('test_value');
        expect(setStateMock).toHaveBeenCalledTimes(1);
        expect(setStateMock).toHaveBeenCalledWith(state);

    });
    test('the method handleUpdateNewSelected should use the method updateModal', ()=>{

        //Arrange
        let updateModalMock = jest.spyOn(TreeMenu.prototype, "updateModal").mockImplementation(() => {});
        let event = {target: {id: "test_id"}}
        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.handleUpdateNewSelected(event);

        // Assert
        expect(event.target.id).toBe('test_id');
        expect(updateModalMock).toHaveBeenCalledTimes(1);
        expect(updateModalMock).toHaveBeenCalledWith(event.target.id);

    });
    test('the method projectService_addListener should use ProjectService', ()=>{

        //Arrange
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});
        let forceUpdateMock = jest.spyOn(TreeMenu.prototype, "forceUpdate").mockImplementation(() => {});

        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;
        let e:any = null;
        //Act
        treeMenu.projectService_addListener(e);

        // Assert
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();
        expect(forceUpdateMock).toHaveBeenCalledTimes(1);
        expect(forceUpdateMock).toHaveBeenCalledWith();

    });
    test('the method addNewDomainEModel should use ProjectService', ()=>{

        //Arrange
        let createDomainEngineeringModelnMock = jest.spyOn(ProjectService.prototype, "createDomainEngineeringModel").mockImplementation(() => {});
        let raiseEventDomainEngineeringModelMock = jest.spyOn(ProjectService.prototype, "raiseEventDomainEngineeringModel").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});

        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.addNewDomainEModel('test_language_name');

        // Assert
        expect(createDomainEngineeringModelnMock).toHaveBeenCalledTimes(1);
        expect(createDomainEngineeringModelnMock).toHaveBeenCalledWith(project_service.project, 'test_language_name');
        expect(raiseEventDomainEngineeringModelMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('the method addNewApplicationEModel should use ProjectService', ()=>{

        //Arrange
        let createApplicationEngineeringModelMock = jest.spyOn(ProjectService.prototype, "createApplicationEngineeringModel").mockImplementation(() => {});
        let raiseEventApplicationEngineeringModelMock = jest.spyOn(ProjectService.prototype, "raiseEventApplicationEngineeringModel").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});

        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.addNewApplicationEModel('test_language_name');

        // Assert
        expect(createApplicationEngineeringModelMock).toHaveBeenCalledTimes(1);
        expect(createApplicationEngineeringModelMock).toHaveBeenCalledWith(project_service.project, 'test_language_name');
        expect(raiseEventApplicationEngineeringModelMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('the method addNewApplicationModel should use ProjectService', ()=>{

        //Arrange
        let createApplicationModelMock = jest.spyOn(ProjectService.prototype, "createApplicationModel").mockImplementation(() => {});
        let raiseEventApplicationModelModelMock = jest.spyOn(ProjectService.prototype, "raiseEventApplicationModelModel").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});

        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.addNewApplicationModel('test_language_name');

        // Assert
        expect(createApplicationModelMock).toHaveBeenCalledTimes(1);
        expect(createApplicationModelMock).toHaveBeenCalledWith(project_service.project, 'test_language_name');
        expect(raiseEventApplicationModelModelMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('the method addNewAdaptationModel should use ProjectService', ()=>{

        //Arrange
        let createAdaptationModelMock = jest.spyOn(ProjectService.prototype, "createAdaptationModel").mockImplementation(() => {});
        let raiseEventAdaptationModelModelMock = jest.spyOn(ProjectService.prototype, "raiseEventAdaptationModelModel").mockImplementation(() => {});
        let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject").mockImplementation(() => {});

        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.addNewAdaptationModel('test_language_name');

        // Assert
        expect(createAdaptationModelMock).toHaveBeenCalledTimes(1);
        expect(createAdaptationModelMock).toHaveBeenCalledWith(project_service.project, 'test_language_name');
        expect(raiseEventAdaptationModelModelMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledTimes(1);
        expect(saveProjectMock).toHaveBeenCalledWith();

    });
    test('the method viewMenuTree_addListener should use ProjectService and removeHidden', ()=>{

        //Arrange
        let getTreeItemSelectedMock = jest.spyOn(ProjectService.prototype, "getTreeItemSelected").mockImplementation(() => {});
        let removeHiddenMock = jest.spyOn(TreeMenu.prototype, "removeHidden").mockImplementation(() => {});

        let project_service = new ProjectService();
        let treeMenu = new TreeMenu(project_service);
        // @ts-ignore
        treeMenu.props.projectService = project_service;

        //Act
        treeMenu.viewMenuTree_addListener();

        // Assert
        expect(getTreeItemSelectedMock).toHaveBeenCalledTimes(1);
        expect(getTreeItemSelectedMock).toHaveBeenCalledWith();
        expect(removeHiddenMock).toHaveBeenCalledTimes(1);
        expect(removeHiddenMock).toHaveBeenCalledWith();


    });
})

