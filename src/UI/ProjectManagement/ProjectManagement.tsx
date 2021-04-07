import React, { Component } from "react";
import "../../Addons/Library/VariaMosStyle/variamos.css";

interface Props {}
interface State {}

class ProjectManagement extends Component<Props, State> {
  state = {};

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
                      <a
                        className="list-group-item list-group-item-action active"
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
                      <div
                        className="tab-pane fade show active"
                        id="list-nProject"
                        role="tabpanel"
                        aria-labelledby="list-nProject-list"
                      >
                        <div className="form-floating">
                          <input
                            type="email"
                            className="form-control"
                            id="floatingInput"
                            placeholder="VariaMosProject"
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
                                type="email"
                                className="form-control"
                                id="floatingInputGrid"
                                placeholder="VariaMosProductLineE"
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
