import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import { Project } from "../../Domain/ProductLineEngineering/Entities/Project";
import * as alertify from "alertifyjs";
import LanguageManagement from "./LanguageManagement";
import _config from "../../Infraestructure/config.json";

interface Props {
  projectService: ProjectService;
}
interface State {
  projectName: string;
  productLineName: string;
  importProject: string | undefined;
  version: string;
  urlVariamosDoc: string;
  urlVariamosLangDoc: string;
}

let classActive: string = "active";
let classActiveShow: string = "show active";

class ProjectManagement extends Component<Props, State> {
  _project?: Project;

  constructor(props: any) {
    super(props);
    this.state = {
      productLineName: "",
      projectName: this.props.projectService.project.name,
      importProject: "",
      version: _config.version,
      urlVariamosDoc: _config.urlVariamosDocumentation,
      urlVariamosLangDoc: _config.urlVariamosLangDocumentation,
    };
    this.loadProject();

    this.handleUpdateNameProject = this.handleUpdateNameProject.bind(this);
    this.handleUpdateNameProductLine =
      this.handleUpdateNameProductLine.bind(this);
    this.btnCreateProject_onClick = this.btnCreateProject_onClick.bind(this);
    this.btnSaveProject_onClick = this.btnSaveProject_onClick.bind(this);
    this.projectService_addListener =
      this.projectService_addListener.bind(this);
    this.handleImportProject = this.handleImportProject.bind(this);
    this.importProject = this.importProject.bind(this);
    this.onEnterSaveProject = this.onEnterSaveProject.bind(this);
    this.onEnterCreateProject = this.onEnterCreateProject.bind(this);
    this.onEnterFocusPL = this.onEnterFocusPL.bind(this);
  }

