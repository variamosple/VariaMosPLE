import React, { Component } from "react";

import ProjectService from "../../Application/Project/ProjectService";
import { getUserProfile, logoutUser } from "../SignUp/SignUp.utils";

//Dependencies for the query modal
import QueryModal from "../Queries/queryModal";
import "./NavBar.css";

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
      <div className="NavBar">
        <div className="header">
          <a title="Save project" onClick={this.exportProject}><span><img src="/images/menuIcons/save.png"></img></span></a>{" "}
          <a title="Queries" onClick={() => this.handleShowQueryModal()}><span><img src="/images/menuIcons/queries.png"></img></span></a>{" "}
          <a title="Project management" onClick={() =>
            document.getElementById("projectManagement").click()
          }><span><img src="/images/menuIcons/open.png"></img></span></a>{" "}
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
        </div>
        <div>
          <QueryModal show={this.state.show_query_modal} handleCloseCallback={this.handleCloseQueryModal} projectService={this.props.projectService} />
        </div>
      </div>
    );
  }
}

export default navBar;
