import { Component } from "react";

import ProjectService from "../../Application/Project/ProjectService";
import NewDialog from "../NewDialog/newDialog";
import OpenDialog from "../OpenDialog/openDialog";
import SaveDialog from "../SaveDialog/saveDialog";

import { SessionUser } from "@variamosple/variamos-components";
import { FaHistory } from "react-icons/fa";
import "./NavBar.css";
import GlobalHistoryPanel from "../HistoryProject/GlobalHistoryPanel";
import { RoleEnum } from "../../Domain/ProductLineEngineering/Enums/roleEnum";

interface Props {
  projectService: ProjectService;
}
interface State {
  firstName: string;
  show_save_modal: boolean;
  show_open_modal: boolean;
  show_new_modal: boolean;
  user?: SessionUser;
  show_global_history: boolean;
  historyRecords: any[];
}

class navBar extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      firstName: "",
      show_save_modal: false,
      show_open_modal: false,
      show_new_modal: false,
      show_global_history: false,
      historyRecords: [],
    }

    this.exportProject = this.exportProject.bind(this);
    this.refreshNavBar = this.refreshNavBar.bind(this);
  }

  componentDidMount() {
  }

  saveProject() {
    if (this.props.projectService.isGuessUser()) {
      this.exportProject();
      return;
    }
    const projectInfo = this.props.projectService.getProjectInformation();
    const currentUser = this.props.projectService.getUser();

    if (!projectInfo || !projectInfo.id || !currentUser) {
      this.handleShowSaveModal();
      return;
    }
    if (projectInfo.role === RoleEnum.OWNER || projectInfo.role === RoleEnum.EDITOR) {
      this.props.projectService.saveProjectInServer(projectInfo, null, null);
      return;
    }
    if (projectInfo.template) {
      alert("This project is a template. Saving a copy instead.");
      this.handleShowSaveModal();
      return;
    }
    alert("You don't have permission to save this project. Saving a copy instead.");
    this.handleShowSaveModal();
  }

  saveProjectAs() {
    let me = this;
    if (this.props.projectService.isGuessUser()) {
      this.exportProject();
    } else {
      this.handleShowSaveModal();
    }
  }

  newProject() {
    let me = this;
    let userId = this.props.projectService.getUser();
    this.handleShowNewModal();
  }

  openProject() {
    let me = this;
    let userId = this.props.projectService.getUser();
    this.handleShowOpenModal();
  }

  //Modal functions
  handleShowSaveModal() {
    this.setState({ show_save_modal: true });
  }

  handleCloseSaveModal() {
    this.setState({ show_save_modal: false });
  }

  handleShowOpenModal() {
    this.setState({ show_open_modal: true });
  }

  handleCloseOpenModal() {
    this.setState({ show_open_modal: false });
  }

  handleShowNewModal() {
    this.setState({ show_new_modal: true });
  }

  handleCloseNewModal() {
    this.setState({ show_new_modal: false });
  }

  exportProject() {
    this.props.projectService.exportProject();
  }

  refreshNavBar() {
    this.forceUpdate();
  }

  showGlobalHistory() {
    this.loadGlobalHistory();
    this.setState({ show_global_history: true });
  }

  hideGlobalHistory() {
    this.setState({ show_global_history: false });
  }

  loadGlobalHistory() {
    const projectInfo = this.props.projectService.getProjectInformation();

    console.log("[Global history] projectInfo:", projectInfo);

    if (!projectInfo?.id) {
      return;
    }

    this.props.projectService
      .getProjectHistory(projectInfo.id)
      .then((response) => {
        this.setState({
          historyRecords:
            response.data?.data ||
            response.data ||
            [],
        });
      });
  }

  saveProjectAfterGlobalRevert() {
    const projectInfo = this.props.projectService.getProjectInformation();

    if (!projectInfo) {
      console.error("[Global history] projectInfo is null");
      return;
    }

    projectInfo.project = this.props.projectService.project;

    this.props.projectService.saveProjectInServer(
      projectInfo,
      () => {
        this.loadGlobalHistory();
        this.forceUpdate();
      },
      (error) => console.error("[Global history] Error saving revert:", error)
    );
  }

  canRevertHistory() {
    const projectInfo = this.props.projectService.getProjectInformation();
    const role = projectInfo?.role;
    return role === RoleEnum.OWNER || role === RoleEnum.EDITOR;
  }

  findProductLineById(productLineId: string) {
    return this.props.projectService.project.productLines.find(
      (pl: any) => pl.id === productLineId
    );
  }

  removeProductLineById(productLineId: string) {
    this.props.projectService.project.productLines =
      this.props.projectService.project.productLines.filter(
        (pl: any) => pl.id !== productLineId
      );
  }

  removeModelById(modelId: string) {
    const project = this.props.projectService.project;

    project.productLines.forEach((pl: any) => {
      if (pl.scope?.models) {
        pl.scope.models = pl.scope.models.filter((m: any) => m.id !== modelId);
      }

      if (pl.domainEngineering?.models) {
        pl.domainEngineering.models = pl.domainEngineering.models.filter(
          (m: any) => m.id !== modelId
        );
      }

      if (pl.applicationEngineering?.models) {
        pl.applicationEngineering.models =
          pl.applicationEngineering.models.filter((m: any) => m.id !== modelId);
      }

      pl.applicationEngineering?.applications?.forEach((app: any) => {
        if (app.models) {
          app.models = app.models.filter((m: any) => m.id !== modelId);
        }

        app.adaptations?.forEach((adaptation: any) => {
          if (adaptation.models) {
            adaptation.models = adaptation.models.filter(
              (m: any) => m.id !== modelId
            );
          }
        });
      });
    });
  }

  restoreModel(model: any) {
    const project = this.props.projectService.project;

    const targetProductLine = project.productLines.find(
      (pl: any) => pl.id === model.parentProductLineId
    );

    if (!targetProductLine) return;

    const restoredModel = { ...model };
    delete restoredModel.parentProductLineId;
    delete restoredModel.parentSection;
    delete restoredModel.parentApplicationId;
    delete restoredModel.parentAdaptationId;

    if (model.parentSection === "scope") {
      targetProductLine.scope.models.push(restoredModel);
    }

    if (model.parentSection === "domainEngineering") {
      targetProductLine.domainEngineering.models.push(restoredModel);
    }

    if (model.parentSection === "applicationEngineering") {
      targetProductLine.applicationEngineering.models.push(restoredModel);
    }

    if (model.parentSection === "application") {
      const application = targetProductLine.applicationEngineering.applications.find(
        (app: any) => app.id === model.parentApplicationId
      );

      if (application) {
        application.models.push(restoredModel);
      }
    }

    if (model.parentSection === "adaptation") {
      const application = targetProductLine.applicationEngineering.applications.find(
        (app: any) => app.id === model.parentApplicationId
      );

      const adaptation = application?.adaptations?.find(
        (adaptation: any) => adaptation.id === model.parentAdaptationId
      );

      if (adaptation) {
        adaptation.models.push(restoredModel);
      }
    }
  }

  findApplicationById(applicationId: string) {
    const project = this.props.projectService.project;

    for (const productLine of project.productLines) {
      const application =
        productLine.applicationEngineering?.applications?.find(
          (app: any) => app.id === applicationId
        );

      if (application) {
        return application;
      }
    }

    return null;
  }

  findAdaptationById(adaptationId: string) {
    const project = this.props.projectService.project;

    for (const productLine of project.productLines) {
      for (const application of productLine.applicationEngineering?.applications || []) {
        const adaptation = application.adaptations?.find(
          (adaptation: any) => adaptation.id === adaptationId
        );

        if (adaptation) {
          return adaptation;
        }
      }
    }

    return null;
  }

  removeApplicationById(applicationId: string) {
    const project = this.props.projectService.project;

    project.productLines.forEach((pl: any) => {
      if (pl.applicationEngineering?.applications) {
        pl.applicationEngineering.applications =
          pl.applicationEngineering.applications.filter(
            (app: any) => app.id !== applicationId
          );
      }
    });
  }

  restoreApplication(application: any) {
    const project = this.props.projectService.project;

    for (const pl of project.productLines) {
      const exists = pl.applicationEngineering?.applications?.some(
        (app: any) => app.id === application.id
      );

      if (exists) return;
    }

    const targetProductLine =
      project.productLines.find(
        (pl: any) => pl.id === application.parentProductLineId
      ) || project.productLines[0];

    if (!targetProductLine.applicationEngineering) {
      targetProductLine.applicationEngineering = {
        models: [],
        languagesAllowed: [],
        applications: []
      };
    }

    if (!targetProductLine.applicationEngineering.applications) {
      targetProductLine.applicationEngineering.applications = [];
    }

    const restoredApplication = { ...application };
    delete restoredApplication.parentProductLineId;

    targetProductLine.applicationEngineering.applications.push(restoredApplication);
  }

  removeAdaptationById(adaptationId: string) {
    const project = this.props.projectService.project;

    project.productLines.forEach((pl: any) => {
      pl.applicationEngineering?.applications?.forEach((app: any) => {
        if (app.adaptations) {
          app.adaptations = app.adaptations.filter(
            (adaptation: any) => adaptation.id !== adaptationId
          );
        }
      });
    });
  }

  restoreAdaptation(adaptation: any) {
    const project = this.props.projectService.project;

    const targetProductLine = project.productLines.find(
      (pl: any) => pl.id === adaptation.parentProductLineId
    );

    if (!targetProductLine) return;

    const targetApplication = targetProductLine.applicationEngineering.applications.find(
      (app: any) => app.id === adaptation.parentApplicationId
    );

    if (!targetApplication) return;

    const restoredAdaptation = { ...adaptation };
    delete restoredAdaptation.parentProductLineId;
    delete restoredAdaptation.parentApplicationId;

    if (!targetApplication.adaptations) {
      targetApplication.adaptations = [];
    }

    targetApplication.adaptations.push(restoredAdaptation);
  }

  revertGlobalHistoryItem = (item: any) => {
    const entityType = String(item.entityType || "").toLowerCase();
    const actionType = String(item.actionType || "").toLowerCase();

    if (entityType === "productline" || entityType === "product_line") {
      if (actionType.includes("deleted")) {
        const exists = this.findProductLineById(item.oldValue.id);

        if (!exists) {
          this.props.projectService.project.productLines.push(item.oldValue);
        }
      }

      if (actionType.includes("created")) {
        this.removeProductLineById(item.entityId);
      }

      if (actionType.includes("updated")) {
        const productLine = this.findProductLineById(item.entityId);

        if (productLine && item.oldValue) {
          productLine.name = item.oldValue.name;
          productLine.domain = item.oldValue.domain;
          productLine.type = item.oldValue.type;
        }
      }
    }

    if (entityType === "model") {
      if (actionType.includes("deleted")) {
        if (item.oldValue) {
          this.restoreModel(item.oldValue);
        }
      }

      if (actionType.includes("created")) {
        this.removeModelById(item.entityId);
      }

      if (actionType.includes("updated")) {
        const model = this.props.projectService.findModelById(
          this.props.projectService.project,
          item.entityId
        );

        if (model && item.oldValue) {
          Object.assign(model, item.oldValue);
        }
      }
    }

    if (entityType === "application") {
      if (actionType.includes("deleted")) {
        if (item.oldValue) {
          this.restoreApplication(item.oldValue);
        }
      }

      if (actionType.includes("created")) {
        this.removeApplicationById(item.entityId);
      }

      if (actionType.includes("updated")) {
        const application = this.findApplicationById(item.entityId);

        if (application && item.oldValue) {
          Object.assign(application, item.oldValue);
        }
      }
    }

    if (entityType === "adaptation") {
      if (actionType.includes("deleted")) {
        if (item.oldValue) {
          this.restoreAdaptation(item.oldValue);
        }
      }

      if (actionType.includes("created")) {
        this.removeAdaptationById(item.entityId);
      }

      if (actionType.includes("updated")) {
        const adaptation = this.findAdaptationById(item.entityId);

        if (adaptation && item.oldValue) {
          Object.assign(adaptation, item.oldValue);
        }
      }
    }

    this.saveProjectAfterGlobalRevert();
  };

  hasOpenedProject() {
    const projectInfo = this.props.projectService.getProjectInformation();
    return !!projectInfo?.id;
  }

  render() {
    return (
      <div className="NavBar">
        <div className="header">
          <a title="New project" onClick={this.newProject.bind(this)}><span><img src="/images/menuIcons/new.png"></img></span></a>{" "}
          <a title="Open project" onClick={this.openProject.bind(this)}><span><img src="/images/menuIcons/open.png"></img></span></a>{" "}
          <a title="Save project" onClick={this.saveProject.bind(this)}><span><img src="/images/menuIcons/save.png"></img></span></a>{" "}
          <a title="Save project as ..." onClick={this.saveProjectAs.bind(this)}><span><img src="/images/menuIcons/saveas.png"></img></span></a>{" "}
          <a title="Download project" onClick={this.exportProject.bind(this)}><span><img src="/images/menuIcons/download.png"></img></span></a>{" "}
          <a title="Settings" onClick={() =>
            document.getElementById("projectManagement").click()
          }><span><img src="/images/menuIcons/settings.png"></img></span></a>{" "}
          {this.hasOpenedProject() && (
            <a title="Project history" onClick={this.showGlobalHistory.bind(this)}>
              <FaHistory />
            </a>
          )}
          <button
            type="button"
            data-bs-toggle="modal"
            data-bs-target="#staticBackdrop"
            className="nav-bar-variamos"
            id="projectManagement"
            hidden={true}
          >
            Project Management
          </button>
        </div>
        <div>
        </div>
        <div>
          {!this.state.show_save_modal ? (
            null
          ) : (
            <SaveDialog show={this.state.show_save_modal} handleCloseCallback={this.handleCloseSaveModal.bind(this)} projectService={this.props.projectService} />
          )}
        </div>
        <div>
          {!this.state.show_open_modal ? (
            null
          ) : (
            <OpenDialog show={this.state.show_open_modal} handleCloseCallback={this.handleCloseOpenModal.bind(this)} projectService={this.props.projectService} />
          )}
        </div>
        <div>
          {!this.state.show_new_modal ? (
            null
          ) : (
            <NewDialog show={this.state.show_new_modal} handleCloseCallback={this.handleCloseNewModal.bind(this)} projectService={this.props.projectService} />
          )}
        </div>
        {this.state.show_global_history && (
          <GlobalHistoryPanel
            show={this.state.show_global_history}
            onHide={this.hideGlobalHistory.bind(this)}
            projectService={this.props.projectService}
            historyRecords={this.state.historyRecords}
            onRefresh={this.loadGlobalHistory.bind(this)}
            onRevertHistoryItem={
              this.canRevertHistory() ? this.revertGlobalHistoryItem : undefined
            }
          />
        )}
      </div>
    );
  }
}

export default navBar;
