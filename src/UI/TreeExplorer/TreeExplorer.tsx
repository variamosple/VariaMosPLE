import React, { Component } from "react";
import { ProductLine } from "../../Domain/ProductLineEngineering/Entities/ProductLine";
import ProjectService from "../../Application/Project/ProjectService";
import VariaMosLogo from "../../Addons/images/VariaMosLogo.png";
import TreeMenu from "./TreeMenu";
import NavBar from "../WorkSpace/navBar";
import "./TreeExplorer.css";
import { TreeItem } from "./TreeItem";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { Application } from "../../Domain/ProductLineEngineering/Entities/Application";
import { Adaptation } from "../../Domain/ProductLineEngineering/Entities/Adaptation";

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
    this.doubleClickLpSelected= this.doubleClickLpSelected.bind(this);

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
    console.log("treeExplorer btn_viewDomainModel")
    this.props.projectService.modelDomainSelected(idPl, idDomainModel);
    this.props.projectService.saveProject();
    if (e) {
      this.setState({
        showContextMenu: true,
        contextMenuX: e.event.clientX,
        contextMenuY: e.event.clientY
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
        contextMenuX: e.event.clientX,
        contextMenuY: e.event.clientY
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
        contextMenuX: e.event.clientX,
        contextMenuY: e.event.clientY
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
    if (e.target.props.dataKey === "domainEngineering") {
      this.props.projectService.updateDomainEngSelected();
    } else if (e.target.props.dataKey === "applicationEngineering") {
      this.props.projectService.updateAppEngSelected();
    }
    this.props.projectService.saveProject();
    this.setState({
      showContextMenu: true,
      contextMenuX: e.event.clientX,
      contextMenuY: e.event.clientY
    })
  }

  doubleClickLpSelected(e: any, idPl: number) {
    this.props.projectService.updateLpSelected(idPl); 
    // this.setState({
    //   showContextMenu: true,
    //   contextMenuX: e.event.clientX,
    //   contextMenuY: e.event.clientY
    // })
  }

  updateApplicationSelected(e: any, idPl: number, idApplication: number) {
    this.props.projectService.updateApplicationSelected(idPl, idApplication);
    this.props.projectService.saveProject();
    this.setState({
      showContextMenu: true,
      contextMenuX: e.event.clientX,
      contextMenuY: e.event.clientY
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
      contextMenuX: e.event.clientX,
      contextMenuY: e.event.clientY
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

    document.addEventListener("click", function(e:any) {
      if(!(''+e.target.className).includes("dropdown")){
        me.setState({
          showContextMenu: false
        })
      }
    });
  }

  btnSave_onClick(e: any) {
    this.props.projectService.saveProject();
  }

  renderModelFolders(folders:any[]) {
    let treeItems = []
    for (var key in folders) {
      treeItems.push(
        <TreeItem icon="/images/treeView/folder.png" label={key}>
          {folders[key]}
        </TreeItem>
      )
    }
    return (
      <TreeItem icon="/images/treeView/folder.png" label="Models">
        {treeItems}
      </TreeItem>
    );
  } 

  renderDomainModels(models: Model[], idProductLine: number) {
    let folders = [];
    for (let idModel = 0; idModel < models.length; idModel++) {
      const model: Model = models[idModel];
      if (!model.type) {
        model.type = model.name;
      }
      let type = "" + model.type;
      if (!folders[type]) {
        folders[type] = [];
      }
      folders[type].push(
        <TreeItem icon="/images/treeView/model.png" label={model.name} onClick={(e) => this.btn_viewDomainModel(null, idProductLine, idModel)} onAuxClick={(e) => this.btn_viewDomainModel( e, idProductLine, idModel ) }>
        </TreeItem>
      )
    }
    return this.renderModelFolders(folders);
  }

  renderApplicationModels(models: Model[], idProductLine: number, idApplication: number) {
    let folders = [];
    for (let idModel = 0; idModel < models.length; idModel++) {
      const model: Model = models[idModel];
      if (!model.type) {
        model.type = model.name;
      }
      let type = "" + model.type;
      if (!folders[type]) {
        folders[type] = [];
      }
      folders[type].push(
        <TreeItem icon="/images/treeView/model.png" label={model.name} onClick={(e) => this.btn_viewApplicationModel(
          null,
          idProductLine,
          idApplication,
          idModel
        )} onAuxClick={(e) => this.btn_viewApplicationModel(
          e,
          idProductLine,
          idApplication,
          idModel
        ) }>
        </TreeItem>
      )
    }
    return this.renderModelFolders(folders);
  }

  

  renderAdaptationModels(models: Model[], idProductLine: number, idApplication: number, idAdaptation: number) {
    let folders = [];
    for (let idModel = 0; idModel < models.length; idModel++) {
      const model: Model = models[idModel];
      if (!model.type) {
        model.type = model.name;
      }
      let type = "" + model.type;
      if (!folders[type]) {
        folders[type] = [];
      }
      folders[type].push(
        <TreeItem icon="/images/treeView/model.png" label={model.name} onClick={(e) => this.btn_viewAdaptationModel(
          null,
          idProductLine,
          idApplication,
          idAdaptation,
          idModel
        )} onAuxClick={(e) => this.btn_viewAdaptationModel(
          e,
          idProductLine,
          idApplication,
          idAdaptation,
          idModel
        )}>
        </TreeItem>
      )
    }
    return this.renderModelFolders(folders);
  }

  renderDomainEngineering(productLine: ProductLine, idProductLine: number) {
    return this.renderDomainModels(productLine.domainEngineering.models, idProductLine)
  }

  renderAdaptation(adaptation: Adaptation, idProductLine: number, idApplication: number, idAdaptation: number) {
    let treeItems = [];
    treeItems.push(this.renderAdaptationModels(adaptation.models, idProductLine, idApplication, idAdaptation));
    let treeItem = (
      <TreeItem icon="/images/treeView/application.png" label={adaptation.name} onAuxClick={(e) => this.updateAdaptationSelected(e, idProductLine, idApplication, idAdaptation)}>
        {treeItems}
      </TreeItem>
    );
    return treeItem;
  }

  renderApplication(application: Application, idProductLine: number, idApplication: number) {
    let treeItems = [];
    treeItems.push(this.renderApplicationModels(application.models, idProductLine, idApplication));
    let treeAdaptations = [];
    for (let idAdaptation = 0; idAdaptation < application.adaptations.length; idAdaptation++) {
      const adaptation = application.adaptations[idAdaptation];
      treeAdaptations.push(this.renderAdaptation(adaptation, idProductLine, idApplication, idAdaptation));
    }
    treeItems.push(
      <TreeItem icon="/images/treeView/folder.png" label="Adaptations">
        {treeAdaptations}
      </TreeItem>
    )
    let treeItem = (
      <TreeItem icon="/images/treeView/application.png" label={application.name} onAuxClick={(e) => this.updateApplicationSelected(e, idProductLine, idApplication)}>
        {treeItems}
      </TreeItem>
    );
    return treeItem;
  }

  renderApplicationEngineering(productLine: ProductLine, idProductLine: number) {
    let treeItems = [];
    // treeItems.push(this.renderApplicationEngineeringModels(productLine.applicationEngineering.models, idProductLine))
    let treeApplications = [];
    for (let idApplication = 0; idApplication < productLine.applicationEngineering.applications.length; idApplication++) {
      const application = productLine.applicationEngineering.applications[idApplication];
      treeApplications.push(this.renderApplication(application, idProductLine, idApplication));
    }
    treeItems.push(
      <TreeItem icon="/images/treeView/folder.png" label="Applications">
        {treeApplications}
      </TreeItem>
    )
    return treeItems;
  }

  renderProductLine(productLine: ProductLine, idProductLine: number) {
    let treeItem = (
      <TreeItem icon="/images/treeView/productLine.png" label={productLine.name} onAuxClick={(e) => { this.updateLpSelected(e, idProductLine) }}  onDoubleClick={(e) => { this.doubleClickLpSelected(e, idProductLine) }}>
        <TreeItem icon="/images/treeView/domainEngineering.png" label="Domain engineering" dataKey="domainEngineering" onAuxClick={(e) => { this.updateLpSelected(e, idProductLine) }}>
          {this.renderDomainEngineering(productLine, idProductLine)}
        </TreeItem>
        <TreeItem icon="/images/treeView/applicationEngineering.png" label="Application engineering" dataKey="applicationEngineering" onAuxClick={(e) => { this.updateLpSelected(e, idProductLine) }}>
          {this.renderApplicationEngineering(productLine, idProductLine)}
        </TreeItem>
      </TreeItem>
    );
    return treeItem;
  }

  renderProductLines() {
    let treeItems = []
    for (let idProductLine = 0; idProductLine < this.props.projectService.project.productLines.length; idProductLine++) {
      const productLine = this.props.projectService.project.productLines[idProductLine];
      treeItems.push(this.renderProductLine(productLine, idProductLine))
    }
    return treeItems;
  }

  renderProject() {
    let treeItem = (
      <TreeItem icon="/images/treeView/project.png" label={this.props.projectService.project.name}>
        {this.renderProductLines()}
      </TreeItem>
    )
    return (
      <div className="treeView">
        {treeItem}
      </div>
    )
  }

  renderTree() {
    return this.renderProject();

    return (
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
    )
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
        {this.renderTree()}
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
