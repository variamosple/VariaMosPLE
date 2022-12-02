// import { timeStamp } from "console";
import React, { Component } from "react";
// import mx from "../MxGEditor/mxgraph";
// import { mxGraph, mxGraphModel } from "mxgraph";
import ProjectService from "../../Application/Project/ProjectService";

import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
// import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";
import CustomProperties from "./CustomProperties";
import "./PropertiesMenu.css";
import * as alertify from "alertifyjs";
import SuggestionInput from "../SuggestionInput/SuggestionInput";

interface Props {
  projectService: ProjectService;
}
interface State {
  values: any[];
  propertyName: string;
  propertyLastName: string;
  propertyDomain: string;
  propertyPossibleValues: string;
  propertyComment: string;
  customPropertyFlag: boolean;
  customPropertyCreateFlag: boolean;
  customPropertyUpdateFlag: boolean;
  currentCustomProperty: any;
}

export default class MxProperties extends Component<Props, State> {
  containerRef: any;
  currentModel?: Model;
  currentObject?: any;
  elementDefinition?: any;

  constructor(props: Props) {
    super(props);
    this.containerRef = React.createRef();

    this.state = {
      values: [],
      propertyName: "",
      propertyLastName: "",
      propertyDomain: "String",
      propertyPossibleValues: "",
      propertyComment: "",
      customPropertyFlag: true,
      customPropertyCreateFlag: true,
      customPropertyUpdateFlag: true,
      currentCustomProperty: {},
    };

    this.projectService_addNewProductLineListener =
      this.projectService_addNewProductLineListener.bind(this);
    this.projectService_addSelectedModelListener =
      this.projectService_addSelectedModelListener.bind(this);
    this.projectService_addSelectedElementListener =
      this.projectService_addSelectedElementListener.bind(this);

    this.checkBox_onChange = this.checkBox_onChange.bind(this);
    this.input_onChange = this.input_onChange.bind(this);

    this.newCustomPropertyForm = this.newCustomPropertyForm.bind(this);
    this.createCustomProperty = this.createCustomProperty.bind(this);
    this.updateCustomPropertyForm = this.updateCustomPropertyForm.bind(this);
    this.updateCustomProperty = this.updateCustomProperty.bind(this);
    this.deleteCustomProperty = this.deleteCustomProperty.bind(this);

    this.clearForm = this.clearForm.bind(this);
    this.selectNameChange = this.selectNameChange.bind(this);
    this.selectDomainChange = this.selectDomainChange.bind(this);
    this.selectCommentChange = this.selectCommentChange.bind(this);
    this.selectPossibleValuesChange =
      this.selectPossibleValuesChange.bind(this);
    this.customPropertySelected = this.customPropertySelected.bind(this);
  }

  projectService_addNewProductLineListener(e: any) {
    this.forceUpdate();
  }

  projectService_addSelectedModelListener(e: any) {
    this.currentObject = null;
    this.currentModel = e.model;
    this.forceUpdate();
  }

  projectService_addSelectedElementListener(e: any) {
    this.currentModel = e.model;
    this.currentObject = e.element;
    this.forceUpdate();
  }

  checkBox_onChange(e: any) {
    let name = e.target.attributes["data-name"].value;
    let value = e.target.checked;
    this.property_onChange(name, value);
  }

  input_onChange(e: any) {
    let name=null;
    if(e.target.attributes){
      name = e.target.attributes["data-name"].value;
    }
    else if(e.target.props){
      name = e.target.props["data-name"];
    }
    let value = e.target.value;
    this.property_onChange(name, value);
  }

