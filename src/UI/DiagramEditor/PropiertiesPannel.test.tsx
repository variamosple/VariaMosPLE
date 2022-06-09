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
              
              {/* <div className="float-end" id="customPropertiesBtn">
                <ul className="list-group list-group-horizontal">
                  <li
                    className="list-group-item nav-bar-variamos"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    title="Custom properties setting"
                    style={{ paddingTop: "0px", paddingBottom: "0px" }}
                  >
                    <span
                      onClick={() =>
                        document
                          .getElementById("customPropertiesSettingsBtn")
                          .click()
                      }
                      className="bi bi-node-plus shadow rounded"
                    ></span>
                  </li>
                </ul>
              </div> */}
            </div>

            <div >
              <MxProperties projectService={this.props.projectService} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default PropiertiesPannel;
