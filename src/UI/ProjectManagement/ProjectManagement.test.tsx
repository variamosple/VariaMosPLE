//@ts-nocheck
import ProjectManagement from "./ProjectManagement";
import ProjectService from "./../../Application/Project/ProjectService"
import {fireEvent, render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import React from "react";
import * as alertify from "alertifyjs";


test('On initial render, the Create button should be enabled ', ()=>{
   //Arrange
   let project_service = new ProjectService();
   render(<ProjectManagement projectService={project_service} />);
   //Assert
   expect(screen.getAllByRole('button', {name: /create/i})[0]).toBeEnabled();
});

describe('Testing the Project name input', ()=>{

   test('On initial render, the Project Name input should be empty ', ()=>{
      //Arrange
      let project_service = new ProjectService();
      render(<ProjectManagement projectService={project_service} />);
      const inputElement = screen.getByPlaceholderText('VariaMosProject');
      //Assert
      // @ts-ignore
      expect(inputElement.value).toBe("");
   });

   test('Should be able to type in Project Name input', ()=>{
      //Arrange
      let project_service = new ProjectService();
      render(<ProjectManagement projectService={project_service} />);
      const inputElement = screen.getByPlaceholderText('VariaMosProject');
      //Act
      fireEvent.change(inputElement, {target : {value : "Project name for testing"}});
      //Assert
      // @ts-ignore
      expect(inputElement.value).toBe("Project name for testing");
   });


})

describe('Testing the Product line name input', ()=>{

   test('On initial render, the Product Line Name input should be empty ', ()=>{
      //Arrange
      let project_service = new ProjectService();
      render(<ProjectManagement projectService={project_service} />);
      const inputElement = screen.getByPlaceholderText('VariaMosProductLineE');
      //Assert
      // @ts-ignore
      expect(inputElement.value).toBe("");
   });

   test('Should be able to type in Product Line Name input', ()=>{
      //Arrange
      let project_service = new ProjectService();
      render(<ProjectManagement projectService={project_service} />);
      const inputElement = screen.getByPlaceholderText('VariaMosProductLineE');
      //Act
      fireEvent.change(inputElement, {target : {value : "Product line name for testing"}});
      //Assert
      // @ts-ignore
      expect(inputElement.value).toBe("Product line name for testing");
   });

})

describe('Testing the methods', ()=>{
   test('btnCreateProject_onClick should use alertify and return false when project name = ""', ()=>{

      //Arrange
      let alertifyMock = jest.spyOn(alertify, "error");
      let getElementByIdMock = jest.spyOn(document, "getElementById");

      let project_service = new ProjectService();
      let projectManagement = new ProjectManagement({projectService: project_service});
      projectManagement.props.projectService.project.enable = true
      let event={}
      let state = {
         projectName: '',
      }
      projectManagement.state = state
      //Act
      let result = projectManagement.btnCreateProject_onClick(event);


      //Assert
      expect(alertifyMock).toHaveBeenCalledTimes(1);
      expect(alertifyMock).toHaveBeenCalledWith('Project name is required');

      expect(getElementByIdMock).toHaveBeenCalledTimes(1);
      expect(getElementByIdMock).toHaveBeenCalledWith('enterProjectName');

      expect(result).toBe(false);
   })
   test('btnCreateProject_onClick should use alertify and return false when product name = ""', ()=>{

      //Arrange
      let alertifyMock = jest.spyOn(alertify, "error");
      let getElementByIdMock = jest.spyOn(document, "getElementById");

      let project_service = new ProjectService();
      let projectManagement = new ProjectManagement({projectService: project_service});
      projectManagement.props.projectService.project.enable = true
      let event={}
      let state = {
         projectName: 'test_projectName',
         productLineName: '',
      }
      projectManagement.state = state
      //Act
      let result = projectManagement.btnCreateProject_onClick(event);


      //Assert
      expect(alertifyMock).toHaveBeenCalledTimes(1);
      expect(alertifyMock).toHaveBeenCalledWith('Product line name is required');

      expect(getElementByIdMock).toHaveBeenCalledTimes(1);
      expect(getElementByIdMock).toHaveBeenCalledWith('enterProductLineName');

      expect(result).toBe(false);
   })
   test('btnCreateProject_onClick should use PropertyService', ()=>{

      //Arrange
      let updateProjectNameMock = jest.spyOn(ProjectService.prototype, "updateProjectName");
      let updateProjectStateMock = jest.spyOn(ProjectService.prototype, "updateProjectState");
      let createLPSMock = jest.spyOn(ProjectService.prototype, "createLPS");
      let raiseEventNewProductLineMock = jest.spyOn(ProjectService.prototype, "raiseEventNewProductLine");
      let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject");

      let project_service = new ProjectService();
      let projectManagement = new ProjectManagement({projectService: project_service});
      projectManagement.props.projectService.project.enable = true
      let event={}
      let state = {
         projectName: 'test_projectName',
         productLineName: 'test_productLineName',
      }
      projectManagement.state = state
      //Act
      projectManagement.btnCreateProject_onClick(event);


      //Assert
      expect(updateProjectNameMock).toHaveBeenCalledTimes(1);
      expect(updateProjectNameMock).toHaveBeenCalledWith(state.projectName);

      expect(updateProjectStateMock).toHaveBeenCalledTimes(1);
      expect(updateProjectStateMock).toHaveBeenCalledWith(true);

      expect(createLPSMock).toHaveBeenCalledTimes(1);

      expect(raiseEventNewProductLineMock).toHaveBeenCalledTimes(1);

      expect(saveProjectMock).toHaveBeenCalledTimes(1);
      expect(saveProjectMock).toHaveBeenCalledWith();
   })
   test('btnCreateProject_onClick should use getElementById', ()=>{

      //Arrange
      let getElementByIdMock = jest.spyOn(document, "getElementById");

      let project_service = new ProjectService();
      let projectManagement = new ProjectManagement({projectService: project_service});
      projectManagement.props.projectService.project.enable = true
      let event={}
      let state = {
         projectName: 'test_projectName',
         productLineName: 'test_productLineName',
      }
      projectManagement.state = state
      //Act
      projectManagement.btnCreateProject_onClick(event);

      //Assert
      expect(getElementByIdMock).toHaveBeenCalledTimes(1);
      expect(getElementByIdMock).toHaveBeenCalledWith('openModal');
   })
   test('btnSaveProject_onClick should return false when project name =""', ()=>{

      //Arrange
      let alertifyMock = jest.spyOn(alertify, "error");
      let getElementByIdMock = jest.spyOn(document, "getElementById");

      let project_service = new ProjectService();
      let projectManagement = new ProjectManagement({projectService: project_service});
      let event={}
      let state = {
         projectName: '',
         productLineName: 'test_productLineName',
      }
      projectManagement.state = state
      //Act
      let result = projectManagement.btnSaveProject_onClick(event);

      //Assert
      expect(getElementByIdMock).toHaveBeenCalledTimes(1);
      expect(getElementByIdMock).toHaveBeenCalledWith('enterMyProjectName');
      expect(alertifyMock).toHaveBeenCalledTimes(1);
      expect(alertifyMock).toHaveBeenCalledWith('Project name is required');
      expect(result).toBe(false)

   })
   test('btnSaveProject_onClick should use ProjectService, alertify, getElementById', ()=>{

      //Arrange
      let getElementByIdMock = jest.spyOn(document, "getElementById");
      let getLanguagesDetailMock = jest.spyOn(ProjectService.prototype, "getLanguagesDetail");
      let updateProjectNameMock = jest.spyOn(ProjectService.prototype, "updateProjectName");
      let raiseEventLanguagesDetailMock = jest.spyOn(ProjectService.prototype, "raiseEventLanguagesDetail");
      let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject");

      let project_service = new ProjectService();
      let projectManagement = new ProjectManagement({projectService: project_service});
      let event={}
      let state = {
         projectName: 'test_projectName',
         productLineName: 'test_productLineName',
      }
      projectManagement.state = state
      //Act

      projectManagement.btnSaveProject_onClick(event);

      //Assert
      expect(getElementByIdMock).toHaveBeenCalledTimes(1);
      expect(getElementByIdMock).toHaveBeenCalledWith('openModal');

      // expect(getLanguagesDetailMock).toHaveBeenCalledTimes(2); //Called once at new ProjectService()
      // expect(getLanguagesDetailMock).toHaveBeenCalledWith();

      expect(updateProjectNameMock).toHaveBeenCalledTimes(1);
      expect(updateProjectNameMock).toHaveBeenCalledWith(state.projectName);

      expect(raiseEventLanguagesDetailMock).toHaveBeenCalledTimes(1);

      expect(saveProjectMock).toHaveBeenCalledTimes(1);
      expect(saveProjectMock).toHaveBeenCalledWith();
   })
   test('importProject should use ProjectService, getElementById', ()=>{

      //Arrange
      let getElementByIdMock = jest.spyOn(document, "getElementById");
      let importProjectMock = jest.spyOn(ProjectService.prototype, "importProject").mockImplementation(()=>{});

      let project_service = new ProjectService();
      let projectManagement = new ProjectManagement({projectService: project_service});
      let state = {
         importProject: 'test_importProject',
      }
      projectManagement.state = state
      //Act

      projectManagement.importProject();

      //Assert
      expect(getElementByIdMock).toHaveBeenCalledTimes(3);
      expect(getElementByIdMock).toHaveBeenCalledWith('list-iProject-list');
      expect(getElementByIdMock).toHaveBeenCalledWith('list-iProject');

      expect(importProjectMock).toHaveBeenCalledTimes(1); //Called once at new ProjectService()
      expect(importProjectMock).toHaveBeenCalledWith(projectManagement.state.importProject);

   })
   test('componentDidMount should use ProjectService', ()=>{

      //Arrange
      let addUpdateProjectListenerMock = jest.spyOn(ProjectService.prototype, "addUpdateProjectListener").mockImplementation(() => {});
      let project_service = new ProjectService();
      let projectManagement = new ProjectManagement({projectService: project_service});

      //Act
      projectManagement.componentDidMount();

      //Assert
      expect(addUpdateProjectListenerMock).toHaveBeenCalledTimes(1)
      expect(addUpdateProjectListenerMock).toHaveBeenCalledWith(projectManagement.projectService_addListener)
   })
   test('projectService_addListener should use forceUpdate and loadProject', ()=>{

      //Arrange
      let forceUpdateMock = jest.spyOn(ProjectManagement.prototype, "forceUpdate").mockImplementation(() => {});
      let loadProjectMock = jest.spyOn(ProjectManagement.prototype, "loadProject").mockImplementation(() => {});
      let project_service = new ProjectService();
      let projectManagement = new ProjectManagement({projectService: project_service});

      //Act
      projectManagement.projectService_addListener();

      //Assert
      expect(forceUpdateMock).toHaveBeenCalledTimes(1)
      expect(forceUpdateMock).toHaveBeenCalledWith()
      expect(loadProjectMock).toHaveBeenCalledTimes(2) //loadProject is run once in the constructor
      expect(loadProjectMock).toHaveBeenCalledWith()
   })
   test('onEnterSaveProject should use btnSaveProject_onClick', ()=>{

      //Arrange
      let btnSaveProject_onClickMock = jest.spyOn(ProjectManagement.prototype, "btnSaveProject_onClick").mockImplementation(() => {});
      let project_service = new ProjectService();
      let projectManagement = new ProjectManagement({projectService: project_service});
      projectManagement.props.projectService.project.enable = true
      let event={
         key: 'Enter'
      }
      //Act
      projectManagement.onEnterSaveProject(event);

      //Assert
      expect(btnSaveProject_onClickMock).toHaveBeenCalledTimes(1)
      expect(btnSaveProject_onClickMock).toHaveBeenCalledWith(event)

      event.key = 'Not Enter'
      projectManagement.onEnterSaveProject(event);
      expect(btnSaveProject_onClickMock).toHaveBeenCalledTimes(1)
   })
   test('onEnterCreateProject should use btnSaveProject_onClick', ()=>{

      //Arrange
      let btnCreateProject_onClickMock = jest.spyOn(ProjectManagement.prototype, "btnCreateProject_onClick").mockImplementation(() => {});
      let project_service = new ProjectService();
      let projectManagement = new ProjectManagement({projectService: project_service});
      projectManagement.props.projectService.project.enable = true
      let event={
         key: 'Enter'
      }
      //Act
      projectManagement.onEnterCreateProject(event);

      //Assert
      expect(btnCreateProject_onClickMock).toHaveBeenCalledTimes(1)
      expect(btnCreateProject_onClickMock).toHaveBeenCalledWith(event)

      event.key = 'Not Enter'
      projectManagement.onEnterSaveProject(event);
      expect(btnCreateProject_onClickMock).toHaveBeenCalledTimes(1)
   })
   test('onEnterFocusPL should use getElementById', ()=>{

      //Arrange
      let getElementByIdMock = jest.spyOn(document, "getElementById").mockImplementation(() => {});
      let project_service = new ProjectService();
      let projectManagement = new ProjectManagement({projectService: project_service});
      projectManagement.props.projectService.project.enable = true
      let event={
         key: 'Enter'
      }
      //Act
      projectManagement.onEnterFocusPL(event);

      //Assert
      expect(getElementByIdMock).toHaveBeenCalledTimes(1)
      expect(getElementByIdMock).toHaveBeenCalledWith("enterProductLineName")

      event.key = 'Not Enter'
      projectManagement.onEnterSaveProject(event);
      expect(getElementByIdMock).toHaveBeenCalledTimes(1)
   })
   test('handleUpdateNameProject should use setState', ()=>{

      //Arrange
      let setStateMock = jest.spyOn(ProjectManagement.prototype, "setState").mockImplementation(() => {});
      let project_service = new ProjectService();
      let projectManagement = new ProjectManagement({projectService: project_service});
      projectManagement.props.projectService.project.enable = true
      let event={
         target:{
            value: 'test_value'
         }
      }
      let state = {
         projectName: event.target.value,
      }
      //Act
      projectManagement.handleUpdateNameProject(event);

      //Assert
      expect(setStateMock).toHaveBeenCalledTimes(1)
      expect(setStateMock).toHaveBeenCalledWith(state)
   })
   test('handleUpdateNameProductLine should use setState', ()=>{

      //Arrange
      let setStateMock = jest.spyOn(ProjectManagement.prototype, "setState").mockImplementation(() => {});
      let project_service = new ProjectService();
      let projectManagement = new ProjectManagement({projectService: project_service});
      projectManagement.props.projectService.project.enable = true
      let event={
         target:{
            value: 'test_value'
         }
      }
      let state = {
         productLineName: event.target.value,
      }
      //Act
      projectManagement.handleUpdateNameProductLine(event);

      //Assert
      expect(setStateMock).toHaveBeenCalledTimes(1)
      expect(setStateMock).toHaveBeenCalledWith(state)
   })

})

