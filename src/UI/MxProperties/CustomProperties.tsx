import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";
import * as alertify from "alertifyjs";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";

interface Props {
  projectService: ProjectService;
  currentObject: Element;
}
interface State {
  propertyName: string;
  propertyType: string;
  propertyOptions: string;
  propertyListSelected: string;
  enabledOptionList: boolean;
  lastNameUpdate: string;
}

export default class CustomProperties extends Component<Props, State> {
  containerRef: any;
  currentModel?: Model;
  currentObject?: any;
  elementDefinition?: any;

  constructor(props: Props) {
    super(props);
    this.containerRef = React.createRef();

    this.createProperty = this.createProperty.bind(this);
    this.updateProperty = this.updateProperty.bind(this);
    this.deleteProperty = this.deleteProperty.bind(this);

    this.activeUpdate = this.activeUpdate.bind(this);
    this.activeDelete = this.activeDelete.bind(this);
    this.activeCreate = this.activeCreate.bind(this);

    this.selectTypeChange = this.selectTypeChange.bind(this);
    this.selectNameChange = this.selectNameChange.bind(this);
    this.selectOptionListChange = this.selectOptionListChange.bind(this);

    this.state = {
      propertyName: "",
      propertyType: "",
      propertyOptions: "",
      propertyListSelected: "",
      enabledOptionList: true,
      lastNameUpdate: "",
    };

    this.projectService_addSelectedElementListener =
      this.projectService_addSelectedElementListener.bind(this);
  }

  componentDidMount() {
    let me = this;
    me.props.projectService.addSelectedElementListener(
      this.projectService_addSelectedElementListener
    );
  }

  projectService_addSelectedElementListener(e: any) {
    this.currentModel = e.model;
    this.currentObject = e.element;
    this.forceUpdate();
  }

  selectTypeChange(event: any) {
    if (event.target.value === "Select") {
      this.setState({
        propertyType: event.target.value,
        enabledOptionList: false,
      });
    } else {
      this.setState({
        propertyType: event.target.value,
        enabledOptionList: true,
      });
    }
  }

  selectNameChange(event: any) {
    const lastNameProperty = this.state.propertyName;
    this.setState({
      lastNameUpdate: lastNameProperty,
      propertyName: event.target.value,
    });
  }

  selectOptionListChange(event: any) {
    this.setState({
      propertyOptions: event.target.value,
    });
  }

  nullValidate(): boolean {
    if (this.state.propertyName === "") {
      alertify.error("Name property is required");
      document.getElementById("newPropertyOptionList")?.focus();
      return false;
    }

    if (
      this.state.propertyOptions === "" &&
      this.state.propertyType === "Select"
    ) {
      alertify.error("Option list property is required");
      document.getElementById("languageListSelected")?.focus();
      return false;
    }

    return true;
  }

  validatePropertyExist(func?: string): boolean {
    if (
      func === "update" &&
      this.state.lastNameUpdate === this.state.propertyName
    )
      return true;

    for (let i = 0; i < this.currentObject.properties.length; i++) {
      const element = this.currentObject.properties[i];
      if (element.name === this.state.propertyName) {
        alertify.error("Property name already exist");
        document.getElementById("newPropertyName")?.focus();
        return false;
      }
    }

    return true;
  }

  createProperty() {
    if (!this.nullValidate()) return false;
    if (!this.validatePropertyExist()) return false;

    const options: any = this.state.propertyOptions.split("\n");

    this.currentObject.properties.push(
      new Property(
        this.state.propertyName,
        null,
        this.state.propertyType,
        options,
        null,
        null,
        true,
        true,
        null,
        null,
        null,
        null,
        null,
        null
      )
    );

    this.props.projectService.saveProject();
    this.props.projectService.raiseEventUpdatedElement(
      this.currentModel,
      this.currentObject
    );

    alertify.success("Property created successfully");
    this.clearForm();
  }

  updateProperty() {}

  deleteProperty() {}

  activeUpdate() {}

  activeDelete() {
    if (this.state.propertyListSelected === "-1") {
      alertify.error("Select property is required");
      document.getElementById("propertyListSelected")?.focus();
      return false;
    }
    document.getElementById("deleteViewModalproperty").click();
  }

