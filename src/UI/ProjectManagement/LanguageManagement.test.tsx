//@ts-nocheck
import LanguageManagement from "./LanguageManagement";
import {render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import ProjectService from "../../Application/Project/ProjectService";
import React from "react";


describe('Testing the LanguageManagement Component', ()=>{
    test('The update button is enabled ', ()=>{
        let project_service = new ProjectService();
        render(<LanguageManagement projectService={project_service} />);
        //Assert
        expect(screen.getByRole('listitem', {
            name: /update language/i
        })).toBeEnabled();

    });
    test('The delete button is enabled ', () => {
        let project_service = new ProjectService();
        render(<LanguageManagement projectService={project_service} />);
        //Assert
        expect(screen.getByRole('listitem', {
            name: /delete language/i
        })).toBeEnabled();
    });
    test('The create language button is enabled ', () => {
        let project_service = new ProjectService();
        render(<LanguageManagement projectService={project_service} />);
        //Assert
        expect(screen.getByRole('listitem', {
            name: /new language/i
        })).toBeEnabled();
    });
    test('componentDidMount should work as expected', ()=>{

        //Arrange
        let addLanguagesDetailListenerMock = jest.spyOn(ProjectService.prototype, "addLanguagesDetailListener").mockImplementation(() => {});
        let project_service = new ProjectService();
        let languageManagement = new LanguageManagement(project_service);
        languageManagement.props.projectService = project_service;

        //Act
        languageManagement.componentDidMount();

        //Assert
        expect(addLanguagesDetailListenerMock).toHaveBeenCalledTimes(1)
        expect(addLanguagesDetailListenerMock).toHaveBeenCalledWith(languageManagement.projectService_addListener)
    })
    test('projectService_addListener should work as expected', ()=>{

        //Arrange
        let forceUpdateMock = jest.spyOn(LanguageManagement.prototype, "forceUpdate").mockImplementation(() => {});
        let project_service = new ProjectService();
        let languageManagement = new LanguageManagement(project_service);
        languageManagement.props.projectService = project_service;

        //Act
        languageManagement.projectService_addListener();

        //Assert
        expect(forceUpdateMock).toHaveBeenCalledTimes(1)
        expect(forceUpdateMock).toHaveBeenCalledWith()
    })
    test('validateSchemaConcreteSyntax should return true', ()=>{

        //Arrange
        let project_service = new ProjectService();
        let languageManagement = new LanguageManagement(project_service);

        //Act
        let result = languageManagement.validateSchemaConcreteSyntax();

        //Assert
        expect(result).toBe(true)
    })
    test('validateSchemaAbstractSyntax should return true', ()=>{

        //Arrange
        let project_service = new ProjectService();
        let languageManagement = new LanguageManagement(project_service);

        //Act
        let result = languageManagement.validateSchemaAbstractSyntax();

        //Assert
        expect(result).toBe(true)
    })
    test('activeCreate should use getElementById', ()=>{

        //Arrange
        let getElementByIdMock = jest.spyOn(document, "getElementById");
        let project_service = new ProjectService();
        render(<LanguageManagement projectService={project_service} />);
        let languageManagement = new LanguageManagement(project_service);
        languageManagement.props.projectService = project_service;

        //Act
        languageManagement.activeCreate();

        //Assert
        expect(getElementByIdMock).toHaveBeenCalledTimes(2)
        expect(getElementByIdMock).toHaveBeenCalledWith('nav-createlanguage-tab')
    })
    test('updateLanguageListSelected should use clearForm and setState', ()=>{

        //Arrange
        let clearFormMock = jest.spyOn(LanguageManagement.prototype, "clearForm").mockImplementation(() => {});
        let setStateMock = jest.spyOn(LanguageManagement.prototype, "setState").mockImplementation(() => {});
        let project_service = new ProjectService();
        let languageManagement = new LanguageManagement(project_service);
        languageManagement.props.projectService = project_service;
        let event = {
            target:{
                value: 'test_value'
            }
        };
        let state = {
            languageListSelected: event.target.value,
        }
        //Act
        languageManagement.updateLanguageListSelected(event);

        //Assert
        expect(clearFormMock).toHaveBeenCalledTimes(1)
        expect(clearFormMock).toHaveBeenCalledWith()
        expect(setStateMock).toHaveBeenCalledTimes(1)
        expect(setStateMock).toHaveBeenCalledWith(state)
        expect(event.target.value).toBe('test_value')
    })
})
