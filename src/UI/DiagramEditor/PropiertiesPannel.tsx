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
      <div id="PropiertiesPannel" style={{ height: "60vh"}}>
        <div className="col-sm h-100 distribution-variamos">
          <div className="card text-center h-100 distribution-variamos shadow-sm bg-body rounded" style={{overflow:"auto"}}>
            <button
              type="button"
              data-bs-toggle="modal"
              data-bs-target="#customPropertiesSettings"
              id="customPropertiesSettingsBtn"
              hidden={true}
            >
              Custom properties button
            </button>
            <div className="card-header background-variamos">
              Propierties 
            </div> 
            <div >
               <MxProperties projectService={this.props.projectService} model={null} item={null} /> 
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default PropiertiesPannel;
