import React, { Component } from "react";
import ProjectService from "../../Infraestructure/project/ProjectService";
import MxPalette from "../MxPalette/MxPalette";

interface Props {
  projectService: ProjectService
}
interface State {}

class ElementsPannel extends Component<Props, State> {
  state = {};

  constructor(props: Props) {
      super(props); 
  }

  render() {
    return (
      <div id="ElementsPannel" className="col-sm-12 p-1 h-25">
        <div className="col-sm-12 h-100">
          <div className="card text-center h-100 shadow-sm p-1 bg-body rounded">
            <div className="card-header bg-lightblue-Variamos border-title-lighblue-variamos">
              Elements
            </div>
            <div className="card-body">
              <MxPalette projectService={this.props.projectService} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ElementsPannel;
