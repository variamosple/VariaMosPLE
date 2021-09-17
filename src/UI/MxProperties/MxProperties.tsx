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
    for (let p = 0; p < this.currentObject.properties.length; p++) {
      if(this.currentObject.properties[p].name==name){
          this.currentObject.properties[p].value=value;
      } 
    }  
    let values = this.state.values;
    values[name] = value;
    this.setState({
      values: values
    })
  }

  input_onChange(e: any) {
    let name = e.target.attributes["data-name"].value;
    let value = e.target.value;
    for (let p = 0; p < this.currentObject.properties.length; p++) {
      if(this.currentObject.properties[p].name==name){
          this.currentObject.properties[p].value=value;
      } 
    }  
    let values = this.state.values;
    values[name] = value;
    this.setState({
      values: values
    })
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
        let elementDef: any =
          languageDefinition.abstractSyntax.elements[this.currentObject.type];
        for (let i = 0; i < elementDef.properties.length; i++) {
          const property: any = elementDef.properties[i];
          let value = null;
          let exists=false;
          for (let p = 0; p < this.currentObject.properties.length; p++) {
            if(this.currentObject.properties[p].name==property.name){
                value=this.currentObject.properties[p].value;
                exists=true;
                break;
            } 
          } 
          if (!exists) {
            this.currentObject.properties.push(new Property(property.name, value)) ;
          } 
          this.state.values[property.name] = value
          ret.push(this.createControl(property, value));
        }
      }
    }
    return ret;
  }

  createControl(property: any, value: any) {
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
      <div>
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
