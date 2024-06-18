import React, { Component } from "react";

import { IoMdTrash } from 'react-icons/io';
import { MdEdit } from "react-icons/md";


interface Props {
  className: string,
  onConfigurationSelected?: any
}
interface State {
  projects: any[],
}

class ConfigurationManagement extends Component<Props, State> { 

  constructor(props: any) {
    super(props);
    this.state = {
      projects: [
        {
          id: "Configuration 1",
          name: "Configuration 1"
        },
        {
          id: "Configuration 2",
          name: "Configuration 2"
        }
      ]
    }
  }

  btnProject_onClic(e){
      if(this.props.onConfigurationSelected){
        this.props.onConfigurationSelected({
          target:this,
          value: "Configuration 1"
        })
      }
  }

  btnDeleteProject_onClic(e){

  }

  renderProjects() {
    let elements = [];
    if (this.state.projects) {
      for (let i = 0; i < this.state.projects.length; i++) {
        let project = this.state.projects[i];
        const element = (
          <li>
            <a title="Change name" href="#" className="link-project" data-id={project.id} onClick={this.btnProject_onClic.bind(this)}><MdEdit /></a>
            <a title="Delete" href="#" className="link-project" data-id={project.id} onClick={this.btnDeleteProject_onClic.bind(this)}><IoMdTrash /></a>
            <a href="#" className="link-project" data-id={project.id} onClick={this.btnProject_onClic.bind(this)}>{project.name}</a>
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
