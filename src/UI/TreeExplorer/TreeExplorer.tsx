import { Component } from "react";
import { Nav, Tab } from "react-bootstrap";
import Editor from "react-simple-code-editor";
import ProjectService from "../../Application/Project/ProjectService";
import { Adaptation } from "../../Domain/ProductLineEngineering/Entities/Adaptation";
import { Application } from "../../Domain/ProductLineEngineering/Entities/Application";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { ProductLine } from "../../Domain/ProductLineEngineering/Entities/ProductLine";
import { ScopeSPL } from "../../Domain/ProductLineEngineering/Entities/ScopeSPL";
import ScopeModal from "../Scope/ScopeModal";
import {
  getCurrentConstraints,
  setModelConstraints,
} from "../../Domain/ProductLineEngineering/UseCases/QueryUseCases";
import QueryModal from "../Queries/queryModal";
import NavBar from "../WorkSpace/navBar";
import "./TreeExplorer.css";
import { TreeItem } from "./TreeItem";
import TreeMenu from "./TreeMenu";

import { highlight, languages } from "prismjs";

interface Props {
  projectService: ProjectService;
}

interface State {
  contextMenuX: number,
  contextMenuY: number,
  showContextMenu: boolean,
  arbitraryConstraints: string,
  showScopeModal: boolean,
  currentProductLineIndex: number,
}

class TreeExplorer extends Component<Props, State> {
  state = {
    contextMenuX: 100,
    contextMenuY: 100,
    showContextMenu: false,
    arbitraryConstraints: "",
    showScopeModal: false,
    currentProductLineIndex: 0,
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
    this.setArbitraryConstraints = this.setArbitraryConstraints.bind(this);
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

  btn_viewScopeModel(e: any, idPl: number, idScopeModel: number) {
    console.log("treeExplorer btn_viewScopeModel")
    this.props.projectService.modelScopeSelected(idPl, idScopeModel);
    this.props.projectService.saveProject();
    if (e) {
      this.setState({
        showContextMenu: true,
        contextMenuX: e.event.clientX,
        contextMenuY: e.event.clientY
      })
    }
  }

  setArbitraryConstraints(newArbitraryConstraints: string) {
    this.setState({
      ...this.state,
      arbitraryConstraints: newArbitraryConstraints
    })

    //Handle changes on the model's arbitrary constraints
    setModelConstraints(this.props.projectService , this.state.arbitraryConstraints);
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
    } 
    else if (e.target.props.dataKey === "scope") {
      this.props.projectService.updateScopeSelected();
    }
    else if (e.target.props.dataKey === "applicationEngineering") {
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

    me.props.projectService.addScopeModelListener(
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

    //Load constraints on model change
    const constraints = getCurrentConstraints(this.props.projectService);
    this.setArbitraryConstraints(constraints);

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
        <TreeItem key={key} icon="/images/treeView/folder.png" label={key}>
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
        <TreeItem key={model.id} icon="/images/treeView/model.png" label={model.name} onClick={(e) => this.btn_viewDomainModel(null, idProductLine, idModel)} onAuxClick={(e) => this.btn_viewDomainModel( e, idProductLine, idModel ) }>
        </TreeItem>
      )
    }
    return this.renderModelFolders(folders);
  }