  property_onChange(name: any, value: any) {
    let me = this;
    if (name === "Name") {
      this.currentObject.name = value;
    } else {
      for (let p = 0; p < this.currentObject.properties.length; p++) {
        if (this.currentObject.properties[p].name === name) {
          this.currentObject.properties[p].value = value;
        }
      }
    }

    let values = this.state.values;
    values[name] = value;
    this.setState({
      values: values,
    });
    if (this.elementDefinition.properties) {
      for (let i = 0; i < this.elementDefinition.properties.length; i++) {
        const property: any = this.elementDefinition.properties[i];
        if (name === property.name) {
          if (property.enable_properties) {
            this.showLinkedProperties(property.name, value);
          }
          break;
        }
      }
    }

    me.props.projectService.raiseEventUpdatedElement(
      me.currentModel,
      me.currentObject
    );
  }

  showLinkedProperties(propertyName: any, value: any) {
    if (this.elementDefinition.properties) {
      for (let i = 0; i < this.elementDefinition.properties.length; i++) {
        const property: any = this.elementDefinition.properties[i];
        if (property.linked_property) {
          if (property.linked_property === propertyName) {
            let ele = document.getElementById("prop_" + property.name);
            if (property.linked_value === value) {
              ele.style.display = "block";
            } else {
              ele.style.display = "none";
            }
          }
        }
      }
    }
  }

  componentDidMount() {
    let me = this;
    me.props.projectService.addNewProductLineListener(
      this.projectService_addNewProductLineListener
    );
    me.props.projectService.addSelectedModelListener(
      this.projectService_addSelectedModelListener
    );
    me.props.projectService.addSelectedElementListener(
      this.projectService_addSelectedElementListener
    );
  }

  newCustomPropertyForm() {
    this.setState({
      customPropertyFlag: false,
      customPropertyCreateFlag: false,
    });
  }

  updateCustomPropertyForm() {
    this.setState({
      propertyName: this.state.currentCustomProperty.name,
      propertyDomain: this.state.currentCustomProperty.type,
      propertyPossibleValues: this.state.currentCustomProperty.possibleValues,
      propertyComment: this.state.currentCustomProperty.comment,
      customPropertyFlag: false,
      customPropertyCreateFlag: true,
      customPropertyUpdateFlag: false,
    });
  }

  nullValidate(): boolean {
    if (this.state.propertyName === "") {
      alertify.error("Name property is required");
      document.getElementById("newPropertyOptionList")?.focus();
      return false;
    }
    return true;
  }

