import { Component } from "react";

import ProjectService from "../../Application/Project/ProjectService";
import NewDialog from "../NewDialog/newDialog";
import OpenDialog from "../OpenDialog/openDialog";
import SaveDialog from "../SaveDialog/saveDialog";

import { SessionUser } from "@variamosple/variamos-components";
import { RoleEnum } from "../../Domain/ProductLineEngineering/Enums/roleEnum";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClone, faDownload, faFileCirclePlus, faFloppyDisk, faFolderOpen, faGear } from "@fortawesome/free-solid-svg-icons";

interface Props {
  projectService: ProjectService;
}
interface State {
  firstName: string;
  show_save_modal: boolean;
  show_open_modal: boolean;
  show_new_modal: boolean;
  user?: SessionUser;
}

class NavBar extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      firstName: "",
      show_save_modal: false,
      show_open_modal: false,
      show_new_modal: false,
    }

    this.exportProject = this.exportProject.bind(this);
    this.refreshNavBar = this.refreshNavBar.bind(this);
  }

  saveProject() {
    if (this.props.projectService.isGuessUser()) {
      this.exportProject();
      return;
    }
    const projectInfo = this.props.projectService.getProjectInformation();
    const currentUser = this.props.projectService.getUser();

    if (!projectInfo?.id || !currentUser) {
      this.handleShowSaveModal();
      return;
    }
    if (projectInfo.role === RoleEnum.OWNER || projectInfo.role === RoleEnum.EDITOR) {
      this.props.projectService.saveProjectInServer(projectInfo, null, null);
      return;
    }
    if (projectInfo.template) {
      alert("This project is a template. Saving a copy instead.");
      this.handleShowSaveModal();
      return;
    }
    alert("You don't have permission to save this project. Saving a copy instead.");
    this.handleShowSaveModal();
  }

  saveProjectAs() {
    if (this.props.projectService.isGuessUser()) {
      this.exportProject(); 
    }else{
      this.handleShowSaveModal();
    } 
  }

  newProject() {
    this.handleShowNewModal();
  }

  openProject() {
    this.handleShowOpenModal();
  }

  //Modal functions
  handleShowSaveModal() {
    this.setState({ show_save_modal: true });
  }

  handleCloseSaveModal() {
    this.setState({ show_save_modal: false });
  }

  handleShowOpenModal() {
    this.setState({ show_open_modal: true });
  }

  handleCloseOpenModal() {
    this.setState({ show_open_modal: false });
  }

  handleShowNewModal() {
    this.setState({ show_new_modal: true });
  }

  handleCloseNewModal() {
    this.setState({ show_new_modal: false });
  }

  exportProject() {
    this.props.projectService.exportProject();
  }

  refreshNavBar() {
    this.forceUpdate();
  }

  render() {
    return (
      <div className="NavBar">
        <div className="navbar">
          <button className="icon-btn" title="New project" onClick={this.newProject.bind(this)}>
            <FontAwesomeIcon icon={faFileCirclePlus} />
          </button>
          <button className="icon-btn" title="Open project" onClick={this.openProject.bind(this)}>
            <FontAwesomeIcon icon={faFolderOpen} />
          </button>
          <button className="icon-btn" title="Save project" onClick={this.saveProject.bind(this)}>
            <FontAwesomeIcon icon={faFloppyDisk} />
          </button>
          <button className="icon-btn" title="Save project as ..." onClick={this.saveProjectAs.bind(this)}>
            <FontAwesomeIcon icon={faClone} />
          </button>
          <button className="icon-btn" title="Download project" onClick={this.exportProject.bind(this)}>
            <FontAwesomeIcon icon={faDownload} />
          </button>
          <button className="icon-btn" title="Settings" onClick={() => document.getElementById("projectManagement").click()}>
            <FontAwesomeIcon icon={faGear} />
          </button>

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
        </div>
        <div>
          {this.state.show_save_modal ? (
            <SaveDialog show={this.state.show_save_modal} handleCloseCallback={this.handleCloseSaveModal.bind(this)} projectService={this.props.projectService} />
          ) : (
            null
          )}
        </div>
        <div>
          {this.state.show_open_modal ? (
            <OpenDialog show={this.state.show_open_modal} handleCloseCallback={this.handleCloseOpenModal.bind(this)} projectService={this.props.projectService} />
          ) : (
            null
          )}
        </div>
        <div>
          {this.state.show_new_modal ? (
            <NewDialog show={this.state.show_new_modal} handleCloseCallback={this.handleCloseNewModal.bind(this)} projectService={this.props.projectService} />
          ) : (
            null
          )}
        </div>
      </div>
    );
  }
}

export default NavBar;
