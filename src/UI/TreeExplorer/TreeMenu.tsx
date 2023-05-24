import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import { Language } from "../../Domain/ProductLineEngineering/Entities/Language";
import * as alertify from "alertifyjs";
import { ExternalFuntion } from "../../Domain/ProductLineEngineering/Entities/ExternalFuntion";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Dropdown from 'react-bootstrap/Dropdown';
import "./TreeMenu.css";
import { ProductLine } from "../../Domain/ProductLineEngineering/Entities/ProductLine";

interface Props {
  projectService: ProjectService;
}
interface State {
}

class TreeMenu extends Component<Props, State> {
  state = {
    menu: false,
    modalTittle: "",
    modalInputText: "",
    modalInputValue: "",
    // Placeholder, we will handle the querys here for now
    query: "",
    selectedFunction: -1,
    // End query state
    optionAllowModelEnable: false,
    optionAllowModelDomain: false,
    optionAllowModelApplication: false,
    optionAllowModelAdaptation: false,
    optionAllowProductLine: false,
    optionAllowApplication: false,
    optionAllowAdaptation: false,
    optionAllowRename: false,
    optionAllowDelete: false,
    optionAllowEFunctions: false,
    newSelected: "default",
    showPropertiesModal: false,
    plDomains: ['Advertising and Marketing', 'Agriculture', 'Architecture and Design', 'Art and Culture', 'Automotive', 'Beauty and Wellness', 'Childcare and Parenting', 'Construction', 'Consulting and Professional Services', 'E-commerce', 'Education', 'Energy and Utilities', 'Environmental Services', 'Event Planning and Management', 'Fashion and Apparel', 'Finance and Banking', 'Food and Beverage', 'Gaming and Gambling', 'Government and Public Sector', 'Healthcare', 'Hospitality and Tourism', 'Insurance', 'Legal Services', 'Manufacturing', 'Media and Entertainment', 'Non-profit and Social Services', 'Pharmaceuticals', 'Photography and Videography', 'Printing and Publishing', 'Real Estate', 'Research and Development', 'Retail', 'Security and Surveillance', 'Software and Web Development', 'Sports and Recreation', 'Telecommunications', 'Transportation and Logistics', 'Travel and Leisure', 'Wholesale and Distribution'],
    plTypes: ['Software', 'System'],
    plDomain: 'Agriculture',
    plType: 'System'
  };

  constructor(props: any) {
    super(props);


    this.addNewProductLine = this.addNewProductLine.bind(this);
    this.addNewApplication = this.addNewApplication.bind(this);
    this.addNewAdaptation = this.addNewAdaptation.bind(this);
    this.addNewDomainEModel = this.addNewDomainEModel.bind(this);
    this.addNewApplicationEModel = this.addNewApplicationEModel.bind(this);
    this.addNewApplicationModel = this.addNewApplicationModel.bind(this);
    this.addNewAdaptationModel = this.addNewAdaptationModel.bind(this);
    this.addNewEModel = this.addNewEModel.bind(this);

    this.projectService_addListener =
      this.projectService_addListener.bind(this);
    this.handleUpdateEditorText = this.handleUpdateEditorText.bind(this);
    this.handleUpdateNewSelected = this.handleUpdateNewSelected.bind(this);
    //Query bindings
    this.runQuery = this.runQuery.bind(this);
    this.updateQuery = this.updateQuery.bind(this);
    this.setSelectedFunction = this.setSelectedFunction.bind(this);
    //End Query bindings
    this.addNewFolder = this.addNewFolder.bind(this);
    this.updateModal = this.updateModal.bind(this);
    this.removeHidden = this.removeHidden.bind(this);
    this.viewMenuTree_addListener = this.viewMenuTree_addListener.bind(this);
    this.deleteItemProject = this.deleteItemProject.bind(this);
    this.renameItemProject = this.renameItemProject.bind(this);
    this.onEnterModal = this.onEnterModal.bind(this);
    this.callExternalFuntion = this.callExternalFuntion.bind(this);


    //handle constraints modal
    this.showPropertiesModal = this.showPropertiesModal.bind(this);
    this.hidePropertiesModal = this.hidePropertiesModal.bind(this);
    this.saveProperties = this.saveProperties.bind(this);

    this.selectProductLineDomainChange = this.selectProductLineDomainChange.bind(this);
    this.selectProductLineTypeChange = this.selectProductLineTypeChange.bind(this);
  }

  selectProductLineDomainChange(e) {
    let me = this;
    this.setState({ 
      plDomain: e.target.value
    })
  }

  selectProductLineTypeChange(e) {
    let me = this;
    this.setState({ 
      plType: e.target.value
    })
  }

  showPropertiesModal(e) {
    let me = this;
    let pl: ProductLine = me.props.projectService.getProductLineSelected();
    this.setState({
      showPropertiesModal: true,
      plDomain: pl.domain,
      plType: pl.type
    })
  }

