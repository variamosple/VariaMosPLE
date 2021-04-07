import React, { Component } from "react";

interface Props {}
interface State {}

class TreeExplorer extends Component<Props, State> {
  state = {};

  render() {
    return (
        <div id="TreePannel" className="col-sm-2 p-1 h-100">
          <div className="col-sm-12 p-1 h-100">
            <div className="col-sm-12 h-100">
              <div className="card h-100 shadow-sm p-1 bg-body rounded">
                <div className="card-header text-center bg-lightblue-Variamos border-title-lighblue-variamos">
                  My Project 
                  {/* Reemplazar por el nombre del proyecto */}
                </div>
                <div className="card-body">
                  <ul id="ul">
                    <li>
                      <span className="fa fa-plus-square">LPS 1</span>
                      <ul className="nested">
                        <li>
                          <span className="fa fa-plus-square">
                            Domain Engineering
                          </span>
                          <ul className="nested">
                            <li>Model A</li>
                            <li>Model B</li>
                          </ul>
                        </li>
                        <li>
                          <span className="fa fa-plus-square">
                            Application Engineering
                          </span>
                          <ul className="nested">
                            <li>Model C</li>
                            <li>
                              <span className="fa fa-plus-square">
                                Application 1
                              </span>
                              <ul className="nested">
                                <li>Model D</li>
                                <li>
                                  <span className="fa fa-plus-square">
                                    Adaptation 1
                                  </span>
                                  <ul className="nested">
                                    <li>Model E</li>
                                    <li>Model F</li>
                                  </ul>
                                </li>
                                <li>
                                  <span className="fa fa-plus-square">
                                    Adaptation 2
                                  </span>
                                  <ul className="nested">
                                    <li>Model G</li>
                                    <li>Model H</li>
                                  </ul>
                                </li>
                              </ul>
                            </li>
                            <li>
                              <span className="fa fa-plus-square">
                                Application 2
                              </span>
                              <ul className="nested">
                                <li>Model I</li>
                                <li>
                                  <span className="fa fa-plus-square">
                                    Adaptation 1
                                  </span>
                                  <ul className="nested">
                                    <li>Model J</li>
                                    <li>Model K</li>
                                  </ul>
                                </li>
                              </ul>
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
                <div className="card-footer text-muted d-inline-block">
                  <div className="btn btn-darkVariamos">Export Project</div>
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  }
}


export default TreeExplorer;
