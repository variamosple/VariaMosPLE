import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import MxProperties from "../MxProperties/MxProperties";

interface Props {
  projectService: ProjectService
}
interface State {}

class PropiertiesPannel extends Component<Props, State> {
  state = {};

  render() {
    return (
      <div id="PropiertiesPannel" className="col-sm-12 h-50">
        <div className="col-sm-12 h-100">
          <div className="card text-center h-100 shadow-sm bg-body rounded">
            <div className="card-header">
              Propierties
            </div>
            <div className="card-body bg-white-Variamos">
              <MxProperties projectService={this.props.projectService} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default PropiertiesPannel;