  renderScopeModels(models: Model[], idProductLine: number) {
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
        <TreeItem icon="/images/treeView/model.png" label={model.name} onClick={(e) => this.btn_viewScopeModel(null, idProductLine, idModel)} onAuxClick={(e) => this.btn_viewScopeModel( e, idProductLine, idModel ) }>
        </TreeItem>
      )
    }
    return this.renderModelFolders(folders);
  }

  autoLoadScopeModel(idProductLine: number) {
    console.log("Se hizo doble clic en el Scope para idProductLine:", idProductLine);

    let scope = this.props.projectService.project.productLines[idProductLine].scope;

    if (!scope) {
      console.log("Scope no existe, creándolo...");
      const newScope = new ScopeSPL();
      this.props.projectService.project.productLines[idProductLine].scope= newScope;
  }

    if (!scope.models.length || !scope) {
        // Crear automáticamente un modelo de tipo ConceptualMap si no hay modelos en el Scope
        const newConceptualMap = this.props.projectService.createScopeModel(
            this.props.projectService.project,
            "Catalog of potencials products",
            idProductLine,
            "Catalog of potential products"
        );
        this.props.projectService.modelScopeSelected(idProductLine, scope.models.indexOf(newConceptualMap));
        console.log("Modelo ConceptualMap creado y seleccionado automáticamente:", newConceptualMap);
    } else {
        // Intentar seleccionar un modelo existente de tipo ConceptualMap
        const conceptualMap = scope.models.find(model => model.type === "Catalog of potential products");
        if (conceptualMap) {
            this.props.projectService.modelScopeSelected(idProductLine, scope.models.indexOf(conceptualMap));
        } else {
            alert("No hay un modelo ConceptualMap en Scope.");
        }
    }
    this.setState({ showScopeModal: true, currentProductLineIndex: idProductLine });
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
      let icon="/images/treeView/model.png";
      if(model.inconsistent){
         icon="/images/treeView/modelInconsistent.png";
      }
      folders[type].push(
        <TreeItem key={model.id} icon={icon} label={model.name} onClick={(e) => this.btn_viewApplicationModel(
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
        <TreeItem key={model.id} icon="/images/treeView/model.png" label={model.name} onClick={(e) => this.btn_viewAdaptationModel(
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

  renderScope(productLine: ProductLine, idProductLine: number) {
    return this.renderScopeModels(productLine.scope.models, idProductLine)
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
      <TreeItem key="AdaptationTreeItem" icon="/images/treeView/folder.png" label="Adaptations">
        {treeAdaptations}
      </TreeItem>
    )

    let icon="/images/treeView/application.png";
    for (let idModel = 0; idModel < application.models.length; idModel++) {
      const model: Model = application.models[idModel]; 
      if(model.inconsistent){
         icon="/images/treeView/applicationInconsistent.png";
      }
    }

    let treeItem = (
      <TreeItem icon={icon} label={application.name} onAuxClick={(e) => this.updateApplicationSelected(e, idProductLine, idApplication)}>
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
      <TreeItem key="ApplicationsTreeIteem" icon="/images/treeView/folder.png" label="Applications">
        {treeApplications}
      </TreeItem>
    )
    return treeItems;
  }

  renderProductLine(productLine: ProductLine, idProductLine: number) {
    return (
        <TreeItem
            icon="/images/treeView/productLine.png"
            label={productLine.name}
            onAuxClick={(e) => {
                this.updateLpSelected(e, idProductLine);
            }}
            onDoubleClick={(e) => {
                this.doubleClickLpSelected(e, idProductLine);
            }}
        > 
            <TreeItem
                icon="/images/treeView/scope.png"
                label="Scope"
                dataKey="scope"
                onAuxClick={(e) => {
                    this.updateLpSelected(e, idProductLine);
                }}
            >
                {this.renderScope(productLine, idProductLine)}
            </TreeItem>
            <TreeItem
                icon="/images/treeView/domainEngineering.png"
                label="Domain engineering"
                dataKey="domainEngineering"
                onAuxClick={(e) => {
                    this.updateLpSelected(e, idProductLine);
                }}
            >
                {this.renderDomainEngineering(productLine, idProductLine)}
            </TreeItem>
            <TreeItem
                icon="/images/treeView/applicationEngineering.png"
                label="Application engineering"
                dataKey="applicationEngineering"
                onAuxClick={(e) => {
                    this.updateLpSelected(e, idProductLine);
                }}
            >
                {this.renderApplicationEngineering(productLine, idProductLine)}
            </TreeItem>
        </TreeItem>
    );
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
  }

  render() {
    return (
      <div
        id="TreePannel"
        className="TreeExplorer pb-2 d-flex flex-column h-100"
        style={{ zIndex: 5 }}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        <NavBar projectService={this.props.projectService} />

        <div
          className="flex-grow-1 d-grid overflow-hidden"
          style={{ gridTemplateRows: "max-content 1fr" }}
        >
          <Tab.Container defaultActiveKey="project" id="uncontrolled-tab">
            <Nav variant="tabs" className="mb-2">
              <Nav.Item>
                <Nav.Link eventKey="project">Project</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="constraints">Constraints</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="queries">Queries</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content className="overflow-auto d-flex flex-column">
              <Tab.Pane className="" eventKey="project">
                {this.renderTree()}
                <TreeMenu
                  projectService={this.props.projectService}
                  contextMenuX={this.state.contextMenuX}
                  contextMenuY={this.state.contextMenuY}
                  showContextMenu={this.state.showContextMenu}
                  onContextMenuHide={this.onContextMenuHide}
                />
              </Tab.Pane>

              <Tab.Pane className="px-2" eventKey="constraints">
                <p className="text-muted small w-100">
                  Specify any relationships or constraints that cannot be
                  graphically represented in your language using the CLIF
                  language.
                </p>

                <Editor
                  value={this.state.arbitraryConstraints}
                  onValueChange={this.setArbitraryConstraints}
                  highlight={(arbitraryConstraints) =>
                    highlight(arbitraryConstraints, languages.lisp, "lisp")
                  }
                  padding={10}
                  className="editor"
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 18,
                    backgroundColor: "#1e1e1e",
                    caretColor: "gray",
                    color: "gray",
                    borderRadius: "10px",
                    overflow: "auto",
                  }}
                />
              </Tab.Pane>

              <Tab.Pane className="" eventKey="queries">
                <QueryModal
                  handleCloseCallback={() => {}}
                  projectService={this.props.projectService}
                />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </div>
        {this.state.showScopeModal && (
          <ScopeModal
          show={this.state.showScopeModal}
          initialScope={
            this.props.projectService.project.productLines[this.state.currentProductLineIndex].scope
          }
          domain={
            this.props.projectService.project.productLines[this.state.currentProductLineIndex].domain
          }
          onHide={() => this.setState({ showScopeModal: false })}
          onSave={(updatedScope: ScopeSPL) => {
            this.props.projectService.project.productLines[this.state.currentProductLineIndex].scope = updatedScope;
            const projectInfo = this.props.projectService.getProjectInformation();
            this.props.projectService.saveProjectInServer(
              projectInfo,
              (response) => {
                console.log("Proyecto guardado exitosamente:", response);
              },
              (error) => {
                console.error("Error guardando el proyecto:", error);
              }
            );
          }}
          
        />  
        )}
      </div>
      
    );
  }
}

export default TreeExplorer;