  validatePropertyExist(func?: string): boolean {
    if (
      func === "update" &&
      this.state.propertyLastName === this.state.propertyName
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

  createCustomProperty() {
    if (!this.nullValidate()) return false;
    if (!this.validatePropertyExist()) return false;

    this.currentObject.properties.push(
      new Property(
        this.state.propertyName,
        null,
        this.state.propertyDomain,
        null,
        null,
        null,
        true,
        true,
        this.state.propertyComment,
        this.state.propertyPossibleValues
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

  updateCustomProperty() {
    for (let i = 0; i < this.currentObject?.properties.length; i++) {
      if (
        this.currentObject.properties[i].id ===
        this.state.currentCustomProperty.id
      ) {
        console.log(this.currentObject.properties[i]);
        console.log(this.state.currentCustomProperty);
        this.currentObject.properties[i].name = this.state.propertyName;

        this.currentObject.properties[i].type = this.state.propertyDomain;
        this.currentObject.properties[i].possibleValues =
          this.state.propertyPossibleValues;
        this.currentObject.properties[i].comment = this.state.propertyComment;

        this.setState({
          currentCustomProperty: this.currentObject.properties[i],
        });

        this.props.projectService.saveProject();
        this.props.projectService.raiseEventUpdatedElement(
          this.currentModel,
          this.currentObject
        );

        alertify.success("Property updated successfully");
        this.clearForm();
        return;
      }
    }
  }

  deleteCustomProperty() {
    this.currentObject.properties = this.currentObject.properties.filter(
      (property: Property) =>
        property.id !== this.state.currentCustomProperty.id
    );

    this.props.projectService.saveProject();
    this.props.projectService.raiseEventUpdatedElement(
      this.currentModel,
      this.currentObject
    );

    alertify.success("Property deleted successfully");
    this.clearForm();
  }

  clearForm() {
    this.setState({
      propertyName: "",
      propertyLastName: "",
      propertyDomain: "String",
      propertyPossibleValues: "",
      propertyComment: "",
      customPropertyFlag: true,
      customPropertyCreateFlag: true,
      customPropertyUpdateFlag: true,
      currentCustomProperty: {},
    });
  }

  customPropertySelected(Property: any) {
    this.setState({
      currentCustomProperty: Property,
    });
  }

  selectNameChange(event: any) {
    const lastNameProperty = this.state.propertyName;
    this.setState({
      propertyLastName: lastNameProperty,
      propertyName: event.target.value,
    });
  }

  selectDomainChange(event: any) {
    this.setState({
      propertyDomain: event.target.value,
    });
  }

  selectCommentChange(event: any) {
    this.setState({
      propertyComment: event.target.value,
    });
  }

  selectPossibleValuesChange(event: any) {
    this.setState({
      propertyPossibleValues: event.target.value,
    });
  }

  renderProperties() {
    let ret = [];
    if (this.currentObject) {
      let concreteSyntaxElement:any=null;
      let languageDefinition: any =
        this.props.projectService.getLanguageDefinition(
          "" + this.currentModel?.name
        );
      if (languageDefinition) {
        if (
          languageDefinition.abstractSyntax.elements[this.currentObject.type]
        ) {
          this.elementDefinition =
            languageDefinition.abstractSyntax.elements[this.currentObject.type];
        } else if (
          languageDefinition.abstractSyntax.relationships[
          this.currentObject.type
          ]
        ) {
          this.elementDefinition =
            languageDefinition.abstractSyntax.relationships[
            this.currentObject.type
            ];
        }

        if (
          languageDefinition.concreteSyntax.elements[this.currentObject.type]
        ) {
          concreteSyntaxElement =
            languageDefinition.concreteSyntax.elements[this.currentObject.type];
        } else if (
          languageDefinition.concreteSyntax.relationships[
          this.currentObject.type
          ]
        ) {
          concreteSyntaxElement =
            languageDefinition.concreteSyntax.relationships[
            this.currentObject.type
            ];
        }
 
        let property = {
          name: "Name",
          type: "String",
        };
        this.state.values["Name"] = this.currentObject.name;
        ret.push(this.createControl(property, this.currentObject.name, true, concreteSyntaxElement));
        if (this.elementDefinition.properties) {
          for (let i = 0; i < this.elementDefinition.properties.length; i++) {
            let property: any = this.elementDefinition.properties[i];
            let index = -1;
            for (let p = 0; p < this.currentObject.properties.length; p++) {
              if (this.currentObject.properties[p].name == property.name) {
                this.currentObject.properties[p].type = property.type;
                this.currentObject.properties[p].options = property.options;
                this.currentObject.properties[p].linked_property =
                  property.linked_property;
                this.currentObject.properties[p].linked_value =
                  property.linked_value;
                index = p;
                break;
              }
            }
            if (index == -1) {
              this.currentObject.properties.push(
                new Property(
                  property.name,
                  null,
                  property.type,
                  property.options,
                  property.linked_property,
                  property.linked_value,
                  false,
                  true,
                  property.comment,
                  property.possibleValues
                )
              );
              index = this.currentObject.properties.length - 1;
            }
            this.state.values[property.name] =
              this.currentObject.properties[index].value;
            if (property.linked_property) {
              if (
                this.state.values[property.linked_property] ==
                property.linked_value
              ) {
                this.currentObject.properties[index].display = true;
              } else {
                this.currentObject.properties[index].display = false;
              }
            }
            //ret.push(this.createControl(this.currentObject.properties[index], this.currentObject.properties[index].value, display));
          }
        }
        for (let p = 0; p < this.currentObject.properties.length; p++) {
          let pr = this.currentObject.properties[p];
          this.state.values[pr.name] = pr.value;
          ret.push(
            this.createControl(
              this.currentObject.properties[p],
              this.currentObject.properties[p].value,
              this.currentObject.properties[p].display, 
              concreteSyntaxElement
            )
          );
        }
      }
    }
    return ret;
  }

  createControl(property: any, value: any, display: any, concreteSyntax: any) {
    let control: any;
    let style = null;
    if (display) {
      style = { display: "block" };
    } else {
      style = { display: "none" };
    }
    let titleToolTip =
      "Name: " +
      property.name +
      "\n Domain: " +
      property.type +
      "\n PossibleValues: " +
      property.possibleValues +
      "\n Comment: " +
      property.comment;

    switch (property.type) {
      case "Select":
        let options = [];
        for (let i = 0; i < property.options.length; i++) {
          const option = property.options[i];
          if (option === value) {
            options.push(
              <option
                className="form-check-input"
                data-name={property.name}
                value={option}
                selected
              >
                |{option}
              </option>
            );
          } else {
            options.push(
              <option
                className="form-check-input"
                data-name={property.name}
                value={option}
              >
                {option}
              </option>
            );
          }
        }
        control = (
          <select
            className="form-select"
            data-name={property.name}
            onChange={this.input_onChange}
          >
            {options}
          </select>
        );
        break;
      case "Text":
        control = (
          <textarea
            className="form-control"
            data-name={property.name}
            onChange={this.input_onChange}
            value={this.state.values[property.name]}
          />
        );
        break;
      case "Integer":
        if (
          property.possibleValues === undefined ||
          property.possibleValues === ""
        ) {
          control = (
            <input
              className="form-control"
              type="number"
              data-name={property.name}
              onChange={this.input_onChange}
              value={this.state.values[property.name]}
            />
          );
          break;
        }

        if (property.possibleValues.includes("..")) {
          const values: any = property.possibleValues.split("..");
          const min = values[0];
          const max = values[1];
          control = (
            <input
              className="form-control"
              type="number"
              min={min}
              max={max}
              data-name={property.name}
              onChange={this.input_onChange}
              value={this.state.values[property.name]}
            />
          );
          break;
        }

        if (property.possibleValues.includes(",")) {
          let options = property.possibleValues.split(",");
          for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (option === value) {
              options.push(
                <option data-name={property.name} value={option} selected>
                  {option}
                </option>
              );
            } else {
              options.push(
                <option data-name={property.name} value={option}>
                  {option}
                </option>
              );
            }
          }

          control = (
            <select
              className="form-select"
              data-name={property.name}
              onChange={this.input_onChange}
            >
              {options}
            </select>
          );
          break;
        }

        break;
      case "String":
        if (
          property.possibleValues === undefined ||
          property.possibleValues === ""
        ) {
          control = (
            <input
              className="form-control"
              type="text"
              title={titleToolTip}
              data-name={property.name}
              onChange={this.input_onChange}
              value={this.state.values[property.name]}
            />
          );
          break;
        }

        if (property.possibleValues.includes(",")) {
          let options = [];
          let possibleValues = property.possibleValues.split(",");
          for (let i = 0; i < possibleValues.length; i++) {
            const option = possibleValues[i];
            if (option === value) {
              options.push(
                <option data-name={property.name} value={option} selected>
                  {option}
                </option>
              );
            } else {
              options.push(
                <option data-name={property.name} value={option}>
                  {option}
                </option>
              );
            }
          }

          control = (
            <select
              className="form-select"
              data-name={property.name}
              onChange={this.input_onChange}
              title={titleToolTip}
            >
              {options}
            </select>
          );
          break;
        }
        break;
      case "Boolean":
        if (value === true) {
          control = (
            <input
              className="form-check-input"
              data-name={property.name}
              type="checkbox"
              title={titleToolTip}
              onChange={this.checkBox_onChange}
              checked={this.state.values[property.name]}
            />
          );
        } else {
          control = (
            <input
              className="form-check-input"
              data-name={property.name}
              type="checkbox"
              title={titleToolTip}
              onChange={this.checkBox_onChange}
              checked={this.state.values[property.name]}
            />
          );
        }
        break;
      case "Autocomplete":
        control = (
          <SuggestionInput
            className="form-control"
            data-name={property.name}
            onChange={this.input_onChange}
            value={this.state.values[property.name]}
            endPoint={this.getAutoCompleteEndPoint(property.name, concreteSyntax)}
          />
        );
        break;
    }
    return (
      <div
        id={"prop_" + property.name}
        style={style}
        onAuxClick={() => this.customPropertySelected(property)}
      >
        <label title={titleToolTip}>{property.name}</label>
        <br />
        {control}
        <hr style={{ marginTop: 10, color: "gray" }} />
      </div>
    );
  }

  getAutoCompleteEndPoint(propertyName: any, concreteSyntax: any){ 
     for (let i = 0; i < concreteSyntax.autocomplete_services.length; i++) {
      const item = concreteSyntax.autocomplete_services[i];
      if (item.property==propertyName) {
        return item.endpoint;
      }
     }
     return null;
  }

  render() {
    return (
      <div key="a" id="MxPalette" className="MxPalette">
        <div className="card-body bg-white-Variamos" id="renderProperties">
          <div hidden={this.state.customPropertyFlag}>
            <div className="row">
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
                  <label htmlFor="newPropertyName">Enter name</label>
                </div>
              </div>
            </div>
            <br />
            <div className="row">
              <div className="col-md">
                <div className="form-floating">
                  <select
                    className="form-select"
                    id="newPropertySelectDomain"
                    aria-label="Select property domain"
                    value={this.state.propertyDomain}
                    onChange={this.selectDomainChange}
                  >
                    <option value="String" selected>
                      String
                    </option>
                    <option value="Integer">Integer</option>
                    <option value="Boolean">Boolean</option>
                  </select>
                  <label
                    htmlFor="newPropertySelectDomain"
                    style={{ fontSize: 12 }}
                  >
                    Select property domain
                  </label>
                </div>
              </div>
            </div>
            <br />
            <div className="row">
              <div className="col-md">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="property possible values"
                    id="customPropertyPossibleValues"
                    value={this.state.propertyPossibleValues}
                    onChange={this.selectPossibleValuesChange}
                  />
                  <label htmlFor="customPropertyPossibleValues">
                    Enter possible values
                  </label>
                </div>
              </div>
            </div>
            <br />
            <div className="row">
              <div className="col-md">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="property comment"
                    id="customPropertyComment"
                    value={this.state.propertyComment}
                    onChange={this.selectCommentChange}
                  />
                  <label htmlFor="customPropertyComment">Enter comment</label>
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
                  onClick={this.createCustomProperty}
                  id="btnCreateproperty"
                  hidden={this.state.customPropertyCreateFlag}
                >
                  Create
                </button>
                <button
                  type="button"
                  className="btn form-control btn-Variamos"
                  onClick={this.updateCustomProperty}
                  id="btnUpdatepFroperty"
                  hidden={this.state.customPropertyUpdateFlag}
                >
                  Update
                </button>
              </div>
            </div>
            <br />
          </div>
          {this.renderProperties()}
          <ul className="dropdown-menu" id="properties-menu">
            <li>
              <span
                className={"dropdown-item"}
                id="newCustomProperty"
                onClick={this.newCustomPropertyForm}
              >
                New property
              </span>
            </li>
            <li>
              <span
                className="dropdown-item"
                hidden={!this.state.currentCustomProperty.custom}
                id="renameItem"
                onClick={this.updateCustomPropertyForm}
              >
                Update
              </span>
            </li>
            <li>
              <span
                className="dropdown-item"
                hidden={!this.state.currentCustomProperty.custom}
                id="deleteItem"
                // data-bs-toggle="modal"
                // data-bs-target="#deleteModal"
                onClick={this.deleteCustomProperty}
              >
                Delete
              </span>
            </li>
          </ul>
        </div>

        <CustomProperties
          projectService={this.props.projectService}
          currentObject={this.currentObject}
        />
      </div>
    );
  }
}
