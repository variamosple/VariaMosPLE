import React, { Component } from "react";
import { ProductLine } from "../../Domain/ProductLineEngineering/Entities/ProductLine";
import TreeMenu from "./TreeMenu";
import ProjectService from "../../Application/Project/ProjectService";

interface Props {
  projectService: ProjectService;
}

interface State {}

class TreeExplorer extends Component<Props, State> {
  state = {};

  constructor(props: any) {
    super(props);
    this.btnSave_onClick = this.btnSave_onClick.bind(this);
    this.projectService_addListener =
      this.projectService_addListener.bind(this);
    this.lps_onClick = this.lps_onClick.bind(this);
  }

  lps_onClick(e: any) {
    e.target.parentElement.querySelector(".nested").classList.toggle("active");
    e.target.classList.toggle("fa-minus-square-o");
  }

  projectService_addListener(e: any) {
    this.forceUpdate();
  }

  componentDidMount() {
    let me = this;
    me.props.projectService.addNewProductLineListener(
      this.projectService_addListener
    );

    me.props.projectService.addNewApplicationListener(
      this.projectService_addListener
    );

    me.props.projectService.addNewApplicationModelListener(
      this.projectService_addListener
    );

    me.props.projectService.addNewAdaptationListener(
      this.projectService_addListener
    );

    me.props.projectService.addNewAdaptationModelListener(
      this.projectService_addListener
    );

    me.props.projectService.addNewDomainEngineeringModelListener(
      this.projectService_addListener
    );
  }

  btnSave_onClick(e: any) {
    this.props.projectService.saveProject();
  }

  render() {
    return (
      <div id="TreePannel" className="col-sm-2 distribution-variamos h-100">
        <TreeMenu projectService={this.props.projectService} />
        <div className="col-sm-12 h-100">
          <div className="col-sm-12 h-100">
            <div className="card h-100 shadow-sm bg-body rounded">
              <div className="card-header text-center">
                &nbsp; {this.props.projectService.project.name}
              </div>
              <div className="card-body bg-white-Variamos">
                <ul id="ul">
                  {this.props.projectService.project.productLines.map(
                    (pl: ProductLine, i: number) => (
                      <div>
                        <li key={i}>
                          <span
                            className="fa fa-plus-square lps"
                            onClick={this.lps_onClick}
                          >
                            {pl.name}
                          </span>
                          <ul className="nested">
                            <li>
                              <span
                                className="fa fa-plus-square domainE"
                                onClick={this.lps_onClick}
                              >
                                Domain Engineering
                              </span>
                              <ul className="nested">
                                {pl.domainEngineering?.models?.map(
                                  (domainModel) => (
                                    <div>
                                      <li>{domainModel.name}</li>
                                    </div>
                                  )
                                )}
                              </ul>
                            </li>
                            <li>
                              <span
                                className="fa fa-plus-square appE"
                                onClick={this.lps_onClick}
                              >
                                Application Engineering
                              </span>
                              <ul className="nested">
                                {pl.applicationEngineering?.models?.map(
                                  (appEModel) => (
                                    <div>
                                      <li>{appEModel.name}</li>
                                    </div>
                                  )
                                )}
                                <li>
                                  {pl.applicationEngineering?.applications?.map(
                                    (aeApp) => (
                                      <div>
                                        <span
                                          className="fa fa-plus-square aeApp"
                                          onClick={this.lps_onClick}
                                        >
                                          {aeApp.applicationName}
                                        </span>
                                        <ul className="nested">
                                          {aeApp.models?.map((aeApp) => (
                                            <div>
                                              <li>{aeApp.name}</li>
                                            </div>
                                          ))}
                                          {aeApp.adaptations?.map(
                                            (aeCotext) => (
                                              <div>
                                                <li>
                                                  <span
                                                    className="fa fa-plus-square aeContext"
                                                    onClick={this.lps_onClick}
                                                  >
                                                    {aeCotext.adaptationName}
                                                  </span>
                                                  <ul className="nested">
                                                    {aeCotext.models?.map(
                                                      (aeCotextModel) => (
                                                        <div>
                                                          <li>
                                                            {aeCotextModel.name}
                                                          </li>
                                                        </div>
                                                      )
                                                    )}
                                                  </ul>
                                                </li>
                                              </div>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )
                                  )}
                                </li>
                              </ul>
                            </li>
                          </ul>
                        </li>
                      </div>
                    )
                  )}
                </ul>
              </div>
              {/* <div className="card-footer text-muted d-inline-block">
                <button className="btn btn-darkVariamos" onClick={this.btnSave_onClick}>Export Project</button>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default TreeExplorer;