  hidePropertiesModal() {
    this.setState({ showPropertiesModal: false })
  }

  saveProperties() {
    let me = this;
    let pl: ProductLine = me.props.projectService.getProductLineSelected();
    pl.domain=me.state.plDomain;
    pl.type=me.state.plType; 
    me.hidePropertiesModal();
  }

  callExternalFuntion(efunction: ExternalFuntion, query: any = null): void {
    this.props.projectService.callExternalFuntion(efunction, query, null, null);
  }

  onEnterModal(event: any) {
    if (event.key === "Enter") this.addNewFolder(event);
  }

  deleteItemProject() {
    this.props.projectService.deleteItemProject();
  }

  renameItemProject(newName: string) {
    this.props.projectService.renameItemProject(newName);
  }

  viewMenuTree_addListener() {
    let me = this;

    let optionsAllow = "default";

    if (this.props.projectService.getTreeItemSelected())
      optionsAllow = this.props.projectService.getTreeItemSelected();

    this.removeHidden();

    const enableOptions: any = {
      productLine: () => {
        this.setState({
          optionAllowProductLine: true,
          optionAllowRename: true,
          optionAllowDelete: true,
        });
      },
      domainEngineering: () => {
        me.setState({
          optionAllowModelEnable: true,
          optionAllowModelDomain: true,
          newSelected: "DOMAIN",
        });
      },
      applicationEngineering: () => {
        me.setState({
          optionAllowModelEnable: true,
          optionAllowModelApplication: true,
          optionAllowApplication: true,
          newSelected: "APPLICATION",
        });
      },
      application: function () {
        me.setState({
          optionAllowModelEnable: true,
          optionAllowModelApplication: true,
          optionAllowApplication: true,
          optionAllowAdaptation: true,
          optionAllowRename: true,
          optionAllowDelete: true,
          newSelected: "APPLICATION",
        });
      },
      adaptation: function () {
        me.setState({
          optionAllowModelEnable: true,
          optionAllowModelAdaptation: true,
          optionAllowRename: true,
          optionAllowDelete: true,
          newSelected: "ADAPTATION",
        });
      },
      model: function () {
        me.setState({
          optionAllowDelete: true,
          optionAllowEFunctions: true,
        });
      },
      default: function () {
        return false;
      },
    };

    enableOptions[optionsAllow]();
  }

  removeHidden() {
    this.setState({
      optionAllowModelEnable: false,
      optionAllowModelDomain: false,
      optionAllowModelApplication: false,
      optionAllowModelAdaptation: false,
      optionAllowProductLine: false,
      optionAllowApplication: false,
      optionAllowAdaptation: false,
      optionAllowRename: false,
      optionAllowDelete: false,
      optionAllowEFunctions: false,
    });
  }

  componentDidMount() {
    let me = this;
    me.props.projectService.addLanguagesDetailListener(
      this.projectService_addListener
    );
    me.props.projectService.addUpdateSelectedListener(
      this.viewMenuTree_addListener
    );
    me.props.projectService.addUpdateProjectListener(
      this.projectService_addListener
    );
  }

  handleUpdateEditorText(event: any) {
    this.setState({
      modalInputValue: event.target.value,
    });
  }

  handleUpdateNewSelected(event: any) {
    this.updateModal(event.target.id);
  }

  updateModal(eventId: string) {
    document.getElementById("modalInputValue").focus();

    let me = this;
    const updateModal: any = {
      PRODUCTLINE: function () {
        me.state.modalTittle = "New product line";
        me.state.modalInputText = "Enter new product line name";
      },
      APPLICATION: function () {
        me.state.modalTittle = "New application";
        me.state.modalInputText = "Enter new application name";
      },
      ADAPTATION: function () {
        me.state.modalTittle = "New Adaptation";
        me.state.modalInputText = "Enter new adaptation name";
      },
      renameItem: function () {
        me.state.modalTittle = "Rename";
        me.state.modalInputText = "Enter new name";
      },
      default: function () {
        me.state.modalTittle = "New ";
        me.state.modalInputText = "Enter name";
      },
    };
    updateModal[eventId]();

    this.setState({
      modalTittle: me.state.modalTittle,
      modalInputText: me.state.modalInputText,
      newSelected: eventId,
    });
  }

  projectService_addListener(e: any) {
    this.forceUpdate();
    this.props.projectService.saveProject();
  }

  updateQuery(event: React.ChangeEvent<HTMLTextAreaElement>) {
    this.setState({
      query: event.target.value
    })
  }

  setSelectedFunction(idx) {
    this.setState({
      selectedFunction: idx
    })
  }

