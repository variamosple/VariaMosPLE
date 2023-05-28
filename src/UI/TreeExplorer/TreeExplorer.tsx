import React, { Component } from "react";
import { ProductLine } from "../../Domain/ProductLineEngineering/Entities/ProductLine";
import ProjectService from "../../Application/Project/ProjectService";
import VariaMosLogo from "../../Addons/images/VariaMosLogo.png";
import TreeMenu from "./TreeMenu";
import NavBar from "../WorkSpace/navBar";
import "./TreeExplorer.css";

interface Props {
  projectService: ProjectService;
}

interface State { }

class TreeExplorer extends Component<Props, State> {
  state = {
    contextMenuX: 100,
    contextMenuY: 100,
    showContextMenu: false
  };

  constructor(props: any) {
    super(props);

    this.btnSave_onClick = this.btnSave_onClick.bind(this);
    this.projectService_addListener =
      this.projectService_addListener.bind(this);
    this.lps_onClick = this.lps_onClick.bind(this);
    this.updateLpSelected = this.updateLpSelected.bind(this);
    this.updateApplicationSelected = this.updateApplicationSelected.bind(this);
    this.updateAdaptationSelected = this.updateAdaptationSelected.bind(this);

    this.btn_viewDomainModel = this.btn_viewDomainModel.bind(this);
    this.btn_viewApplicationEngModel =
      this.btn_viewApplicationEngModel.bind(this);
    this.btn_viewApplicationModel = this.btn_viewApplicationModel.bind(this);
    this.btn_viewAdaptationModel = this.btn_viewAdaptationModel.bind(this);

    this.onContextMenuHide = this.onContextMenuHide.bind(this);
  }

  onContextMenuHide(e) {
    this.setState({
      showContextMenu: false
    });
  }

  btn_viewDomainModel(e: any, idPl: number, idDomainModel: number) {
    this.props.projectService.modelDomainSelected(idPl, idDomainModel);
    this.props.projectService.saveProject();
    if (e) {
      this.setState({
        showContextMenu: true,
        contextMenuX: e.clientX,
        contextMenuY: e.clientY
      })
    }
  }

  btn_viewApplicationModel(
    e: any,
    idPl: number,
    idApplication: number,
    idApplicationModel: number
  ) {
    this.props.projectService.modelApplicationSelected(
      idPl,
      idApplication,
      idApplicationModel
    );
    this.props.projectService.saveProject();
    if (e) {
      this.setState({
        showContextMenu: true,
        contextMenuX: e.clientX,
        contextMenuY: e.clientY
      })
    }
  }

  btn_viewAdaptationModel(
    e: any,
    idPl: number,
    idApplication: number,
    idAdaptation: number,
    idAdaptationModel: number
  ) {
    this.props.projectService.modelAdaptationSelected(
      idPl,
      idApplication,
      idAdaptation,
      idAdaptationModel
    );
    this.props.projectService.saveProject();
    if (e) {
      this.setState({
        showContextMenu: true,
        contextMenuX: e.clientX,
        contextMenuY: e.clientY
      })
    }
  }

  btn_viewApplicationEngModel(idPl: number, idApplicationEngModel: number) {
    this.props.projectService.modelApplicationEngSelected(
      idPl,
      idApplicationEngModel
    );
    this.props.projectService.saveProject();
  }

  updateLpSelected(e: any, idPl: number) {
    this.props.projectService.updateLpSelected(idPl);
    if (e.target.id === "domainEngineering") {
      this.props.projectService.updateDomainEngSelected();
    } else if (e.target.id === "applicationEngineering") {
      this.props.projectService.updateAppEngSelected();
    }
    this.props.projectService.saveProject();
    this.setState({
      showContextMenu: true,
      contextMenuX: e.clientX,
      contextMenuY: e.clientY
    })
  }

  updateApplicationSelected(e: any, idPl: number, idApplication: number) {
    this.props.projectService.updateApplicationSelected(idPl, idApplication);
    this.props.projectService.saveProject();
    this.setState({
      showContextMenu: true,
      contextMenuX: e.clientX,
      contextMenuY: e.clientY
    })
  }

