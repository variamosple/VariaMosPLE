import React, { Component } from "react";
import "../../Addons/Library/VariaMosStyle/variamos.css";
import {
  initializerProject,
  myProject,
} from "../../Domain/ProjectManagement/UseCases/initializer";
import {
  deleteProject
} from "../../Domain/ProjectManagement/UseCases/ProjectManagement";
import TreeExplorer from "../TreeExplorer/TreeExplorer";



let classActive: string = myProject.projectEnable ? "":"active";
let classActiveShow: string = myProject.projectEnable ? "":"show active";

class ProjectManagement extends Component {
  constructor(props: any) {
    super(props);
    this.state = {
    };

    this.handleUpdateNameProject = this.handleUpdateNameProject.bind(this);
    this.handleUpdateNameProductLine = this.handleUpdateNameProductLine.bind(
      this
    );
  }

  handleUpdateNameProject(event: any) {
    myProject.projectName = event.target.value;
    TreeExplorer.bind(myProject);
  }

  handleUpdateNameProductLine(event: any) {
    myProject.productLines[0].productLineName = event.target.value;
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
                      {myProject.projectEnable === true && (
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
                      {myProject.projectEnable === true && (
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
                              value={myProject.projectName}
                              onChange={this.handleUpdateNameProject}
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
                                onClick={() => deleteProject()}
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
                            // value={myProject.projectName}
                            onChange={this.handleUpdateNameProject}
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
                                // value={myProject.productLine[0].productLineName}
                                onChange={this.handleUpdateNameProductLine}
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
                          className="btn form-control btn-darkVariamos"
                          data-bs-dismiss="modal"
                          onClick={() => initializerProject(myProject.projectName,myProject.productLines[0].productLineName,true)}
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
                          className="btn btn-darkVariamos h-100"
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
