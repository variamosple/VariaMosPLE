import React, { Component } from "react";

import ProjectService from "../../Application/Project/ProjectService";

interface Props {
  projectService: ProjectService;
}
interface State {}

class navBar extends Component<Props, State> {
  state = {};

  constructor(props: any) {
    super(props);

    this.exportProject = this.exportProject.bind(this);
    this.refreshNavBar = this.refreshNavBar.bind(this);
  }

  exportProject() {
    this.props.projectService.exportProject();
  }

  refreshNavBar() {
    this.forceUpdate();
  }

  render() {
    return (
      <div
        className="row distribution-variamos background-variamos"
        style={{ height: "4vh", zIndex: 5 }}
      >
        <div className="col d-flex justify-content-start">
          <ul className="list-group list-group-horizontal">
            <li className="list-group-item nav-bar-variamos">
              <span
                className="bi bi-box-arrow-left shadow rounded"
                id="hiddenProject"
              ></span>
            </li>
          </ul>
        </div>
        <div className="col d-flex justify-content-center">
          <ul className="list-group list-group-horizontal">
            <li
              className="list-group-item nav-bar-variamos"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              title="Home"
            >
              <span>
                <a
                  className="bi bi-house-door shadow rounded"
                  href="https://variamos.com/home/variamos-web/"
                  target="_blank"
                >
                  {/* Home */}
                </a>
              </span>
            </li>

            <li
              className="list-group-item nav-bar-variamos"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              title="View docs"
            >
              <span>
                <a
                  className="bi bi-file-richtext shadow rounded"
                  href="https://github.com/VariaMosORG/VariaMos/wiki"
                  target="_blank"
                >
                  {/* Docs */}
                </a>
              </span>
            </li>
            <li
              className="list-group-item nav-bar-variamos"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              title="Download project"
            >
              <span
                onClick={this.exportProject}
                className="bi bi-download shadow rounded"
              >
                {/* Export Project */}
              </span>
            </li>
            <li
              className="list-group-item nav-bar-variamos"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              title="Project management"
            >
              <button
                type="button"
                data-bs-toggle="modal"
                data-bs-target="#staticBackdrop"
                className="nav-bar-variamos"
                id="projectManagement"
                hidden={true}
              >
                Project Management
              </button>
              <span
                onClick={() =>
                  document.getElementById("projectManagement").click()
                }
                className="bi bi-gear shadow rounded"
              >
                {/* Project Management */}
              </span>
            </li>
          </ul>
        </div>
        <div className="col d-flex justify-content-end">
          <ul className="list-group list-group-horizontal">
            <li
              className="list-group-item nav-bar-variamos"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              title="User setting"
            >
              <span
                className="bi bi-person-bounding-box shadow rounded"
                id="userSetting"
              ></span>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

export default navBar;