  updateAdaptationSelected(
    e: any,
    idPl: number,
    idApplication: number,
    idAdaptation: number
  ) {
    this.props.projectService.updateAdaptationSelected(
      idPl,
      idApplication,
      idAdaptation
    );
    this.props.projectService.saveProject();
    this.setState({
      showContextMenu: true,
      contextMenuX: e.clientX,
      contextMenuY: e.clientY
    })
  }

  lps_onClick(e: any, i: number) {
    e.target.parentElement.querySelector(".nested").classList.toggle("active");
    e.target.classList.toggle("fa-minus-square-o");
  }

  projectService_addListener(e: any) {
    this.forceUpdate();
    this.props.projectService.saveProject();
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
    me.props.projectService.addNewApplicationEngineeringModelListener(
      this.projectService_addListener
    );

    me.props.projectService.addUpdateProjectListener(
      this.projectService_addListener
    );
  }

  btnSave_onClick(e: any) {
    this.props.projectService.saveProject();
  }

  render() {
    return (
      <div
        id="TreePannel"
        className="TreeExplorer"
        style={{ zIndex: 5 }}
        onContextMenu={(e) => { e.preventDefault(); }}
      >
        <NavBar projectService={this.props.projectService} />
        <div className="treeView">
          <div className="">
            <div className="">
              <div
                className="card-body bg-white-Variamos divTreeExplorer"
                style={{ overflowX: "auto" }}
              >
                <span><img src="/images/treeView/project.png"></img>{this.props.projectService.project.name}</span>
                <ul id="ul">
                  {this.props.projectService.project.productLines.map(
                    (pl: ProductLine, idPl: number) => (
                      <div key={idPl}>
                        <li>
                          <span
                            className="fa fa-plus-square fa-minus-square-o lps"
                            id="productLine"
                            onClick={() => this.lps_onClick(window.event, idPl)}
                            onAuxClick={(e) => {
                              this.updateLpSelected(e, idPl)
                            }
                            }
                          >
                            <span id="productLine"><img id="productLine" src="/images/treeView/productLine.png"></img>{pl.name}</span>
                          </span>
                          <ul className="nested active">
                            <li>
                              <span
                                className="fa fa-plus-square fa-minus-square-o domainE"
                                onAuxClick={(e) =>
                                  this.updateLpSelected(e, idPl)
                                }
                                id="domainEngineering"
                                onClick={(e) =>
                                  this.lps_onClick(window.event, idPl)
                                }
                              >
                                <span id="domainEngineering"><img id="domainEngineering" src="/images/treeView/domainEngineering.png"></img>Domain Engineering</span>
                              </span>
                              <ul className="nested active">
                                {pl.domainEngineering?.models?.map(
                                  (domainModel, idDomainModel: number) => (
                                    <div key={idDomainModel}>
                                      <li
                                        id="model"
                                        title={domainModel.name}
                                        onClick={(e) =>
                                          this.btn_viewDomainModel(
                                            null,
                                            idPl,
                                            idDomainModel
                                          )
                                        }
                                        onAuxClick={(e) =>
                                          this.btn_viewDomainModel(
                                            e,
                                            idPl,
                                            idDomainModel
                                          )
                                        }
                                      >
                                        <span id="model"><img id="model" src="/images/treeView/model.png"></img>{domainModel.name}</span>
                                      </li>
                                    </div>
                                  )
                                )}
                              </ul>
                            </li>
                            <li>
                              <span
                                id="applicationEngineering"
                                className="fa fa-plus-square fa-minus-square-o appE"
                                onAuxClick={(e) =>
                                  this.updateLpSelected(e, idPl)
                                }
                                onClick={(e) =>
                                  this.lps_onClick(e, idPl)
                                }
                              >
                                <span id="applicationEngineering"><img id="applicationEngineering" src="/images/treeView/applicationEngineering.png"></img>Application Engineering</span>
                              </span>
                              <ul className="nested active">
                                {pl.applicationEngineering?.models?.map(
                                  (
                                    appEModel,
                                    idApplicationEngModel: number
                                  ) => (
                                    <div key={idApplicationEngModel}>
                                      <li
                                        id="model"
                                        title={appEModel.name}
                                        onClick={(e) =>
                                          this.btn_viewApplicationEngModel(
                                            idPl,
                                            idApplicationEngModel
                                          )
                                        }
                                      >
                                        <span id="model"><img id="model" src="/images/treeView/model.png"></img>{appEModel.name}</span>
                                      </li>
                                    </div>
                                  )
                                )}
                                <li>
                                  {pl.applicationEngineering?.applications?.map(
                                    (aeApp, idApplication: number) => (
                                      <div key={idApplication}>
                                        <span
                                          id="application"
                                          title={aeApp.name}
                                          className="fa fa-plus-square fa-minus-square-o aeApp"
                                          onAuxClick={(e) =>
                                            this.updateApplicationSelected(
                                              e,
                                              idPl,
                                              idApplication
                                            )
                                          }
                                          onClick={(e) =>
                                            this.lps_onClick(
                                              window.event,
                                              idApplication
                                            )
                                          }
                                        >
                                          <span id="application"><img id="application" src="/images/treeView/application.png"></img>{aeApp.name}</span>
                                        </span>
                                        <ul className="nested active">
                                          {aeApp.models?.map(
                                            (
                                              aeApp,
                                              idApplicationModel: number
                                            ) => (
                                              <div key={idApplicationModel}>
                                                <li
                                                  id="model"
                                                  title={aeApp.name}
                                                  onClick={(e) =>
                                                    this.btn_viewApplicationModel(
                                                      null,
                                                      idPl,
                                                      idApplication,
                                                      idApplicationModel
                                                    )
                                                  }
                                                  onAuxClick={(e) =>
                                                    this.btn_viewApplicationModel(
                                                      e,
                                                      idPl,
                                                      idApplication,
                                                      idApplicationModel
                                                    )
                                                  }
                                                >
                                                  <span id="model"><img id="model" src="/images/treeView/model.png"></img>{aeApp.name}</span>
                                                </li>
                                              </div>
                                            )
                                          )}
                                          {aeApp.adaptations?.map(
                                            (
                                              aeCotext,
                                              idAdaptation: number
                                            ) => (
                                              <div key={idAdaptation}>
                                                <li>
                                                  <span
                                                    id="adaptation"
                                                    title={aeCotext.name}
                                                    className="fa fa-plus-square fa-minus-square-o aeContext"
                                                    onAuxClick={(e) =>
                                                      this.updateAdaptationSelected(
                                                        e,
                                                        idPl,
                                                        idApplication,
                                                        idAdaptation
                                                      )
                                                    }
                                                    onClick={(e) =>
                                                      this.lps_onClick(
                                                        window.event,
                                                        idAdaptation
                                                      )
                                                    }
                                                  >
                                                    <span id="adaptation"><img id="adaptation" src="/images/treeView/adaptation.png"></img>{aeCotext.name}</span>
                                                  </span>
                                                  <ul className="nested active">
                                                    {aeCotext.models?.map(
                                                      (
                                                        aeCotextModel,
                                                        idAdaptationModel: number
                                                      ) => (
                                                        <div
                                                          key={
                                                            idAdaptationModel
                                                          }
                                                        >
                                                          <li
                                                            id="model"
                                                            title={aeCotextModel.name}
                                                            onClick={(e) =>
                                                              this.btn_viewAdaptationModel(
                                                                null,
                                                                idPl,
                                                                idApplication,
                                                                idAdaptation,
                                                                idAdaptationModel
                                                              )
                                                            }
                                                            onAuxClick={(e) =>
                                                              this.btn_viewAdaptationModel(
                                                                e,
                                                                idPl,
                                                                idApplication,
                                                                idAdaptation,
                                                                idAdaptationModel
                                                              )
                                                            }
                                                          >
                                                            <span id="model"><img id="model" src="/images/treeView/model.png"></img>{aeCotextModel.name}</span>
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
        <TreeMenu projectService={this.props.projectService}
          contextMenuX={this.state.contextMenuX}
          contextMenuY={this.state.contextMenuY}
          showContextMenu={this.state.showContextMenu}
          onContextMenuHide={this.onContextMenuHide} />
      </div>
    );
  }
}

export default TreeExplorer;
