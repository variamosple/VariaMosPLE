import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import { Language } from "../../Domain/ProductLineEngineering/Entities/Language";

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
    this.addNewEModel = this.addNewEModel.bind(this);
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
      "New Application Test"
    );
    this.props.projectService.raiseEventApplication(application);
  }

  addNewAdaptation() {
    let adaptation = this.props.projectService.createAdaptation(
      this.props.projectService.project,
      "New Adaptation"
    );
    this.props.projectService.raiseEventAdaptation(adaptation);
  }

  addNewEModel(language: Language) {
    switch (language.type) {
      case "DOMAIN":
        this.addNewDomainEModel(language.name);
        break;
      case "APPLICATION":
        this.addNewApplicationModel(language.name);
        break;
      case "ADAPTATION":
        this.addNewAdaptationModel(language.name);
        break;

      default:
        console.log("Type language not found");
        break;
    }
  }

  addNewDomainEModel(languageName: string) {
    let domainEngineeringModel =
      this.props.projectService.createDomainEngineeringModel(
        this.props.projectService.project,
        languageName
      );

    this.props.projectService.raiseEventDomainEngineeringModel(
      domainEngineeringModel
    );
  }

  addNewApplicationModel(languageName: string) {
    let applicationModel = this.props.projectService.createApplicationModel(
      this.props.projectService.project,
      languageName
    );
    this.props.projectService.raiseEventApplicationModelModel(applicationModel);
  }

  addNewAdaptationModel(languageName: string) {
    let adaptationModel = this.props.projectService.createAdaptationModel(
      this.props.projectService.project,
      languageName
    );
    this.props.projectService.raiseEventAdaptationModelModel(adaptationModel);
  }

  render() {
    return (
      <div>
        <ul className="dropdown-menu" id="context-menu">
          <li>
            <span className="dropdown-item" id="newModel">
              New Model
              <i className="bi bi-chevron-compact-right float-end"></i>
            </span>
            <ul className="submenu dropdown-menu">
              {this.props.projectService.languages.map(
                (language: Language, i: number) => (
                  <div>
                    {/* Validar si en el lugar seleccionado ya existe el lenguage */}
                    <li>
                      <span
                        className={"dropdown-item type_" + language}
                        key={i}
                        onClick={() => this.addNewEModel(language)}
                      >
                        {language.name + " Model"}
                      </span>
                    </li>
                  </div>
                )
              )}
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
