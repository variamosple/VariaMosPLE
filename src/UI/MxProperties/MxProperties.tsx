import { timeStamp } from "console";
import React, { Component } from "react";
// import mx from "../MxGEditor/mxgraph";
// import { mxGraph, mxGraphModel } from "mxgraph";
import ProjectService from "../../Application/Project/ProjectService";

import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
// import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";

interface Props {
  projectService: ProjectService;
}
interface State {
  values: any[]
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
      values: []
    }


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
    if (name == "Name") {
      this.currentObject.name = value;
    } else {
      for (let p = 0; p < this.currentObject.properties.length; p++) {
        if (this.currentObject.properties[p].name == name) {
          this.currentObject.properties[p].value = value;
        }
      }
    }
    let values = this.state.values;
    values[name] = value;
    this.setState({
      values: values
    })
    if (this.elementDefinition.properties) {
      for (let i = 0; i < this.elementDefinition.properties.length; i++) {
        const property: any = this.elementDefinition.properties[i];
        if (name == property.name) {
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
          if (property.linked_property == propertyName) {
            let ele = document.getElementById("prop_" + property.name);
            if (property.linked_value == value) {
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
        if (languageDefinition.abstractSyntax.elements[this.currentObject.type]) {
          this.elementDefinition = languageDefinition.abstractSyntax.elements[this.currentObject.type];
        }
        else if (languageDefinition.abstractSyntax.relationships[this.currentObject.type]) {
          this.elementDefinition = languageDefinition.abstractSyntax.relationships[this.currentObject.type];
        }
        let property = {
          name: "Name",
          type: "String"
        }
        this.state.values["Name"] = this.currentObject.name;
        ret.push(this.createControl(property, this.currentObject.name, null));
        if (this.elementDefinition.properties) {
          for (let i = 0; i < this.elementDefinition.properties.length; i++) {
            let property: any = this.elementDefinition.properties[i]; 
            let index = -1;
            for (let p = 0; p < this.currentObject.properties.length; p++) {
              if (this.currentObject.properties[p].name == property.name) { 
                this.currentObject.properties[p].type=property.type;
                this.currentObject.properties[p].options= property.options;
                this.currentObject.properties[p].linked_property= property.linked_property;
                this.currentObject.properties[p].linked_value = property.linked_value;
                index = p;
                break;
              }
            }
            if (index==-1) {
              this.currentObject.properties.push(new Property(property.name, null, property.type, property.options, property.linked_property, property.linked_value));
              index=this.currentObject.properties.length-1;
            }
            this.state.values[property.name] = this.currentObject.properties[index].value
            let display = null;
            if (property.linked_property) {
              if (this.state.values[property.linked_property] == property.linked_value) {
                display = { display: "block" };
              }
              else {
                display = { display: "none" };
              } 
            } 
            ret.push(this.createControl(this.currentObject.properties[index], this.currentObject.properties[index].value, display));
          }
        }
      }
    }
    return ret;
  }

  createControl(property: any, value: any, style: any) {
    let control: any;
    switch (property.type) {
      case "Select":
        let options = [];
        for (let i = 0; i < property.options.length; i++) {
          const option = property.options[i];
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
          <select data-name={property.name} onChange={this.input_onChange}>
            {options}
          </select>
        );
        break;
      case "Text":
        control = (
          <textarea
            data-name={property.name}
            onChange={this.input_onChange}
            value={this.state.values[property.name]}
          />
        );
        break;
      case "Boolean":
        if (value === true) {
          control = (
            <input
              data-name={property.name}
              type="checkbox"
              onChange={this.checkBox_onChange}
              checked={this.state.values[property.name]}
            />
          );
        } else {
          control = (
            <input
              data-name={property.name}
              type="checkbox"
              onChange={this.checkBox_onChange}
              checked={this.state.values[property.name]}
            />
          );
        }
        break;
      default:
        control = (
          <input
            type="text"
            data-name={property.name}
            onChange={this.input_onChange}
            value={this.state.values[property.name]}
          />
        );
        break;
    }
    return (
      <div id={"prop_" + property.name} style={style}>
        <label>{property.name}</label>
        <br />
        {control}
      </div>
    );
  }

  render() {
    return (
      <div key="a" className="MxPalette">
        {this.renderProperties()}
      </div>
    );
  }
}
