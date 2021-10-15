// import { timeStamp } from "console";
import React, { Component } from "react";
// import mx from "../MxGEditor/mxgraph";
// import { mxGraph, mxGraphModel } from "mxgraph";
import ProjectService from "../../Application/Project/ProjectService";

import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
// import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";
import CustomProperties from "./CustomProperties";

interface Props {
  projectService: ProjectService;
}
interface State {
  values: any[];
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
    };

    this.projectService_addNewProductLineListener =
      this.projectService_addNewProductLineListener.bind(this);
    this.projectService_addSelectedModelListener =
      this.projectService_addSelectedModelListener.bind(this);
    this.projectService_addSelectedElementListener =
      this.projectService_addSelectedElementListener.bind(this);

    this.checkBox_onChange = this.checkBox_onChange.bind(this);
    this.input_onChange = this.input_onChange.bind(this);
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
    let name = e.target.attributes["data-name"].value;
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

  renderProperties() {
    let ret = [];
    if (this.currentObject) {
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
        let property = {
          name: "Name",
          type: "String",
        };
        this.state.values["Name"] = this.currentObject.name;
        ret.push(this.createControl(property, this.currentObject.name, true));
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
          ret.push(
            this.createControl(
              this.currentObject.properties[p],
              this.currentObject.properties[p].value,
              this.currentObject.properties[p].display
            )
          );
        }
      }
    }
    return ret;
  }

  createControl(property: any, value: any, display: any) {
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
    }
    return (
      <div id={"prop_" + property.name} style={style}>
        <label title={titleToolTip}>{property.name}</label>
        <br />
        {control}
        <hr style={{ marginTop: 10, color: "gray" }} />
      </div>
    );
  }

  render() {
    return (
      <div key="a" className="MxPalette">
        <ul
          className="list-group list-group-horizontal justify-content-center background-variamos"
          // style={{
          //   marginTop: -23,
          //   borderTopStyle: "double",
          // }}
          id="PropertyFunctionsPanel"
          hidden={false}
        >
          <li
            className="list-group-item icon-dark-variamos"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            title="Update property"
            // onClick={this.activeUpdate}
            style={{
              paddingBottom: "1px",
            }}
            hidden={false}
          >
            <span
              className="bi bi-pencil-square shadow "
              id="updateproperty"
            ></span>
          </li>
          <li
            className="list-group-item icon-dark-variamos"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            title="Delete property"
            // onClick={this.activeDelete}
            style={{
              paddingBottom: "1px",
            }}
            hidden={false}
          >
            <span className="bi bi-trash shadow " id="deleteproperty"></span>
            <span
              className="hidden"
              id="deleteViewModalproperty"
              data-bs-toggle="modal"
              data-bs-target="#modalDeleteProperty"
            ></span>
          </li>
          <li
            className="list-group-item icon-dark-variamos"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            title="New property"
            style={{
              paddingBottom: "1px",
            }}
            // onClick={this.activeCreate}
          >
            <span className="bi bi-plus-circle shadow" id="newproperty"></span>
          </li>
        </ul>
        <br />
        <div className="card-body bg-white-Variamos">
          {this.renderProperties()}
        </div>

        <CustomProperties
          projectService={this.props.projectService}
          currentObject={this.currentObject}
        />
      </div>
    );
  }
}
