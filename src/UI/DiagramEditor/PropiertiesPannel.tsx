import React, { Component } from "react";
import ProjectService from "../../Infraestructure/Project/ProjectService";

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
              <h5 className="card-title">...</h5>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default PropiertiesPannel;
