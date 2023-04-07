//@ts-nocheck
import '@testing-library/jest-dom/extend-expect';
import React from "react";
import ProjectService from "../../Application/Project/ProjectService";
import CustomProperties from "./CustomProperties";
import * as alertify from "alertifyjs";


describe('Testing the CustomProperties Component', ()=>{
  test('The constructor should work as expected', ()=>{

    //Arrange
    let project_service = new ProjectService();
    let state = {
      propertyName: "",
      propertyType: "",
      propertyOptions: "",
      propertyListSelected: "",
      enabledOptionList: true,
      lastNameUpdate: "",
    }

    //Act
    let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});

    //Assert
    expect(customProperties.state).toEqual(state)
  })
  test('componentDidMount should work as expected', ()=>{

    //Arrange
    let addSelectedElementListenerMock = jest.spyOn(ProjectService.prototype, "addSelectedElementListener").mockImplementation(() => {});
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});
    customProperties.props.projectService = project_service
    //
    //Act
    customProperties.componentDidMount()

    //Assert
    expect(addSelectedElementListenerMock).toHaveBeenCalledTimes(1);
    expect(addSelectedElementListenerMock).toHaveBeenCalledWith(customProperties.projectService_addSelectedElementListener);
  })
  test('projectService_addSelectedElementListener should use the method forceUpdate', ()=>{

    //Arrange
    let forceUpdateMock = jest.spyOn(CustomProperties.prototype, "forceUpdate").mockImplementation(() => {});
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});
    customProperties.props.projectService = project_service
    let e = {model: 'test_model',element: 'test_element'}


    //Act
    customProperties.projectService_addSelectedElementListener(e)

    //Assert
    expect(forceUpdateMock).toHaveBeenCalledTimes(1);
    expect(forceUpdateMock).toHaveBeenCalledWith();

  })
  test('projectService_addSelectedElementListener should set the variables', ()=>{

    //Arrange
    let forceUpdateMock = jest.spyOn(CustomProperties.prototype, "forceUpdate").mockImplementation(() => {});
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});
    customProperties.props.projectService = project_service
    let e = {model: 'test_model',element: 'test_element'}


    //Act
    customProperties.projectService_addSelectedElementListener(e)

    //Assert
    expect(customProperties.currentModel).toBe('test_model');
    expect(customProperties.currentObject).toBe('test_element');
    expect(forceUpdateMock).toHaveBeenCalledTimes(1);
    expect(forceUpdateMock).toHaveBeenCalledWith();

  })
  test('selectTypeChange should use the method setState with false', ()=>{

    //Arrange
    let setStateMock = jest.spyOn(CustomProperties.prototype, "setState").mockImplementation(() => {});
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});
    customProperties.props.projectService = project_service
    let event = {target:{
      value: 'Select'
      }}
    let state={
      propertyType: 'Select',
      enabledOptionList: false,
    }

    //Act
    customProperties.selectTypeChange(event)

    //Assert
    expect(setStateMock).toHaveBeenCalledTimes(1);
    expect(setStateMock).toHaveBeenCalledWith(state);
  })
  test('selectTypeChange should use the method setState with true', ()=>{

    //Arrange
    let setStateMock = jest.spyOn(CustomProperties.prototype, "setState").mockImplementation(() => {});
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});
    customProperties.props.projectService = project_service
    let event = {target:{
        value: 'Not Select'
      }}
    let state={
      propertyType: 'Not Select',
      enabledOptionList: true,
    }

    //Act
    customProperties.selectTypeChange(event)

    //Assert
    expect(setStateMock).toHaveBeenCalledTimes(1);
    expect(setStateMock).toHaveBeenCalledWith(state);
  })
  test('selectNameChange should use the method setState with true', ()=>{

    //Arrange
    let setStateMock = jest.spyOn(CustomProperties.prototype, "setState").mockImplementation(() => {});
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});
    customProperties.props.projectService = project_service
    customProperties.state.propertyName = 'test_property_name_init'
    let lastNameProperty = customProperties.state.propertyName
    let event = {target:{
        value: 'test_property_name'
      }}
    let state={
      lastNameUpdate: lastNameProperty,
      propertyName: 'test_property_name',
    }

    //Act
    customProperties.selectNameChange(event)

    //Assert
    expect(setStateMock).toHaveBeenCalledTimes(1);
    expect(setStateMock).toHaveBeenCalledWith(state);
  })
  test('selectOptionListChange should use the method setState with true', ()=>{

    //Arrange
    let setStateMock = jest.spyOn(CustomProperties.prototype, "setState").mockImplementation(() => {});
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});
    customProperties.props.projectService = project_service
    let event = {target:{
        value: 'test_value'
      }}
    let state={
      propertyOptions: 'test_value'
    }

    //Act
    customProperties.selectOptionListChange(event)

    //Assert
    expect(setStateMock).toHaveBeenCalledTimes(1);
    expect(setStateMock).toHaveBeenCalledWith(state);
  })
  test('nullValidate should return false when propertyName=""', ()=>{

    //Arrange
    let getElementByIdMock = jest.spyOn(document, "getElementById").mockImplementation(() => {});
    let errorMock = jest.spyOn(alertify, "error").mockImplementation(() => {});
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});
    customProperties.props.projectService = project_service
    customProperties.state.propertyName = ""

    //Act
    let result = customProperties.nullValidate()

    //Assert
    expect(result).toBe(false);

    expect(getElementByIdMock).toHaveBeenCalledTimes(1);
    expect(getElementByIdMock).toHaveBeenCalledWith('newPropertyOptionList');

    expect(errorMock).toHaveBeenCalledTimes(1);
    expect(errorMock).toHaveBeenCalledWith('Name property is required');
  })
  test('nullValidate should return false when propertyName!=""', ()=>{

    //Arrange
    let getElementByIdMock = jest.spyOn(document, "getElementById").mockImplementation(() => {});
    let errorMock = jest.spyOn(alertify, "error").mockImplementation(() => {});
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});
    customProperties.props.projectService = project_service
    customProperties.state =
        {
          propertyName : "test_property_name",
          propertyOptions : '',
          propertyType : 'Select'
        }

    //Act
    let result = customProperties.nullValidate()

    //Assert
    expect(result).toBe(false);

    expect(getElementByIdMock).toHaveBeenCalledTimes(1);
    expect(getElementByIdMock).toHaveBeenCalledWith('languageListSelected');

    expect(errorMock).toHaveBeenCalledTimes(1);
    expect(errorMock).toHaveBeenCalledWith('Option list property is required');
  })
  test('nullValidate should return true', ()=>{

    //Arrange
    let getElementByIdMock = jest.spyOn(document, "getElementById").mockImplementation(() => {});
    let errorMock = jest.spyOn(alertify, "error").mockImplementation(() => {});
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});
    customProperties.props.projectService = project_service
    customProperties.state =
        {
          propertyName : "test_property_name",
          propertyOptions : 'test_property_options',
          propertyType : 'test_select'
        }

    //Act
    let result = customProperties.nullValidate()

    //Assert
    expect(result).toBe(true);
    expect(getElementByIdMock).not.toHaveBeenCalled();
    expect(errorMock).not.toHaveBeenCalled();
  })
  test('validatePropertyExist should return true with "update" func', ()=>{
    //Arrange
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});
    customProperties.props.projectService = project_service
    customProperties.state =
        {
          lastNameUpdate : "test_property_name",
          propertyName : 'test_property_name'
        }

    //Act
    let result = customProperties.validatePropertyExist("update")

    //Assert
    expect(result).toBe(true);
  })

  // test('validatePropertyExist should return false', ()=>{
  //   //Arrange
  //   let getElementByIdMock = jest.spyOn(document, "getElementById").mockImplementation(() => {});
  //   let errorMock = jest.spyOn(alertify, "error").mockImplementation(() => {});
  //   let project_service = new ProjectService();
  //   let customProperties = new CustomProperties({projectService: project_service});
  //   customProperties.props.projectService = project_service
  //   customProperties.state =
  //       {
  //         lastNameUpdate : "test_property_name",
  //         propertyName : 'test_property_name'
  //       }
  //
  //   //Act
  //   let result = customProperties.validatePropertyExist("not_update")
  //
  //   //Assert
  //   expect(result).toBe(false);
  //
  //   expect(getElementByIdMock).toHaveBeenCalledTimes(1);
  //   expect(getElementByIdMock).toHaveBeenCalledWith('newPropertyName');
  //
  //   expect(errorMock).toHaveBeenCalledTimes(1);
  //   expect(errorMock).toHaveBeenCalledWith('Property name already exist');
  // })

  // test('validatePropertyExist should return true', ()=>{
  //   //Arrange
  //   let getElementByIdMock = jest.spyOn(document, "getElementById").mockImplementation(() => {});
  //   let errorMock = jest.spyOn(alertify, "error").mockImplementation(() => {});
  //   let project_service = new ProjectService();
  //   let customProperties = new CustomProperties({projectService: project_service});
  //   customProperties.props.projectService = project_service
  //   customProperties.state =
  //       {
  //         lastNameUpdate : "test_property_name",
  //         propertyName : 'test_property_name'
  //       }
  //
  //   //Act
  //   let result = customProperties.validatePropertyExist("not_update")
  //
  //   //Assert
  //   expect(result).toBe(true);
  //
  //   expect(getElementByIdMock).not.toHaveBeenCalled();
  //
  //   expect(errorMock).not.toHaveBeenCalled();
  // })

  test('createProperty should return false', ()=>{
    //Arrange
    let nullValidateMock = jest.spyOn(CustomProperties.prototype, "nullValidate").mockImplementationOnce(() => false).mockImplementationOnce(() => true);
    let validatePropertyExistMock = jest.spyOn(CustomProperties.prototype, "validatePropertyExist").mockImplementation(() => false);
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service});

    //Act
    let result = customProperties.createProperty();

    //Assert
    expect(result).toBe(false);

    //Act
    result = customProperties.createProperty();

    //Assert
    expect(result).toBe(false);

    expect(nullValidateMock).toHaveBeenCalledTimes(2);
    expect(validatePropertyExistMock).toHaveBeenCalled();

  })
  // test('createProperty should call ProjectService & alertify methods', ()=>{
  //   //Arrange
  //
  //   jest.spyOn(CustomProperties.prototype, "nullValidate").mockImplementation(() => true);
  //   jest.spyOn(CustomProperties.prototype, "validatePropertyExist").mockImplementation(() => true);
  //   let clearFormMock = jest.spyOn(CustomProperties.prototype, "clearForm").mockImplementation(() => true);
  //   let successMock = jest.spyOn(alertify, "success").mockImplementation(() => {});
  //   let saveProjectMock = jest.spyOn(ProjectService.prototype, "saveProject");
  //   let raiseEventUpdatedElementMock = jest.spyOn(ProjectService.prototype, "raiseEventUpdatedElement");
  //   let project_service = new ProjectService();
  //   let customProperties = new CustomProperties({projectService: project_service});
  //
  //   //Act
  //   let result = customProperties.createProperty();
  //
  //   //Assert
  //   expect(result).toBe(false);
  //
  //   //Act
  //   result = customProperties.createProperty();
  //
  //   //Assert
  //   expect(result).toBe(false);
  //
  //   expect(saveProjectMock).toHaveBeenCalledTimes(1);
  //   expect(saveProjectMock).toHaveBeenCalledWith();
  //
  //   expect(raiseEventUpdatedElementMock).toHaveBeenCalledTimes(1);
  //   expect(successMock).toHaveBeenCalledTimes(1);
  //   expect(clearFormMock).toHaveBeenCalledTimes(1);
  //
  //
  // })

  test('activeDelete should return false', ()=>{

    //Arrange
    let errorMock = jest.spyOn(alertify, "error").mockImplementation(() => {});
    let getElementByIdMock = jest.spyOn(document, "getElementById").mockImplementation(() => {});
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service});
    let state = {
      propertyListSelected: "-1"
    }
    customProperties.state = state;

    //Act
    let result = customProperties.activeDelete();

    //Assert
    expect(result).toBe(false);

    expect(getElementByIdMock).toHaveBeenCalledTimes(1);
    expect(getElementByIdMock).toHaveBeenCalledWith('propertyListSelected');

    expect(errorMock).toHaveBeenCalledTimes(1);
    expect(errorMock).toHaveBeenCalledWith('Select property is required');
  })

  // test('activeDelete should not return false', ()=>{
  //
  // })

  // test('clearForm should use getElementById & setState methods', ()=>{
  //
  //   //Arrange
  //   let getElementByIdMock = jest.spyOn(document, "getElementById").mockImplementation(() => {});
  //   let setStateMock = jest.spyOn(CustomProperties.prototype, "setState").mockImplementation(() => {});
  //   let project_service = new ProjectService();
  //   let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});
  //   render(<CustomProperties projectService={project_service} currentObject={});
  //
  //   let state = {
  //     propertyName: "",
  //     propertyType: "",
  //     propertyOptions: "",
  //     propertyListSelected: "",
  //     enabledOptionList: true,
  //     lastNameUpdate: "",
  //   }
  //   //Act
  //   customProperties.clearForm()
  //
  //   //Assert
  //
  //   expect(getElementByIdMock).toHaveBeenCalledTimes(7);
  //   expect(getElementByIdMock).toHaveBeenCalledWith('nav-updateproperty-tab');
  //   expect(getElementByIdMock).toHaveBeenCalledWith('nav-createproperty-tab');
  //   expect(getElementByIdMock).toHaveBeenCalledWith('"btnCreateproperty"');
  //   expect(getElementByIdMock).toHaveBeenCalledWith('btnCreateLoading');
  //   expect(getElementByIdMock).toHaveBeenCalledWith('btnUpdateproperty');
  //   expect(getElementByIdMock).toHaveBeenCalledWith('btnUpdateLoading');
  //   expect(getElementByIdMock).toHaveBeenCalledWith('nav-propertylist-tab');
  //
  //   expect(setStateMock).toHaveBeenCalledTimes(1);
  //   expect(setStateMock).toHaveBeenCalledWith(state);
  // })

  test('updateProperty should have been called', ()=>{

    //Arrange
    let updatePropertyMock = jest.spyOn(CustomProperties.prototype, "updateProperty").mockImplementation(() => {});
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});
    customProperties.props.projectService = project_service

    //Act
    customProperties.updateProperty()

    //Assert
    expect(updatePropertyMock).toHaveBeenCalledTimes(1);
    expect(updatePropertyMock).toHaveBeenCalledWith();
  })
  test('deleteProperty should have been called', ()=>{

    //Arrange
    let deletePropertyMock = jest.spyOn(CustomProperties.prototype, "deleteProperty").mockImplementation(() => {});
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});
    customProperties.props.projectService = project_service

    //Act
    customProperties.deleteProperty()

    //Assert
    expect(deletePropertyMock).toHaveBeenCalledTimes(1);
    expect(deletePropertyMock).toHaveBeenCalledWith();
  })
  test('activeUpdate should have been called', ()=>{

    //Arrange
    let activeUpdateMock = jest.spyOn(CustomProperties.prototype, "activeUpdate").mockImplementation(() => {});
    let project_service = new ProjectService();
    let customProperties = new CustomProperties({projectService: project_service, currentObject: {}});
    customProperties.props.projectService = project_service

    //Act
    customProperties.activeUpdate()

    //Assert
    expect(activeUpdateMock).toHaveBeenCalledTimes(1);
    expect(activeUpdateMock).toHaveBeenCalledWith();
  })

})
