import React, { Component } from "react";
import ReactDOM from "react-dom";
import "../../Addons/Library/VariaMosStyle/variamos.css";
import TreeExplorer from "../TreeExplorer/TreeExplorer";
import ProjectService from "../../Infraestructure/project/ProjectService";
import { Project } from "../../Domain/ProjectManagement/Entities/Project";

interface Props {
  projectService: ProjectService;
}
interface State {
  projectName: string;
  productLineName: string;
}

let classActive: string = "active";
let classActiveShow: string = "show active";

class ProjectManagement extends Component<Props, State> {
  _project?: Project;

  constructor(props: any) {
    super(props);
    this.state = {
      productLineName: "",
      projectName: "",
    };

    this.handleUpdateNameProject = this.handleUpdateNameProject.bind(this);
    this.handleUpdateNameProductLine =
      this.handleUpdateNameProductLine.bind(this);
    this.btnCreateProject_onClick = this.btnCreateProject_onClick.bind(this);
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
    this._project = this.props.projectService.project;
    this._project.projectName = this.state.projectName;

    this.props.projectService.project = this._project;

    let productLine = this.props.projectService.createLPS(
      this.props.projectService.project,
      this.state.productLineName
    );

    this.props.projectService.raiseEventNewProductLine(productLine);

    this.props.projectService.saveProject();
   
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
                  Project Management
                </h5>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-4">
                    <div className="list-group" id="list-tab" role="tablist">
                      {this.props.projectService.project.projectEnable ===
                        true && (
                        <a
                          className="list-group-item list-group-item-action active"
                          id="list-mProject-list"
                          data-bs-toggle="list"
                          href="#list-mProject"
                          role="tab"
                          aria-controls="mProject"
                        >
                          My Project
                        </a>
                      )}

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
                        New Project
                      </a>
                      <a
                        className="list-group-item list-group-item-action"
                        id="list-iProject-list"
                        data-bs-toggle="list"
                        href="#list-iProject"
                        role="tab"
                        aria-controls="iProject"
                      >
                        Import Project
                      </a>
                      <a
                        className="list-group-item list-group-item-action"
                        id="list-settings-list"
                        data-bs-toggle="list"
                        href="#list-settings"
                        role="tab"
                        aria-controls="settings"
                      >
                        Settings
                      </a>
                    </div>
                  </div>
                  <div className="col-8">
                    <div className="tab-content" id="nav-tabContent">
                      {this.props.projectService.project.projectEnable ===
                        true && (
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
                              id="floatingInput"
                              placeholder="VariaMosProject"
                              value={
                                this.props.projectService.project.projectName
                              }
                              onChange={(e) =>
                                this.handleUpdateNameProductLine(e)
                              }
                            />
                            <label htmlFor="floatingInput">
                              Enter Project Name
                            </label>
                          </div>
                          <br />
                          <div className="row justify-content-center">
                            <div className="col-4">
                              <button
                                type="button"
                                className="btn form-control btn-darkVariamos"
                                data-bs-dismiss="modal"
                                onClick={() => this.handleUpdateNameProject}
                              >
                                Save Project
                              </button>
                            </div>
                            <div className="col-4">
                              <button
                                type="button"
                                className="btn form-control btn-darkVariamos"
                                data-bs-dismiss="modal"
                                onClick={() =>
                                  this.props.projectService.deleteProject()
                                }
                              >
                                Delete Project
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
                            id="floatingInput"
                            placeholder="VariaMosProject"
                            // value={this.props.projectService.project.projectName}
                            onChange={(e) => this.handleUpdateNameProject(e)}
                          />
                          <label htmlFor="floatingInput">
                            Enter Project Name
                          </label>
                        </div>
                        <br />
                        <div className="row g-2">
                          <div className="col-md">
                            <div className="form-floating">
                              <input
                                type="text"
                                className="form-control"
                                id="floatingInputGrid"
                                placeholder="VariaMosProductLineE"
                                // value={this.props.projectService.project.productLine[0].productLineName}
                                onChange={(e) =>
                                  this.handleUpdateNameProductLine(e)
                                }
                              />
                              <label htmlFor="floatingInputGrid">
                                Enter Product Line Name
                              </label>
                            </div>
                          </div>
                        </div>
                        <br />
                        <button
                          type="button"
                          className="btn form-control btn-Variamos"
                          data-bs-dismiss="modal"
                          onClick={this.btnCreateProject_onClick}
                        >
                          Create Project
                        </button>
                      </div>
                      <div
                        className="tab-pane fade"
                        id="list-iProject"
                        role="tabpanel"
                        aria-labelledby="list-iProject-list"
                      >
                        <div className="">
                          <label htmlFor="formFile" className="form-label">
                            Upload a JSON file
                          </label>
                          <input
                            className="form-control"
                            type="file"
                            id="formFile"
                            accept=".json"
                          />
                        </div>
                        <br />
                        <button
                          type="button"
                          className="btn btn-Variamos h-100"
                        >
                          Import
                        </button>
                      </div>
                      <div
                        className="tab-pane fade"
                        id="list-settings"
                        role="tabpanel"
                        aria-labelledby="list-settings-list"
                      >
                        Setting
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