  handleImportProject(files: FileList | null) {
    if (files) {
      let selectedFile = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = reader.result?.toString().trim();
        this.setState({
          importProject: text,
        });
      };

      reader.readAsText(selectedFile);
    }
  }

  importProject() {
    this.props.projectService.importProject(this.state.importProject);
    document.getElementById("list-iProject-list")?.classList.remove("active");
    document.getElementById("list-iProject")?.classList.remove("active");
    document.getElementById("list-iProject")?.classList.remove("show");
    window.location.reload();
  }

  componentDidMount() {
    let me = this;
    me.props.projectService.addUpdateProjectListener(
      this.projectService_addListener
    );
  }

  projectService_addListener(e: any) {
    this.forceUpdate();
    this.loadProject();
  }

  loadProject() {
    if (this.props.projectService.project.enable) {
      classActive = "";
      classActiveShow = "";
    }
  }

  onEnterSaveProject(event: any) {
    if (event.key === "Enter") this.btnSaveProject_onClick(event);
  }

  onEnterCreateProject(event: any) {
    if (event.key === "Enter") this.btnCreateProject_onClick(event);
  }
  onEnterFocusPL(event: any) {
    if (event.key === "Enter")
      document.getElementById("enterProductLineName")?.focus();
  }
  handleUpdateNameProject(event: any) {
    this.setState({
      projectName: event.target.value,
    });
  }

  handleUpdateNameProductLine(event: any) {
    this.setState({
      productLineName: event.target.value,
    });
  }

  btnCreateProject_onClick(event: any) {
    if (this.state.projectName === "") {
      alertify.error("Project name is required");
      document.getElementById("enterProjectName")?.focus();
      return false;
    }

    if (this.state.productLineName === "") {
      alertify.error("Product line name is required");
      document.getElementById("enterProductLineName")?.focus();
      return false;
    }

    this.props.projectService.updateProjectName(this.state.projectName);
    this.props.projectService.updateProjectState(true);

    let productLine = this.props.projectService.createLPS(
      this.props.projectService.project,
      this.state.productLineName
    );
    this.props.projectService.raiseEventNewProductLine(productLine);

    this.props.projectService.saveProject();

    document.getElementById("openModal")?.click();
  }

  btnSaveProject_onClick(event: any) {
    if (this.state.projectName === "") {
      alertify.error("Project name is required");
      document.getElementById("enterMyProjectName")?.focus();
      return false;
    }

    let languages = this.props.projectService.getLanguagesDetail();

    this.props.projectService.updateProjectName(this.state.projectName);

    this.props.projectService.raiseEventLanguagesDetail(languages);

    this.props.projectService.saveProject();
    document.getElementById("openModal")?.click();
  }

  render() {
    return (
      <div>
        <div
          className="modal fade show"
          id="staticBackdrop"
          data-bs-backdrop="static"
          data-bs-keyboard="false"
          tabIndex={-1}
          aria-labelledby="staticBackdropLabel"
        >
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="staticBackdropLabel">
                  Project management
                </h5>
                {this.props.projectService.project.enable === true && (
                  <div className="col d-flex justify-content-end">
                    <ul className="list-group icon-dark-variamos list-group-horizontal">
                      <li
                        className="list-group-item nav-bar-variamos"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        title="User setting"
                      >
                        <span
                          className="bi bi-x-lg shadow rounded"
                          id="userSetting"
                          onClick={(e) => this.btnSaveProject_onClick(e)}
                        ></span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="modal-body">
                <div className="row">
                  <div className="col-4">
                    <div className="list-group" id="list-tab" role="tablist">
                      {this.props.projectService.project.enable === true && (
                        <a
                          className="list-group-item list-group-item-action active"
                          id="list-mProject-list"
                          data-bs-toggle="list"
                          href="#list-mProject"
                          role="tab"
                          aria-controls="mProject"
                        >
                          Current
                        </a>
                      )}

                      {this.props.projectService.project.enable === false && (
                        <a
                          className={
                            "list-group-item list-group-item-action " +
                            classActive
                          }
                          id="list-nProject-list"
                          data-bs-toggle="list"
                          href="#list-nProject"
                          role="tab"
                          aria-controls="nProject"
                        >
                          New
                        </a>
                      )}

                      <a
                        className="list-group-item list-group-item-action"
                        id="list-iProject-list"
                        data-bs-toggle="list"
                        href="#list-iProject"
                        role="tab"
                        aria-controls="iProject"
                      >
                        Upload
                      </a>
                      <a
                        className="list-group-item list-group-item-action"
                        id="list-settings-list"
                        data-bs-toggle="list"
                        href="#list-settings"
                        role="tab"
                        aria-controls="settings"
                        onClick={() =>
                          LanguageManagement.bind(this.forceUpdate())
                        }
                      >
                        Settings
                      </a>
                      <a
                        className="list-group-item list-group-item-action"
                        id="list-help-list"
                        data-bs-toggle="list"
                        href="#list-help"
                        role="tab"
                        aria-controls="help"
                        onClick={() =>
                          LanguageManagement.bind(this.forceUpdate())
                        }
                      >
                        Help
                      </a>
                    </div>
                  </div>
                  <div className="col-8">
                    <div className="tab-content" id="nav-tabContent">
                      {this.props.projectService.project.enable === true && (
                        <div
                          className="tab-pane fade show active"
                          id="list-mProject"
                          role="tabpanel"
                          aria-labelledby="list-mProject-list"
                        >
                          <div className="form-floating">
                            <input
                              type="text"
                              className="form-control"
                              id="enterMyProjectName"
                              placeholder="VariaMosProject"
                              value={this.state.projectName}
                              onChange={(e) => this.handleUpdateNameProject(e)}
                              onKeyDown={this.onEnterSaveProject}
                              autoComplete="off"
                            />
                            <label htmlFor="floatingInput">Enter name</label>
                          </div>
                          <br />
                          <div className="row justify-content-center">
                            <div className="col-4">
                              <button
                                type="button"
                                className="btn form-control btn-Variamos"
                                onClick={(e) => this.btnSaveProject_onClick(e)}
                              >
                                Save
                              </button>
                            </div>
                            <div className="col-4">
                              <button
                                type="button"
                                className="btn form-control btn-Variamos"
                                data-bs-dismiss="modal"
                                onClick={() =>
                                  this.props.projectService.deleteProject()
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div
                        className={"tab-pane fade " + classActiveShow}
                        id="list-nProject"
                        role="tabpanel"
                        aria-labelledby="list-nProject-list"
                      >
                        <div className="form-floating">
                          <input
                            type="text"
                            className="form-control"
                            id="enterProjectName"
                            placeholder="VariaMosProject"
                            onChange={(e) => this.handleUpdateNameProject(e)}
                            onKeyPress={this.onEnterFocusPL}
                            autoComplete="off"
                          />
                          <label htmlFor="floatingInput">Project name</label>
                        </div>
                        <br />
                        <div className="row g-2">
                          <div className="col-md">
                            <div className="form-floating">
                              <input
                                type="text"
                                className="form-control"
                                id="enterProductLineName"
                                placeholder="VariaMosProductLineE"
                                onChange={(e) =>
                                  this.handleUpdateNameProductLine(e)
                                }
                                onKeyDown={this.onEnterCreateProject}
                                autoComplete="off"
                              />
                              <label htmlFor="floatingInputGrid">
                                Product line name
                              </label>
                            </div>
                          </div>
                        </div>
                        <br />
                        <button
                          type="button"
                          className="btn form-control btn-Variamos"
                          onClick={this.btnCreateProject_onClick}
                          id="createProject"
                        >
                          Create
                        </button>
                        <div
                          hidden={true}
                          id="openModal"
                          data-bs-dismiss="modal"
                        ></div>
                      </div>

                      <div
                        className="tab-pane fade"
                        id="list-iProject"
                        role="tabpanel"
                        aria-labelledby="list-iProject-list"
                      >
                        <div className="">
                          <label
                            htmlFor="importProjectFile"
                            className="form-label"
                          >
                            Upload a JSON file
                          </label>
                          <input
                            className="form-control"
                            type="file"
                            id="importProjectFile"
                            onChange={(e) =>
                              this.handleImportProject(e.target.files)
                            }
                            accept=".json"
                          />
                        </div>
                        <br />
                        <button
                          type="button"
                          className="btn btn-Variamos h-100"
                          onClick={this.importProject}
                        >
                          Upload
                        </button>
                      </div>
                      <div
                        className="tab-pane fade"
                        id="list-settings"
                        role="tabpanel"
                        aria-labelledby="list-settings-list"
                      >
                        <LanguageManagement
                          projectService={this.props.projectService}
                        />
                      </div>
                      <div
                        className="tab-pane fade"
                        id="list-help"
                        role="tabpanel"
                        aria-labelledby="list-help-list"
                      >
                        <div className="list-group">
                          <a className="list-group-item list-group-item-action">
                            Version: {this.state.version}
                          </a>
                          <a
                            href={this.state.urlVariamosDoc}
                            target="_blanck"
                            className="list-group-item list-group-item-action"
                          >
                            What is VariaMos?
                          </a>
                          <a
                            href={this.state.urlVariamosLangDoc}
                            target="_blanck"
                            className="list-group-item list-group-item-action"
                          >
                            how can i define a language?
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ProjectManagement;
