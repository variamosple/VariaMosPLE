/* eslint-disable no-restricted-globals */
import React, { Component } from "react";

import { IoMdTrash } from 'react-icons/io';
import { MdEdit } from "react-icons/md";
import ProjectService from "../../Application/Project/ProjectService";
import { ConfigurationInformation } from "../../Domain/ProductLineEngineering/Entities/ConfigurationInformation";


interface Props {
  className: string,
  onConfigurationSelected?: any;
  projectService: ProjectService;
  reload?: boolean;
}
interface State {
  configurations?: ConfigurationInformation[],
}

class ConfigurationManagement extends Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      configurations: null
    }
  }

  componentDidMount(): void {
    this.getAllConfigurations();
  }

  // componentDidUpdate(prevProps) {
  //   // Verificar si una propiedad específica ha cambiado
  //   if (this.props.reload !== prevProps.reload) {
  //     if (this.props.reload) {
  //       this.getAllConfigurations();
  //     }
  //   }
  // }

  getAllConfigurations() {
    this.props.projectService.getAllConfigurations(this.getAllConfigurationsSuccessCallback.bind(this), this.getAllConfigurationsErrorCallback.bind(this));
  }

  getAllConfigurationsSuccessCallback(e) {
    let me = this;
    this.setState({ configurations: e });
  }

  getAllConfigurationsErrorCallback(e) {
    let me = this;
  }

  btnConfiguration_onClic(e) {
    e.preventDefault();
    let id=e.target.attributes["data-id"].value;
    if (this.props.onConfigurationSelected) {
      this.props.onConfigurationSelected({
        target: this,
        value: id
      })
    } 
    this.props.projectService.applyConfigurationInServer(id);
  }

  btnEditConfiguration_onClic(e) {
    e.preventDefault(); 
  }

  btnDeleteConfiguration_onClic(e) {
    e.preventDefault(); 
    if (!confirm("¿Do you really want to delete the configuration?")) {
      return;
    }
    let htmlElement=e.target;
    while (!htmlElement.attributes["data-id"]) {
      htmlElement=htmlElement.parentElement;
    }
    let id=htmlElement.attributes["data-id"].value;
    if (this.props.onConfigurationSelected) {
      this.props.onConfigurationSelected({
        target: this,
        value: id
      })
    } 
    this.props.projectService.deleteConfigurationInServer(id);
  } 

  renderProjects() {
    let elements = [];
    if (this.state.configurations) {
      for (let i = 0; i < this.state.configurations.length; i++) {
        let configurations = this.state.configurations[i];
        const element = (
          <li>
            {/* <a title="Change name" href="#" className="link-project" data-id={configurations.id} onClick={this.btnEditConfiguration_onClic.bind(this)}><MdEdit /></a> */}
            <a title="Delete" href="#" className="link-project" data-id={configurations.id} onClick={this.btnDeleteConfiguration_onClic.bind(this)}><IoMdTrash /></a>
            <a href="#" className="link-project" data-id={configurations.id} onClick={this.btnConfiguration_onClic.bind(this)}>{configurations.name}</a>
          </li>
        );
        elements.push(element);
      }
    }
    return (
      <ul>{elements}</ul>
    )
  }

  render() {
    return (
      <div className={this.props.className}>
        {this.renderProjects()}
      </div>
    );
  }
}

export default ConfigurationManagement;
