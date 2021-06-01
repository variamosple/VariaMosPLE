import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import { Language } from "../../Domain/ProductLineEngineering/Entities/Language";

interface Props {
  projectService: ProjectService;
}
interface State {}

class TreeMenu extends Component<Props, State> {
  state = {
    editorText: "",
    newSelected: "default",
    modalTittle: "",
    modalInput: "",
  };

  constructor(props: any) {
    super(props);

    this.addNewProductLine = this.addNewProductLine.bind(this);
    this.addNewApplication = this.addNewApplication.bind(this);
    this.addNewAdaptation = this.addNewAdaptation.bind(this);
    this.addNewDomainEModel = this.addNewDomainEModel.bind(this);
    this.addNewApplicationModel = this.addNewApplicationModel.bind(this);
    this.addNewAdaptationModel = this.addNewAdaptationModel.bind(this);
    this.addNewEModel = this.addNewEModel.bind(this);

    this.projectService_addListener =
      this.projectService_addListener.bind(this);
    this.handleUpdateEditorText = this.handleUpdateEditorText.bind(this);
    this.handleUpdateNewSelected = this.handleUpdateNewSelected.bind(this);
    this.addNewFolder = this.addNewFolder.bind(this);
    this.updateModal = this.updateModal.bind(this);
  }

  componentDidMount() {
    let me = this;
    me.props.projectService.addLanguagesDetailListener(
      this.projectService_addListener
    );
  }

  handleUpdateEditorText(event: any) {
    this.setState({
      editorText: event.target.value,
    });
  }

  handleUpdateNewSelected(event: any) {
    this.setState({
      newSelected: event.target.id,
    });
    this.updateModal(event.target.id);
  }

  updateModal(eventId: string) {
    let me = this;
    const add: any = {
      newProducLine: function () {
        me.state.modalTittle = "New product line";
        me.state.modalInput = "Enter new product line name";
      },
      newApplication: function () {
        me.state.modalTittle = "New application";
        me.state.modalInput = "Enter new application name";
      },
      newAdaptation: function () {
        me.state.modalTittle = "New Adaptation";
        me.state.modalInput = "Enter new adaptation name";
      },
      renameItem: function () {
        me.state.modalTittle = "Rename";
        me.state.modalInput = "Enter new name";
      },
      default: function () {
        me.state.modalTittle = "New ";
        me.state.modalInput = "Enter name";
      },
    };
    add[eventId]();

    this.setState({
      modalTittle: me.state.modalTittle,
      modalInput: me.state.modalInput,
    });
  }

  projectService_addListener(e: any) {
    this.forceUpdate();
    this.props.projectService.saveProject();
  }

  addNewFolder(event: any) {
    let me = this;
    const add: any = {
      newProducLine: function () {
        me.addNewProductLine(me.state.editorText);
      },
      newApplication: function () {
        me.addNewApplication(me.state.editorText);
      },
      newAdaptation: function () {
        me.addNewAdaptation(me.state.editorText);
      },
    };

    add[this.state.newSelected]();
  }

  addNewProductLine(productLineName: string) {
    let productLine = this.props.projectService.createLPS(
      this.props.projectService.project,
      productLineName
    );
    this.props.projectService.raiseEventNewProductLine(productLine);
    this.props.projectService.saveProject();
  }

  addNewApplication(applicationName: string) {
    let application = this.props.projectService.createApplication(
      this.props.projectService.project,
      applicationName
    );
    this.props.projectService.raiseEventApplication(application);
    this.props.projectService.saveProject();
  }

  addNewAdaptation(adaptationName: string) {
    let adaptation = this.props.projectService.createAdaptation(
      this.props.projectService.project,
      adaptationName
    );
    this.props.projectService.raiseEventAdaptation(adaptation);
    this.props.projectService.saveProject();
  }

  addNewEModel(language: Language) {
    let me = this;
    const add: any = {
      DOMAIN: function () {
        me.addNewDomainEModel(language.name);
      },
      APPLICATION: function () {
        me.addNewApplicationModel(language.name);
      },
      ADAPTATION: function () {
        me.addNewAdaptationModel(language.name);
      },
    };

    add[language.type]();
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
    this.props.projectService.saveProject();
  }

  addNewApplicationModel(languageName: string) {
    let applicationModel = this.props.projectService.createApplicationModel(
      this.props.projectService.project,
      languageName
    );
    this.props.projectService.raiseEventApplicationModelModel(applicationModel);
    this.props.projectService.saveProject();
  }

  addNewAdaptationModel(languageName: string) {
    let adaptationModel = this.props.projectService.createAdaptationModel(
      this.props.projectService.project,
      languageName
    );
    this.props.projectService.raiseEventAdaptationModelModel(adaptationModel);
    this.props.projectService.saveProject();
  }

  render() {
    return (
      <div>
        <div
          className="modal fade"
          id="editorTextModal"
          tabIndex={-1}
          aria-labelledby="editorTextModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="editorTextModalLabel">
                  {this.state.modalTittle}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInput"
                    placeholder="VariaMosTextEditor"
                    value={this.state.editorText}
                    onChange={this.handleUpdateEditorText}
                  />
                  <label htmlFor="floatingInput">{this.state.modalInput}</label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-Variamos"
                  onClick={this.addNewFolder}
                  data-bs-dismiss="modal"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>

        <ul className="dropdown-menu" id="context-menu">
          <li>
            <span className="dropdown-item" id="newModel">
              New Model
              <i className="bi bi-chevron-compact-right float-end"></i>
            </span>
            <ul className="submenu dropdown-menu">
              {this.props.projectService.languagesDetail.map(
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
              onClick={this.handleUpdateNewSelected}
              data-bs-toggle="modal"
              data-bs-target="#editorTextModal"
            >
              New Product Line
            </span>
          </li>
          <li>
            <span
              className="dropdown-item"
              id="newApplication"
              onClick={this.handleUpdateNewSelected}
              data-bs-toggle="modal"
              data-bs-target="#editorTextModal"
            >
              New Application
            </span>
          </li>
          <li>
            <span
              className="dropdown-item"
              id="newAdaptation"
              onClick={this.handleUpdateNewSelected}
              data-bs-toggle="modal"
              data-bs-target="#editorTextModal"
            >
              New Adaptation
            </span>
          </li>
          <li>
            <hr className="dropdown-divider" />
          </li>
          <li>
            <span
              className="dropdown-item"
              id="renameItem"
              onClick={this.handleUpdateNewSelected}
              data-bs-toggle="modal"
              data-bs-target="#editorTextModal"
            >
              Raname
            </span>
          </li>
          <li>
            <span
              className="dropdown-item"
              id="deleteItem"
              // onClick={this.handleUpdateNewSelected}
              // data-bs-toggle="modal"
              data-bs-target="#editorTextModal"
            >
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
