import React, { Component } from "react";
import { ProductLine } from "../../Domain/ProductLineEngineering/Entities/ProductLine";
import ProjectService from "../../Application/Project/ProjectService";
import VariaMosLogo from "../../Addons/images/VariaMosLogo.png";

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
    this.updateLpSelected = this.updateLpSelected.bind(this);
    this.updateApplicationSelected = this.updateApplicationSelected.bind(this);
    this.updateAdaptationSelected = this.updateAdaptationSelected.bind(this);

    this.btn_viewDomainModel = this.btn_viewDomainModel.bind(this);
    this.btn_viewApplicationEngModel =
      this.btn_viewApplicationEngModel.bind(this);
    this.btn_viewApplicationModel = this.btn_viewApplicationModel.bind(this);
    this.btn_viewAdaptationModel = this.btn_viewAdaptationModel.bind(this);
  }

  btn_viewDomainModel(idPl: number, idDomainModel: number) {
    this.props.projectService.modelDomainSelected(idPl, idDomainModel);
    this.props.projectService.saveProject();
  }

  btn_viewApplicationModel(
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
  }

  btn_viewAdaptationModel(
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
  }

  updateApplicationSelected(idPl: number, idApplication: number) {
    this.props.projectService.updateApplicationSelected(idPl, idApplication);
    this.props.projectService.saveProject();
  }

  updateAdaptationSelected(
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
        className="col-sm-2 distribution-variamos shadow"
        style={{ height: "90vh", zIndex: 5 }}
      >
        <div className="col-sm-12 h-100">
          <div className="col-sm-12 h-100">
            <div className="card h-100 shadow bg-body rounded">
              {/* <div className="text-center p-2 bg-body">
                <a
                  href="https://variamos.com/home/variamos-web/"
                  target="_blank"
                >
                  <img
                    src={VariaMosLogo}
                    alt=""
                    className="img-fluid"
                    width="191"
                    height="39"
                  />
                </a>
                <hr style={{ marginTop: 10, color: "gray" }} />
              </div> */}
              <div
                className="card-body bg-white-Variamos"
                style={{ overflowX: "auto" }}
              >
                <div className="text-center projectName shadow-sm p-2 rounded">
                  &nbsp; {this.props.projectService.project.name}
                </div>
                <br />

                <ul id="ul">
                  {this.props.projectService.project.productLines.map(
                    (pl: ProductLine, idPl: number) => (
                      <div key={idPl}>
                        <li>
                          <span
                            className="fa fa-plus-square fa-minus-square-o lps"
                            id="productLine"
                            onClick={() => this.lps_onClick(window.event, idPl)}
                            onAuxClick={() =>
                              this.updateLpSelected(window.event, idPl)
                            }
                          >
                            {pl.name}
                          </span>
                          <ul className="nested active">
                            <li>
                              <span
                                className="fa fa-plus-square fa-minus-square-o domainE"
                                onAuxClick={() =>
                                  this.updateLpSelected(window.event, idPl)
                                }
                                id="domainEngineering"
                                onClick={() =>
                                  this.lps_onClick(window.event, idPl)
                                }
                              >
                                Domain Engineering
                              </span>
                              <ul className="nested active">
                                {pl.domainEngineering?.models?.map(
                                  (domainModel, idDomainModel: number) => (
                                    <div key={idDomainModel}>
                                      <li
                                        id="model"
                                        onClick={() =>
                                          this.btn_viewDomainModel(
                                            idPl,
                                            idDomainModel
                                          )
                                        }
                                        onAuxClick={() =>
                                          this.btn_viewDomainModel(
                                            idPl,
                                            idDomainModel
                                          )
                                        }
                                      >
                                        {domainModel.name}
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
                                onAuxClick={() =>
                                  this.updateLpSelected(window.event, idPl)
                                }
                                onClick={() =>
                                  this.lps_onClick(window.event, idPl)
                                }
                              >
                                Application Engineering
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
                                        onClick={() =>
                                          this.btn_viewApplicationEngModel(
                                            idPl,
                                            idApplicationEngModel
                                          )
                                        }
                                      >
                                        {appEModel.name}
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
                                          className="fa fa-plus-square fa-minus-square-o aeApp"
                                          onAuxClick={() =>
                                            this.updateApplicationSelected(
                                              idPl,
                                              idApplication
                                            )
                                          }
                                          onClick={() =>
                                            this.lps_onClick(
                                              window.event,
                                              idApplication
                                            )
                                          }
                                        >
                                          {aeApp.name}
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
                                                  onClick={() =>
                                                    this.btn_viewApplicationModel(
                                                      idPl,
                                                      idApplication,
                                                      idApplicationModel
                                                    )
                                                  }
                                                  onAuxClick={() =>
                                                    this.btn_viewApplicationModel(
                                                      idPl,
                                                      idApplication,
                                                      idApplicationModel
                                                    )
                                                  }
                                                >
                                                  {aeApp.name}
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
                                                    className="fa fa-plus-square fa-minus-square-o aeContext"
                                                    onAuxClick={() =>
                                                      this.updateAdaptationSelected(
                                                        idPl,
                                                        idApplication,
                                                        idAdaptation
                                                      )
                                                    }
                                                    onClick={() =>
                                                      this.lps_onClick(
                                                        window.event,
                                                        idAdaptation
                                                      )
                                                    }
                                                  >
                                                    {aeCotext.name}
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
                                                            onClick={() =>
                                                              this.btn_viewAdaptationModel(
                                                                idPl,
                                                                idApplication,
                                                                idAdaptation,
                                                                idAdaptationModel
                                                              )
                                                            }
                                                            onAuxClick={() =>
                                                              this.btn_viewAdaptationModel(
                                                                idPl,
                                                                idApplication,
                                                                idAdaptation,
                                                                idAdaptationModel
                                                              )
                                                            }
                                                          >
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
