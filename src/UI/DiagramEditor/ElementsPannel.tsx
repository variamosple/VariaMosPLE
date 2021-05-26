import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import MxPalette from "../MxPalette/MxPalette";

interface Props {
  projectService: ProjectService
}
interface State {}

class ElementsPannel extends Component<Props, State> {
  state = {};

  // constructor(props: Props) {
  //     super(props); 
  // }

  render() {
    return (
      <div id="ElementsPannel" className="col-sm-12 h-50">
        <div className="col-sm-12 h-100">
          <div className="card text-center h-100 shadow-sm bg-body rounded">
            <div className="card-header">
              Elements
            </div>
            <div className="card-body bg-white-Variamos">
              <MxPalette projectService={this.props.projectService} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ElementsPannel;