  runQuery(_event: any) {
    document.getElementById("closeQueryModal")?.click();
    const query_json = JSON.parse(this.state.query);
    this.callExternalFuntion(this.props.projectService.externalFunctions[this.state.selectedFunction], query_json)
  }

  addNewFolder(event: any) {
    if (this.state.modalInputValue === "") {
      alertify.error("The name is required");
      document.getElementById("modalInputValue")?.focus();
      return false;
    }

    let me = this;
    const add: any = {
      PRODUCTLINE: function () {
        me.addNewProductLine(me.state.modalInputValue, 'System', 'Retail');
      },
      APPLICATION: function () {
        me.addNewApplication(me.state.modalInputValue);
      },
      ADAPTATION: function () {
        me.addNewAdaptation(me.state.modalInputValue);
      },
      renameItem: function () {
        me.renameItemProject(me.state.modalInputValue);
      },
    };

    add[this.state.newSelected]();

    document.getElementById("closeModal")?.click();

    this.setState({
      modalInputValue: "",
    });
  }

  addNewProductLine(productLineName: string, type: string, domain: string) {
    let productLine = this.props.projectService.createLPS(
      this.props.projectService.project,
      productLineName,
      type,
      domain
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
        if (!me.props.projectService.existDomainModel(language.name))
          me.addNewDomainEModel(language.name);
        else alertify.error(language.name + " model already exist.");
      },
      APPLICATION: function () {
        if (
          me.props.projectService.getTreeItemSelected() ===
          "applicationEngineering"
        ) {
          if (!me.props.projectService.existApplicaioninEngModel(language.name))
            me.addNewApplicationEModel(language.name);
          else alertify.error(language.name + " model already exist.");
        } else if (
          !me.props.projectService.existApplicaioninModel(language.name)
        )
          me.addNewApplicationModel(language.name);
        else alertify.error(language.name + " model already exist.");
      },
      ADAPTATION: function () {
        if (!me.props.projectService.existAdaptationModel(language.name))
          me.addNewAdaptationModel(language.name);
        else alertify.error(language.name + " model already exist.");
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

  addNewApplicationEModel(languageName: string) {
    let applicationEngineeringModel =
      this.props.projectService.createApplicationEngineeringModel(
        this.props.projectService.project,
        languageName
      );

    this.props.projectService.raiseEventApplicationEngineeringModel(
      applicationEngineeringModel
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
      <div className="treeMenu">
        <div
          className="modal fade"
          id="editorTextModal"
          tabIndex={-1}
          aria-labelledby="editorTextModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modalTreeMenu-left-variamos">
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
                    id="modalInputValue"
                    placeholder="VariaMosTextEditor"
                    value={this.state.modalInputValue}
                    onChange={this.handleUpdateEditorText}
                    onKeyDown={this.onEnterModal}
                  />
                  <label htmlFor="floatingInput">
                    {this.state.modalInputText}
                  </label>
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
                >
                  Save changes
                </button>
                <div
                  hidden={true}
                  id="closeModal"
                  data-bs-dismiss="modal"
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Create a modal for entering the query as a placeholder */}
        <div
          className="modal fade"
          id="queryModal"
          tabIndex={-1}
          aria-labelledby="queryModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modalQuery-center-variamos">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="queryModalLabel">
                  Please input your query
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
                  <textarea
                    className="form-control"
                    placeholder="Enter your query"
                    id="queryInputTxtArea"
                    style={{ height: "150px" }}
                    value={this.state.query}
                    onChange={this.updateQuery}
                    autoComplete="off"
                  ></textarea>
                  <label htmlFor="newLanguageAbSy">
                    Enter your query
                  </label>
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
                  onClick={this.runQuery}
                >
                  Run Query
                </button>
                <div
                  hidden={true}
                  id="closeQueryModal"
                  data-bs-dismiss="modal"
                ></div>
              </div>
            </div>
          </div>
        </div>
        {/* End new modal */}
        <div
          className="modal fade"
          id="deleteModal"
          tabIndex={-1}
          aria-labelledby="deleteModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modalTreeMenu-left-variamos">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="deleteModalLabel">
                  Delete
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you wish to delete this item?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  No
                </button>
                <button
                  type="button"
                  className="btn btn-Variamos"
                  onClick={this.deleteItemProject}
                  data-bs-dismiss="modal"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>

        <ul className="dropdown-menu" id="context-menu">
          <li>
            <span
              className={
                this.state.optionAllowModelEnable
                  ? "dropdown-item"
                  : "hidden dropdown-item"
              }
              id="newModel"
            >
              New model
              <i className="bi bi-chevron-compact-right float-end"></i>
            </span>
            <ul className="submenu dropdown-menu">
              {this.props.projectService.languages.map(
                (language: Language, i: number) => (
                  <div key={i}>
                    {language.type === this.state.newSelected &&
                      (language.stateAccept === "ACTIVE" ||
                        this.props.projectService.environment ===
                        "development") ? (
                      <li>
                        <span
                          className={"dropdown-item type_" + language}
                          key={i}
                          onClick={() => this.addNewEModel(language)}
                        >
                          {language.name + " Model"}
                        </span>
                      </li>
                    ) : (
                      ""
                    )}
                  </div>
                )
              )}
            </ul>
          </li>
          {this.props.projectService.externalFunctions ? (
            this.props.projectService.externalFunctions.length >= 1 ? (
              <li>
                <span
                  className={
                    this.state.optionAllowEFunctions
                      ? "dropdown-item"
                      : "hidden dropdown-item"
                  }
                  id="model"
                >
                  Tools
                  <i className="bi bi-chevron-compact-right float-end"></i>
                </span>
                <ul className="submenu dropdown-menu">
                  {this.props.projectService.externalFunctions.map(
                    (efunction: ExternalFuntion, i: number) => (
                      <div key={i}>
                        <li>
                          <span
                            className={"dropdown-item"}
                            //Check if the external function needs extra data
                            // TODO: (HACK) for now we trigger this if the header is non-empty.
                            {...(Object.getOwnPropertyNames(efunction.header).length > 0 ? { "data-bs-toggle": "modal", "data-bs-target": "#queryModal", onClick: () => this.setSelectedFunction(i) } : { onClick: () => this.callExternalFuntion(efunction) })}
                          // onClick={() => this.callExternalFuntion(efunction)}
                          >
                            {efunction.label}
                          </span>
                        </li>
                      </div>
                    )
                  )}
                </ul>
              </li>
            ) : (
              ""
            )
          ) : (
            ""
          )}
          <li>
            <span
              className={
                this.state.optionAllowProductLine
                  ? "dropdown-item"
                  : "hidden dropdown-item"
              }
              id="PRODUCTLINE"
              onClick={this.handleUpdateNewSelected}
              data-bs-toggle="modal"
              data-bs-target="#editorTextModal"
            >
              New product line
            </span>
          </li>
          <li>
            <span
              className={
                this.state.optionAllowProductLine
                  ? "dropdown-item"
                  : "hidden dropdown-item"
              }
              onClick={this.showPropertiesModal}
            >
              Properties
            </span>
          </li>
          <li>
            <span
              className={
                this.state.optionAllowApplication
                  ? "dropdown-item"
                  : "hidden dropdown-item"
              }
              id="APPLICATION"
              onClick={this.handleUpdateNewSelected}
              data-bs-toggle="modal"
              data-bs-target="#editorTextModal"
            >
              New application
            </span>
          </li>
          <li>
            <span
              className={
                this.state.optionAllowAdaptation
                  ? "dropdown-item"
                  : "hidden dropdown-item"
              }
              id="ADAPTATION"
              onClick={this.handleUpdateNewSelected}
              data-bs-toggle="modal"
              data-bs-target="#editorTextModal"
            >
              New adaptation
            </span>
          </li>
          <li>
            {this.state.optionAllowRename ? (
              <hr className="dropdown-divider" />
            ) : (
              ""
            )}
          </li>
          <li>
            <span
              className={
                this.state.optionAllowDelete
                  ? "dropdown-item"
                  : "hidden dropdown-item"
              }
              id="deleteItem"
              data-bs-toggle="modal"
              data-bs-target="#deleteModal"
            >
              Delete
            </span>
          </li>
          <li>
            <span
              className={
                this.state.optionAllowRename
                  ? "dropdown-item"
                  : "hidden dropdown-item"
              }
              id="renameItem"
              onClick={this.handleUpdateNewSelected}
              data-bs-toggle="modal"
              data-bs-target="#editorTextModal"
            >
              Rename
            </span>
          </li>
        </ul>
        <script></script>

        <Modal
          show={this.state.showPropertiesModal}
          onHide={this.hidePropertiesModal}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Properties
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              <div className="row">
                <div className="col-md-3">
                  <label >Type</label>
                </div>
                <div className="col-md-9">
                  <select
                    className="form-select"
                    id="newPropertySelectDomain"
                    aria-label="Select type"
                    value={this.state.plType}
                    onChange={this.selectProductLineTypeChange}
                  >
                    {this.state.plTypes.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <br />
              <div className="row">
                <div className="col-md-3">
                  <label >Domain</label>
                </div>
                <div className="col-md-9">
                  <select
                    className="form-select"
                    id="newPropertySelectDomain"
                    aria-label="Select domain"
                    value={this.state.plDomain}
                    onChange={this.selectProductLineDomainChange}
                  >
                    {this.state.plDomains.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={this.hidePropertiesModal}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={this.saveProperties}
            >
              Accept
            </Button>
          </Modal.Footer>
        </Modal>

      </div>
    );
  }
}

export default TreeMenu;
