import React, { Component } from "react";
import DiagramEditor from "../DiagramEditor/DiagramEditor";
import ElementsPannel from "../DiagramEditor/ElementsPannel";
import PropiertiesPannel from "../DiagramEditor/PropiertiesPannel";
import ProjectManagement from "../ProjectManagement/ProjectManagement";
import TreeExplorer from "../TreeExplorer/TreeExplorer";
import NavBar from "./navBar";
import ProjectService from "../../Application/Project/ProjectService";


interface Props {}
interface State {}

class DashBoard extends Component<Props, State> {
  state = {};
  projectService: ProjectService = new ProjectService();

  // constructor(props: Props) {
  //   super(props);
  // }

  componentDidMount() {
  }

  render() {
    return (
      <div className="container-fluid">
        <NavBar />
        <ProjectManagement  projectService={this.projectService}/>
        <div className="row align-items-center" style={{ height: "92vh" }}>
          <TreeExplorer  projectService={this.projectService}/> 
          <DiagramEditor   projectService={this.projectService}/> 
          <div className="col-sm-2 distribution-variamos h-100">
            <ElementsPannel   projectService={this.projectService}/>
            <PropiertiesPannel   projectService={this.projectService}/>
          </div>
        </div>
      </div>
    );
  }
}

export default DashBoard;
