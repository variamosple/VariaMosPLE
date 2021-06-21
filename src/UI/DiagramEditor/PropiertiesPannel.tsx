import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import MxProperties from "../MxProperties/MxProperties";

interface Props {
  projectService: ProjectService;
}
interface State {}

class PropiertiesPannel extends Component<Props, State> {
  state = {};

  render() {
    return (
      <div id="PropiertiesPannel" style={{ height: "60vh" }}>
        <div className="col-sm h-100 distribution-variamos">
          <div className="card text-center h-100 distribution-variamos shadow-sm bg-body rounded">
            <div className="card-header">Propierties</div>
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
