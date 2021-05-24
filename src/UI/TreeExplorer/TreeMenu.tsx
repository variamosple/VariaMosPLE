import React, { Component } from "react";
import ProjectService from "../../Infraestructure/project/ProjectService";

interface Props {
  projectService: ProjectService;
}
interface State {}

class TreeMenu extends Component<Props, State> {
  state = {};

  constructor(props: any) {
    super(props);

    this.addNewProductLine = this.addNewProductLine.bind(this);
    this.addNewApplication = this.addNewApplication.bind(this);
    this.addNewAdaptation = this.addNewAdaptation.bind(this);
    this.addNewDomainEModel = this.addNewDomainEModel.bind(this);
    this.addNewApplicationModel = this.addNewApplicationModel.bind(this);
    this.addNewAdaptationModel = this.addNewAdaptationModel.bind(this);
  }

  addNewProductLine() {
    let productLine = this.props.projectService.createLPS(
      this.props.projectService.project,
      "New ProductLine Test"
    );
    this.props.projectService.raiseEventNewProductLine(productLine);
    // this.props.projectService.saveProject();
  }

  addNewApplication() {
    let application = this.props.projectService.createApplication(
      this.props.projectService.project,
      "New Application Test",
      0
    );
    this.props.projectService.raiseEventApplication(application);
  }

  addNewAdaptation() {
    let adaptation = this.props.projectService.createAdaptation(
      this.props.projectService.project,
      "New Adaptation",
      0,
      0
    );
    this.props.projectService.raiseEventAdaptation(adaptation);
  }

  addNewDomainEModel() {
    let domainEngineeringModel =
      this.props.projectService.createDomainEngineeringModel(
        this.props.projectService.project,
        "FeatureModel",
        0
      );

    domainEngineeringModel =
      this.props.projectService.createDomainEngineeringModel(
        this.props.projectService.project,
        "ComponentModel",
        0
      );
    this.props.projectService.raiseEventDomainEngineeringModel(
      domainEngineeringModel
    );
  }

  addNewApplicationModel() {
    let applicationModel = this.props.projectService.createApplicationModel(
      this.props.projectService.project,
      "ApplicationModel",
      0,
      0
    );
    this.props.projectService.raiseEventApplicationModelModel(applicationModel);
  }

  addNewAdaptationModel() {
    let adaptationModel = this.props.projectService.createAdaptationModel(
      this.props.projectService.project,
      "AdaptationModel",
      0,
      0,
      0
    );
    this.props.projectService.raiseEventAdaptationModelModel(adaptationModel);
  }

  render() {
    return (
      <div>
        <ul className="dropdown-menu" id="context-menu">
          <li>
            <span className="dropdown-item" id="newModel">
              New Model &raquo;
            </span>
            <ul className="submenu dropdown-menu">
              <li>
                <span
                  className="dropdown-item"
                  id="newDomainModel"
                  onClick={this.addNewDomainEModel}
                >
                  New Domain Model
                </span>
              </li>
              <li>
                <span
                  className="dropdown-item"
                  id="newDomainModel"
                  onClick={this.addNewApplicationModel}
                >
                  New Application Model
                </span>
              </li>
              <li>
                <span
                  className="dropdown-item"
                  id="newDomainModel"
                  onClick={this.addNewAdaptationModel}
                >
                  New Adaptation Model
                </span>
              </li>
            </ul>
          </li>
          <li>
            <span
              className="dropdown-item"
              id="newProducLine"
              onClick={this.addNewProductLine}
            >
              New Product Line
            </span>
          </li>
          <li>
            <span
              className="dropdown-item"
              id="newApplication"
              onClick={this.addNewApplication}
            >
              New Application
            </span>
          </li>
          <li>
            <span
              className="dropdown-item"
              id="newAdaptation"
              onClick={this.addNewAdaptation}
            >
              New Adaptation
            </span>
          </li>
          <li>
            <hr className="dropdown-divider" />
          </li>
          <li>
            <span className="dropdown-item" id="renameItem">
              Raname
            </span>
          </li>
          <li>
            <span className="dropdown-item" id="deleteItem">
              Delete
            </span>
          </li>
        </ul>
        <script></script>
      </div>
    );
  }
}

export default TreeMenu;