  activeCreate() {
    document
      .getElementById("nav-createproperty-tab")
      .classList.remove("hidden");
    document.getElementById("nav-createproperty-tab").click();
  }

  clearForm() {
    document.getElementById("nav-updateproperty-tab").classList.add("hidden");
    document.getElementById("nav-createproperty-tab").classList.add("hidden");

    document.getElementById("btnCreateproperty").classList.remove("hidden");
    document.getElementById("btnCreateLoading").classList.add("hidden");

    document.getElementById("btnUpdateproperty").classList.remove("hidden");
    document.getElementById("btnUpdateLoading").classList.add("hidden");
    this.setState({
      propertyName: "",
      propertyType: "",
      propertyOptions: "",
      propertyListSelected: "",
      enabledOptionList: true,
      lastNameUpdate: "",
    });
    document.getElementById("nav-propertylist-tab").click();
  }

  render() {
    return (
      <div className="CustomProperties">
        <div>
          <div
            className="modal fade show"
            id="customPropertiesSettings"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
            tabIndex={-1}
            aria-labelledby="customPropertiesSettingsLabel"
          >
            <div className="modal-dialog modal-dialog-centered modal-xl">
              <div className="modal-content">
                <div className="modal-header">
                  <h5
                    className="modal-title"
                    id="customPropertiesSettingsLabel"
                  >
                    Custom properties settings
                  </h5>
                  <div className="float-end" id="customPropertiesBtn">
                    <ul className="list-group list-group-horizontal">
                      <li
                        className="list-group-item icon-dark-variamos rounded"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        title="Close"
                        // style={{ paddingTop: "0px", paddingBottom: "0px" }}
                      >
                        <span
                          onClick={() =>
                            document
                              .getElementById("customPropertiesSettingsBtn")
                              .click()
                          }
                          className="bi bi-x-octagon shadow rounded"
                        ></span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="modal-body">
                  <div>
                    <div
                      className="modal fade"
                      id="modalDeleteProperty"
                      tabIndex={-1}
                      aria-labelledby="deleteModalLabel"
                      aria-hidden="true"
                    >
                      <div className="modal-dialog modalLanguage-center-variamos">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title" id="deleteModalLabel">
                              Delete
                            </h5>
                            <button
                              type="button"
                              className="btn-close"
                              data-bs-toggle="modal"
                              data-bs-target="#modalDeleteProperty"
                              aria-label="Close"
                            ></button>
                          </div>
                          <div className="modal-body">
                            <p>Are you sure you wish to delete this item?</p>
                          </div>
                          <div className="modal-footer">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              data-bs-toggle="modal"
                              data-bs-target="#modalDeleteProperty"
                            >
                              No
                            </button>
                            <button
                              type="button"
                              className="btn btn-Variamos"
                              // onClick={this.deleteproperty}
                              data-bs-toggle="modal"
                              data-bs-target="#modalDeleteProperty"
                            >
                              Yes
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <nav>
                      <div className="nav nav-tabs" id="nav-tab" role="tablist">
                        <button
                          className="nav-link active"
                          id="nav-propertylist-tab"
                          data-bs-toggle="tab"
                          data-bs-target="#nav-propertylist"
                          type="button"
                          role="tab"
                          aria-controls="nav-propertylist"
                          aria-selected="false"
                          // onClick={this.clearForm}
                        >
                          Property list
                        </button>
                        <button
                          className="nav-link hidden"
                          id="nav-updateproperty-tab"
                          data-bs-toggle="tab"
                          data-bs-target="#nav-updateproperty"
                          type="button"
                          role="tab"
                          aria-controls="nav-updateproperty"
                          aria-selected="true"
                        >
                          Update property
                        </button>
                        <button
                          className="nav-link hidden"
                          id="nav-createproperty-tab"
                          data-bs-toggle="tab"
                          data-bs-target="#nav-createproperty"
                          type="button"
                          role="tab"
                          aria-controls="nav-createproperty"
                          aria-selected="true"
                        >
                          Create property
                        </button>
                      </div>
                    </nav>
                    <div className="tab-content" id="nav-tabContent">
                      <div
                        className="tab-pane fade show active"
                        id="nav-propertylist"
                        role="tabpanel"
                        aria-labelledby="nav-propertylist-tab"
                      >
                        <br />

                        <div className="row align-items-center p-1 ">
                          <div className="col-md-6">
                            <div className="form-floating">
                              <select
                                className="form-select"
                                id="propertyListSelected"
                                aria-label="Select property"
                                // value={this.state.propertyListSelected}
                                // onChange={this.updatepropertyListSelected}
                              >
                                <option value="-1"></option>
                                {this.currentObject?.properties.map(
                                  (property: Property, i: number) => {
                                    return property.custom ? (
                                      <option value={property.name} key={i}>
                                        {property.name}
                                      </option>
                                    ) : (
                                      ""
                                    );
                                  }
                                )}
                              </select>
                              <label htmlFor="propertyListSelected">
                                Select property
                              </label>
                            </div>
                          </div>

                          <div className="col-md d-flex justify-content-end">
                            <ul className="list-group list-group-horizontal">
                              <li
                                className="list-group-item icon-dark-variamos rounded"
                                data-bs-toggle="tooltip"
                                data-bs-placement="bottom"
                                title="Update property"
                                style={{ marginRight: "1em" }}
                                // onClick={this.activeUpdate}
                              >
                                <span
                                  className="bi bi-pencil-square shadow rounded"
                                  id="updateproperty"
                                ></span>
                              </li>
                              <li
                                className="list-group-item icon-dark-variamos rounded"
                                data-bs-toggle="tooltip"
                                data-bs-placement="bottom"
                                title="Delete property"
                                style={{ marginRight: "1em" }}
                                // onClick={this.activeDelete}
                              >
                                <span
                                  className="bi bi-trash shadow rounded"
                                  id="deleteproperty"
                                ></span>
                                <span
                                  className="hidden"
                                  id="deleteViewModalproperty"
                                  data-bs-toggle="modal"
                                  data-bs-target="#modalDeleteProperty"
                                ></span>
                              </li>
                              <li
                                className="list-group-item icon-dark-variamos rounded"
                                data-bs-toggle="tooltip"
                                data-bs-placement="bottom"
                                title="New property"
                                style={{ marginRight: "1em" }}
                                onClick={this.activeCreate}
                              >
                                <span
                                  className="bi bi-plus-circle shadow rounded"
                                  id="newproperty"
                                ></span>
                              </li>
                            </ul>
                          </div>
                          <div className="col"></div>
                        </div>
                      </div>
                      <div
                        className="tab-pane fade"
                        id="nav-updateproperty"
                        role="tabpanel"
                        aria-labelledby="nav-updateproperty-tab"
                      >
                        <br />
                        <div className="container">
                          <div className="row">
                            <div className="col-md">
                              <div className="form-floating">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="property name"
                                  id="updatepropertyName"
                                  // value={this.state.formproperty.name}
                                  // onChange={this.selectNameChange}
                                />
                                <label htmlFor="floatingInput">
                                  Enter name
                                </label>
                              </div>
                            </div>
                            <div className="col-md">
                              <div className="form-floating">
                                <select
                                  className="form-select"
                                  id="updatepropertyType"
                                  aria-label="Select type"
                                  // value={this.state.formproperty.type}
                                  // onChange={this.updateType}
                                >
                                  <option value="DOMAIN">Domain</option>
                                  <option value="APPLICATION">
                                    Application
                                  </option>
                                  <option value="ADAPTATION">Adaptation</option>
                                </select>
                                <label htmlFor="newpropertyType">
                                  Select property type
                                </label>
                              </div>
                            </div>
                            <div className="col-md">
                              <div className="form-floating">
                                <select
                                  className="form-select"
                                  id="updatepropertyType"
                                  aria-label="Select type"
                                  // value={this.state.formproperty.stateAccept}
                                  // onChange={this.updateStateAccept}
                                >
                                  <option value="ACTIVE">Active</option>
                                  <option value="PENDING">Pending</option>
                                  <option value="DISABLED">Disabled</option>
                                </select>
                                <label htmlFor="newpropertyType">
                                  Select property state
                                </label>
                              </div>
                            </div>
                          </div>
                          <br />
                          <div className="row">
                            <div className="col-md">
                              <div className="form-floating">
                                <textarea
                                  className="form-control"
                                  placeholder="Enter abstract syntax"
                                  id="updatepropertyAbSy"
                                  style={{ height: "100px" }}
                                  // value={this.state.formproperty.abstractSyntax}
                                  // onChange={this.updateAbstractSyntax}
                                ></textarea>
                                <label htmlFor="newpropertyAbSy">
                                  Enter abstract syntax
                                </label>
                              </div>
                            </div>
                            <div className="col-md">
                              <div className="form-floating">
                                <textarea
                                  className="form-control"
                                  placeholder="Enter Concrete syntax"
                                  id="updatepropertyCoSy"
                                  style={{ height: "100px" }}
                                  // value={this.state.formproperty.concreteSyntax}
                                  // onChange={this.updateConcreteSyntax}
                                ></textarea>
                                <label htmlFor="newpropertyCoSy">
                                  Enter concrete syntax
                                </label>
                              </div>
                            </div>
                          </div>
                          <br />
                          <div className="row">
                            <div className="col-md">
                              <button
                                type="button"
                                className="btn form-control btn-secondary"
                                onClick={this.clearForm}
                              >
                                Cancel
                              </button>
                            </div>
                            <div className="col-md">
                              <button
                                type="button"
                                className="btn form-control btn-Variamos"
                                // onClick={this.updateproperty}
                                id="btnUpdateproperty"
                              >
                                Update
                              </button>
                              <button
                                id="btnUpdateLoading"
                                className="btn form-control btn-Variamos hidden"
                                type="button"
                              >
                                Updating property... &nbsp;&nbsp;
                                <span
                                  className="spinner-border spinner-border-sm "
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        className="tab-pane fade"
                        id="nav-createproperty"
                        role="tabpanel"
                        aria-labelledby="nav-createproperty-tab"
                      >
                        <br />
                        <div className="container">
                          <div className="row">
                            <div className="col-md">
                              <div className="form-floating">
                                <select
                                  className="form-select"
                                  id="newPropertySelectType"
                                  aria-label="Select property type"
                                  // value={this.state.formproperty.type}
                                  onChange={this.selectTypeChange}
                                >
                                  <option value="String">String</option>
                                  {/* <option value="Number">Number</option> */}
                                  <option value="Text">Text</option>
                                  <option value="Boolean">Checkbox</option>
                                  <option value="Select">Select</option>
                                </select>
                                <label htmlFor="newPropertySelectType">
                                  Select property type
                                </label>
                              </div>
                            </div>
                            <div className="col-md">
                              <div className="form-floating">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="property name"
                                  id="newPropertyName"
                                  value={this.state.propertyName}
                                  onChange={this.selectNameChange}
                                />
                                <label htmlFor="newPropertyName">
                                  Enter name
                                </label>
                              </div>
                            </div>
                          </div>
                          <br />
                          <div
                            className="row"
                            hidden={this.state.enabledOptionList}
                          >
                            <div className="col-md">
                              <div className="form-floating">
                                <textarea
                                  className="form-control"
                                  placeholder="Enter options list"
                                  id="newPropertyOptionList"
                                  style={{ height: "100px" }}
                                  value={this.state.propertyOptions}
                                  onChange={this.selectOptionListChange}
                                ></textarea>
                                <label htmlFor="newPropertyOptionList">
                                  Enter option list
                                </label>
                              </div>
                            </div>
                          </div>
                          <br />

                          <div className="row">
                            <div className="col-md">
                              <button
                                type="button"
                                className="btn form-control btn-secondary"
                                onClick={this.clearForm}
                              >
                                Cancel
                              </button>
                            </div>
                            <div className="col-md">
                              <button
                                type="button"
                                className="btn form-control btn-Variamos"
                                onClick={this.createProperty}
                                id="btnCreateproperty"
                              >
                                Create
                              </button>
                              <button
                                id="btnCreateLoading"
                                className="btn form-control btn-Variamos hidden"
                                type="button"
                              >
                                Creating property... &nbsp;&nbsp;
                                <span
                                  className="spinner-border spinner-border-sm "
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
