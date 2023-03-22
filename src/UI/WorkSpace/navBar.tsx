import React, { Component } from "react";

import ProjectService from "../../Application/Project/ProjectService";
import { getUserProfile, logoutUser } from "../SignUp/SignUp.utils";

//Dependencies for the query modal
import QueryModal from "../Queries/queryModal";

interface Props {
  projectService: ProjectService;
}
interface State {
  firstName: string;
  show_query_modal: boolean;
}

class navBar extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      firstName: "",
      show_query_modal: false,
    }

    this.exportProject = this.exportProject.bind(this);
    this.refreshNavBar = this.refreshNavBar.bind(this);

    //modal functions binding
    this.handleShowQueryModal = this.handleShowQueryModal.bind(this);
    this.handleCloseQueryModal = this.handleCloseQueryModal.bind(this);
  }

  componentDidMount() {
    const userProfile = getUserProfile();

    if (userProfile) {
      this.setState({ firstName: userProfile.givenName })
    }
  }

  exportProject() {
    this.props.projectService.exportProject();
  }

  refreshNavBar() {
    this.forceUpdate();
  }

  handlerLogout() {
    logoutUser();
  }

  //Modal functions
  handleShowQueryModal() {
    this.setState({ show_query_modal: true });
  }

  handleCloseQueryModal() {
    this.setState({ show_query_modal: false });
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
              onClick={this.exportProject}
            >
              <span
                className="bi bi-download shadow rounded"
              >
                {/* Export Project */}
              </span>
            </li>
            <li title="Queries"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              className="list-group-item nav-bar-variamos"
              onClick={() => this.handleShowQueryModal()}
            >
              <span className="bi bi-tools shadow rounded">
                {/* Queries */}
              </span>
            </li>
            <li
              className="list-group-item nav-bar-variamos"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              title="Project management"
              onClick={() =>
                document.getElementById("projectManagement").click()
              }
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
              <span className="p-2">{this.state.firstName}</span>
            </li>
            <li
              className="list-group-item nav-bar-variamos"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              title="Logout"
              onClick={this.handlerLogout}
            >
              <span
                className="bi bi-box-arrow-in-right shadow rounded"
                id="logout"
              ></span>
            </li>
          </ul>
        </div>
        {/* Modal for query handling */}
        <QueryModal show={this.state.show_query_modal} handleCloseCallback={this.handleCloseQueryModal} projectService={this.props.projectService} />
      </div>
    );
  }
}

export default navBar;
