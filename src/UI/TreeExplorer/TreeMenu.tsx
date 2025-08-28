import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import { Language } from "../../Domain/ProductLineEngineering/Entities/Language";
import * as alertify from "alertifyjs";
import { ExternalFuntion } from "../../Domain/ProductLineEngineering/Entities/ExternalFuntion";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { Dropdown, DropdownButton } from 'react-bootstrap';
import "./TreeMenu.css";
import { ProductLine } from "../../Domain/ProductLineEngineering/Entities/ProductLine";
import { ConfigurationInformation } from "../../Domain/ProductLineEngineering/Entities/ConfigurationInformation";
import ConfigurationManagement from "../ConfigurationManagement/configurationManagement";
import { ScopeSPL } from "../../Domain/ProductLineEngineering/Entities/ScopeSPL";
import ScopeModal from "../Scope/ScopeModal";
import ModelInformationEditor from "./ModelInformationEditor";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";

interface Props {
  projectService: ProjectService;
  contextMenuX: number;
  contextMenuY: number;
  showContextMenu: boolean;
  onContextMenuHide: any;
}
interface State {
  menu: boolean,
  modalTittle: string,
  modalInputText: string,
  modalInputValue: string, 
  query: string,
  selectedFunction: number,
  optionAllowModelEnable: boolean,
  optionScopeEnable: boolean,
  optionAllowModelScope: boolean,
  optionAllowModelDomain: boolean,
  optionAllowModelApplication: boolean,
  optionAllowModelAdaptation: boolean,
  optionAllowProductLine: boolean,
  optionAllowApplication: boolean,
  optionAllowAdaptation: boolean,
  optionAllowProperties: boolean,
  optionAllowRename: boolean,
  optionAllowDelete: boolean,
  optionAllowEFunctions: boolean,
  optionAllowAnalyzeScope: boolean,
  newSelected: string,
  showPropertiesModal: boolean,
  plDomains: string[],
  plTypes: string[],
  plDomain: string,
  plType: string,
  plName: string,
  showContextMenu: boolean,
  showEditorTextModal: boolean,
  showModelInformationEditorModal: boolean,
  showQueryModal: boolean,
  showDeleteModal: boolean,
  newModelLanguage?: Language,
  showSaveConfigurationModal: boolean,
  configurationName: string,
  showConfigurationManagementModal: boolean,
  showScopeManagementModal: boolean,
  selectedScopeId?: string,
  showScopeModal: boolean
  model: Model
}

class TreeMenu extends Component<Props, State> {
  state = {
    menu: false,
    modalTittle: "",
    modalInputText: "",
    modalInputValue: "", 
    query: "",
    selectedFunction: -1,
    optionAllowModelEnable: false,
    optionScopeEnable: false,
    optionAllowModelScope: false,
    optionAllowModelDomain: false,
    optionAllowModelApplication: false,
    optionAllowModelAdaptation: false,
    optionAllowProductLine: false,
    optionAllowApplication: false,
    optionAllowAdaptation: false,
    optionAllowProperties: false,
    optionAllowRename: false,
    optionAllowDelete: false,
    optionAllowEFunctions: false,
    optionAllowAnalyzeScope: false,
    newSelected: "default",
    showPropertiesModal: false,
    plDomains: ['Advertising and Marketing', 'Agriculture', 'Architecture and Design', 'Art and Culture', 'Automotive', 'Beauty and Wellness', 'Childcare and Parenting', 'Construction', 'Consulting and Professional Services', 'E-commerce', 'Education', 'Energy and Utilities', 'Environmental Services', 'Event Planning and Management', 'Fashion and Apparel', 'Finance and Banking', 'Food and Beverage', 'Gaming and Gambling', 'Government and Public Sector', 'Healthcare', 'Hospitality and Tourism', 'Insurance', 'Legal Services', 'Manufacturing', 'Media and Entertainment', 'Non-profit and Social Services', 'Pharmaceuticals', 'Photography and Videography', 'Printing and Publishing', 'Real Estate', 'Research and Development', 'Retail', 'Security and Surveillance', 'Software and Web Development', 'Sports and Recreation', 'Telecommunications', 'Transportation and Logistics', 'Travel and Leisure', 'Wholesale and Distribution', "IoT", "IndustrialControlSystems", "HealthCare", "Communication", "Military", "WebServices", "Transportation", "SmartPhones", "PublicAdministration", "Multi-Domain", "Banking", "EmergencyServices", "Cloud-Provider"],
    plTypes: ['Software', 'System'],
    plDomain: 'Agriculture',
    plType: 'System',
    plName: null,
    showContextMenu: false,
    showEditorTextModal: false,
    showModelInformationEditorModal: false,
    showQueryModal: false,
    showDeleteModal: false,
    newModelLanguage: null,
    showSaveConfigurationModal: false,
    configurationName: "Configuration 1",
    showConfigurationManagementModal: false,
    showScopeManagementModal: false,
    selectedScopeId: undefined,
    showScopeModal: false,
    model: null
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

    this.projectService_addListener = this.projectService_addListener.bind(this);
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
    this.saveConfiguration = this.saveConfiguration.bind(this);
    this.showSaveConfigurationModal = this.showSaveConfigurationModal.bind(this);
    this.onEnterModal = this.onEnterModal.bind(this);
    this.callExternalFuntion = this.callExternalFuntion.bind(this);


    //handle editortext modal
    this.showEditorTextModal = this.showEditorTextModal.bind(this);
    this.hideEditorTextModal = this.hideEditorTextModal.bind(this);

    //handle query modal
    this.showQueryModal = this.showQueryModal.bind(this);
    this.hideQueryModal = this.hideQueryModal.bind(this);

    //handle delete modal
    this.showDeleteModal = this.showDeleteModal.bind(this);
    this.hideDeleteModal = this.hideDeleteModal.bind(this);

    //handle properties modal
    this.showPropertiesModal = this.showPropertiesModal.bind(this);
    this.hidePropertiesModal = this.hidePropertiesModal.bind(this);
    this.saveProperties = this.saveProperties.bind(this);

    this.selectProductLineNameChange = this.selectProductLineNameChange.bind(this);
    this.selectProductLineDomainChange = this.selectProductLineDomainChange.bind(this);
    this.selectProductLineTypeChange = this.selectProductLineTypeChange.bind(this);
  }

  selectProductLineNameChange(e) {
    let me = this;
    this.setState({
      plName: e.target.value
    })
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
      plName: pl.name,
      plDomain: pl.domain,
      plType: pl.type
    })
    this.hideContextMenu();
    me.forceUpdate();
  }

  hidePropertiesModal() {
    this.setState({ showPropertiesModal: false })
  }

  showEditorTextModal() {
    this.setState({ showEditorTextModal: true })
  }

  hideEditorTextModal() {
    this.setState({ showEditorTextModal: false })
  }

  showModelPropertiesModal=()=> {
    let me=this;
    let project=me.props.projectService.project;
    let modelId=me.props.projectService.getTreeIdItemSelected();
    let model=me.props.projectService.findModelById(project, modelId);
    this.setState({
      model: model,
      showModelInformationEditorModal: true
    })
  }

  showModelInformationEditorModal(model: Model) {
    this.setState({
      model: model,
      showModelInformationEditorModal: true
    })
  }

  hideModelInformationEditorModal() {
    this.setState({ showModelInformationEditorModal: false })
  }

  showQueryModal() {
    this.setState({ showQueryModal: true })
  }

  hideQueryModal() {
    this.setState({ showQueryModal: false })
  }

  showDeleteModal() {
    this.hideContextMenu();
    this.setState({ showDeleteModal: true })
  }

  hideDeleteModal() {
    this.setState({ showDeleteModal: false })
  }

  showSaveConfigurationModal() {
    this.hideContextMenu();
    this.setState({ showSaveConfigurationModal: true })
  }

  hideSaveConfigurationModal() {
    this.setState({ showSaveConfigurationModal: false })
  }

  showConfigurationManagementModal() {
    this.hideContextMenu();
    this.setState({ showConfigurationManagementModal: true })
  }

  hideConfigurationManagementModal() {
    this.setState({ showConfigurationManagementModal: false })
  }

  showScopeManagementModal() {
    this.hideContextMenu();
    this.setState({ showScopeManagementModal: true })
  }

  hideScopeManagementModal() {
    this.setState({ showScopeManagementModal: false })
  }



  saveProperties() {
    let me = this;
    let pl: ProductLine = me.props.projectService.getProductLineSelected();
    pl.name = me.state.plName;
    pl.domain = me.state.plDomain;
    pl.type = me.state.plType;
    me.hidePropertiesModal();
    me.forceUpdate();
  }

  callExternalFuntion(efunction: ExternalFuntion, query: any = null): void {
    this.props.projectService.callExternalFuntion(efunction, query, null, null);
  }

  onEnterModal(event: any) {
    if (event.key === "Enter") this.addNewFolder(event);
  }

  deleteItemProject() {
    this.hideDeleteModal();
    this.props.projectService.deleteItemProject();
  }

  saveConfiguration() {
    this.hideContextMenu();
    this.hideSaveConfigurationModal();

    let successCallback = (e: any) => {
      alert("Configuration saved.");
    }

    let errorCallback = (e: any) => {
      alert("Configuration not saved.");
    }
    let configurationInformation = new ConfigurationInformation("1", this.state.configurationName, null, null);
    this.props.projectService.saveConfigurationInServer(configurationInformation, successCallback, errorCallback);
  }

  renameItemProject(newName: string) {
    this.props.projectService.renameItemProject(newName);
  }

  getItemProjectName() {
    return this.props.projectService.getItemProjectName();
  }

  showContextMenu() {
    this.setState({
      showContextMenu: true
    })
  }

  hideContextMenu() {
    this.setState({
      showContextMenu: false
    })
    if (this.props.onContextMenuHide) {
      this.props.onContextMenuHide({ target: this });
    }
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
      scopeSPLOLD: () => {
        const selectedItem = this.props.projectService.getSelectedScope();
        this.setState({ optionScopeEnable: true });
        if (!selectedItem) {
          console.warn("No valid scope selected");
          return;
        }

        if (this.state.selectedScopeId !== selectedItem.id) {
          console.log("Selected Scope Item:", selectedItem);
          this.setState({
            selectedScopeId: selectedItem.id,
            optionScopeEnable: true,
            newSelected: "SCOPE",
          });
        }
      },
      scope: () => {
        console.log()
        if(this.props.projectService.project.productLines[this.props.projectService.getIdCurrentProductLine()].scope.models.length > 0){
          me.setState({
          optionAllowAnalyzeScope: true,
        });
        }
        me.setState({
          optionAllowModelEnable: true,
          optionAllowModelScope: true,
          newSelected: "SCOPE",
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
          optionAllowModelEnable: false,
          optionAllowModelApplication: true,
          optionAllowApplication: true,
          newSelected: "APPLICATION",
        });
      },
      application: function () {
        me.setState({
          optionAllowModelEnable: true,
          optionAllowModelApplication: true,
          optionAllowApplication: false,
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
          optionAllowProperties: true,
          optionAllowRename: true,
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
      optionScopeEnable: false,
      optionAllowModelScope: false,
      optionAllowModelDomain: false,
      optionAllowModelApplication: false,
      optionAllowModelAdaptation: false,
      optionAllowProductLine: false,
      optionAllowApplication: false,
      optionAllowAdaptation: false,
      optionAllowProperties: false,
      optionAllowRename: false,
      optionAllowDelete: false,
      optionAllowEFunctions: false,
      optionAllowAnalyzeScope: false,
    });
  }

  componentDidMount() {
    (window as any).projectService = this.props.projectService;

  // 2) Notificar al resto de componentes que el service está listo
  window.dispatchEvent(new CustomEvent("projectservice:ready"));

  // 3) Forzar la carga de lenguajes (dispara listeners)
  try { this.props.projectService.refreshLanguageList?.(); } catch {}
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
    me.props.projectService.addRequestSaveConfigurationListener(
      this.projectService_requestSaveConfigurationListener.bind(this)
    );
    me.props.projectService.addRequestOpenConfigurationListener(
      this.projectService_requestOpenConfigurationListener.bind(this)
    );

    this.setState({
      plDomains: this.props.projectService.getProductLineDomainsList(),
      plTypes: this.props.projectService.getProductLineTypesList()
    })
  }

  componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
    let me = this;
    if (prevProps.showContextMenu != this.props.showContextMenu) {
      if (!this.props.showContextMenu) {
        me.setState({
          showContextMenu: this.props.showContextMenu
        })
        return;
      }
    }
    if (prevProps.contextMenuX != this.props.contextMenuX || prevProps.contextMenuY != this.props.contextMenuY) {
      me.viewMenuTree_addListener();
      me.setState({
        showContextMenu: this.props.showContextMenu
      })
    }
  }

  handleUpdateEditorText(event: any) {
    this.setState({
      modalInputValue: event.target.value
    });
  }

  handleUpdateNewSelected(event: any) {
    this.hideContextMenu();
    this.updateModal(event.target.id, event.target.value);
  }

  inputConfigurationName_onChange(event: any) {
    this.setState({
      configurationName: event.target.value,
    });
  }

  updateModal(eventId: string, value: string) {

    let me = this;
    me.state.modalInputValue = value; 
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
      MODEL: function () {
        me.state.modalTittle = "New model";
        me.state.modalInputText = "Enter new model name";
      },
      renameItem: function () {
        me.state.modalTittle = "Rename";
        me.state.modalInputText = "Enter new name";
        me.state.modalInputValue = me.getItemProjectName();
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

    this.hideContextMenu();

    if (me.state.modalInputText == "Enter new model name") {
      let model = new Model("1", value,"none","0", null, null, null, null);
      this.showModelInformationEditorModal(model);
    } else {
      this.showEditorTextModal();
    }
  }

  projectService_addListener(e: any) {
    this.forceUpdate();
    this.props.projectService.saveProject();
  }

  projectService_requestSaveConfigurationListener(e: any) {
    let me = this;
    this.showSaveConfigurationModal();
  }

  projectService_requestOpenConfigurationListener(e: any) {
    let me = this;
    this.showConfigurationManagementModal();
  }

  projectService_requestOpenScopeManagementListener(e: any) {
    let me = this;
    this.showScopeManagementModal();
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
    this.hideQueryModal();
    const query_json = JSON.parse(this.state.query);
    this.callExternalFuntion(this.props.projectService.externalFunctions[this.state.selectedFunction], query_json)
  }

  modelInformationEditorModal_onAccept = (e) => {
    let me = this;
    if (this.state.model.name === "") {
      alertify.error("The name is required");
      return;
    }
    if([null, '0'].includes(this.state.model.languageId)){
      me.addNewModel(this.state.model.name, this.state.model.description, this.state.model.author, this.state.model.source);
    }else{
      me.props.projectService.saveProject();
    }
    me.hideModelInformationEditorModal();
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
      MODEL: function () {
        me.addNewModel(me.state.modalInputValue, null, null, null);
      },
      renameItem: function () {
        me.renameItemProject(me.state.modalInputValue);
      },
    };

    add[this.state.newSelected]();

    this.setState({
      modalInputValue: "",
    });

    this.hideEditorTextModal();
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
    me.hideContextMenu();
    me.state.newModelLanguage = language;
    let e = { target: { id: "MODEL", value: language.name} }
    this.handleUpdateNewSelected(e);

    // const add: any = {
    //   DOMAIN: function () {
    //     me.addNewDomainEModel(language.name, name );
    //   },
    //   APPLICATION: function () {
    //     if (me.props.projectService.getTreeItemSelected() === "applicationEngineering") {
    //       me.addNewApplicationEModel(language.name, name );
    //     }
    //     else {
    //       me.addNewApplicationModel(language.name, name );
    //     } 
    //   },
    //   ADAPTATION: function () {
    //     me.addNewAdaptationModel(language.name, name );
    //   },
    // };

    // add[language.type]();
  }

  addNewModel(name: string, description: string, author: string, source: string) {
    let me = this;
    let language: Language = me.state.newModelLanguage;
    const add: any = {
      SCOPE: function () {
        me.addNewScopeModel(language.name, "" + language.id, name, description, author, source);
      },
      DOMAIN: function () {
        me.addNewDomainEModel(language.name, "" + language.id, name, description, author, source);
      },
      APPLICATION: function () {
        if (me.props.projectService.getTreeItemSelected() === "applicationEngineering") {
          me.addNewApplicationEModel(language.name, "" + language.id, name, description, author, source);
        }
        else {
          me.addNewApplicationModel(language.name, "" + language.id, name, description, author, source);
        }
      },
      ADAPTATION: function () {
        me.addNewAdaptationModel(language.name, "" + language.id, name, description, author, source);
      },
    };

    add[language.type]();
  }


  addNewScopeModel(languageName: string, languageId: string, name: string, description: string, author: string, source: string) {
    let model =
      this.props.projectService.createScopeModel(
        this.props.projectService.project,
        languageName,
        languageId,
        name,
        description,
        author,
        source
      );

    this.props.projectService.raiseEventScopeModel(
      model
    );
    this.props.projectService.saveProject();
  }


  addNewDomainEModel(languageName: string, languageId: string, name: string, description: string, author: string, source: string) {
    let domainEngineeringModel =
      this.props.projectService.createDomainEngineeringModel(
        this.props.projectService.project,
        languageName,
        languageId,
        name,
        description,
        author,
        source
      );

    this.props.projectService.raiseEventDomainEngineeringModel(
      domainEngineeringModel
    );
    this.props.projectService.saveProject();
  }

  addNewApplicationEModel(languageName: string, languageId: string, name: string, description: string, author: string, source: string) {
    let applicationEngineeringModel =
      this.props.projectService.createApplicationEngineeringModel(
        this.props.projectService.project,
        languageName,
        languageId,
        name,
        description,
        author,
        source
      );

    this.props.projectService.raiseEventApplicationEngineeringModel(
      applicationEngineeringModel
    );
    this.props.projectService.saveProject();
  }

  addNewApplicationModel(languageName: string, languageId: string, name: string, description: string, author: string, source: string) {
    let applicationModel = this.props.projectService.createApplicationModel(
      this.props.projectService.project,
      languageName,
      languageId,
      name,
      description,
      author,
      source
    );
    this.props.projectService.raiseEventApplicationModelModel(applicationModel);
    this.props.projectService.saveProject();
  }

  addNewAdaptationModel(languageName: string, languageId: string, name: string, description: string, author: string, source: string) {
    let adaptationModel = this.props.projectService.createAdaptationModel(
      this.props.projectService.project,
      languageName,
      languageId,
      name,
      description,
      author,
      source
    );
    this.props.projectService.raiseEventAdaptationModelModel(adaptationModel);
    this.props.projectService.saveProject();
  }

  configurationManagement_onConfigurationSelected(e) {
    this.hideConfigurationManagementModal();
  }

  scopeManagement_onScopeSelected(e) {
    this.hideScopeManagementModal();
  }

  handleScopeManagement() {
    const productLines = this.props.projectService.project.productLines;
    const selectedProductLineId = this.props.projectService.getTreeIdItemSelected();

    // Encuentra el Scope asociado al product line seleccionado
    const selectedScopeModel = productLines
      .find((pl) => pl.id === selectedProductLineId)
      ?.scope?.models[0]; // Cambiar el índice si necesitas un modelo específico

    if (!selectedScopeModel) {
      console.error("No scope model found for the selected product line.");
      return;
    }

    console.log("Forcing Scope Management with ID:", selectedScopeModel.id);

    // Actualiza el Tree ID seleccionado y lanza el evento
    this.props.projectService.updateScopeSelectedOri(selectedScopeModel.id);

    // Llama a la lógica necesaria para manejar la configuración
    this.props.projectService.getAllConfigurations(
      (configurations) => {
        console.log("Configurations loaded:", configurations);
        // Aquí puedes abrir un modal o realizar cualquier acción con las configuraciones cargadas.
      },
      (error) => {
        console.error("Error loading configurations:", error);
      }
    );
  }
  handleAnalyzeScope = () => {
    // cierra el menú
    this.hideContextMenu();
    // abre el modal
    this.setState({ showScopeModal: true });
  }

  handleCloseAnalyzerScope = () => {
    this.setState({ showScopeModal: false });
  }


  renderContexMenu() {
    let items = [];

    if (this.state.optionAllowProductLine) {
      items.push(<Dropdown.Item href="#" onClick={this.handleUpdateNewSelected} id="PRODUCTLINE">New product line</Dropdown.Item>);
      items.push(<Dropdown.Item href="#" onClick={this.showPropertiesModal}>Properties</Dropdown.Item>);
    }
    if (this.state.optionScopeEnable) {
      console.log("Rendering Scope management button");
      items.push(
        <Dropdown.Item
          href="#"
          onClick={this.showScopeManagementModal.bind(this)}
          id="SCOPE"
        >
          Scope management
        </Dropdown.Item>
      );
    }

    if (this.state.optionAllowApplication) {
      items.push(<Dropdown.Item href="#" onClick={this.handleUpdateNewSelected} id="APPLICATION">New application</Dropdown.Item>);
    }
    if (this.state.optionAllowAdaptation) {
      items.push(<Dropdown.Item href="#" onClick={this.handleUpdateNewSelected} id="ADAPTATION">New adaptation</Dropdown.Item>);
    }
    if (this.state.optionAllowProperties) {
      items.push(<Dropdown.Item href="#" onClick={this.showModelPropertiesModal} id="propertiesItem">Properties</Dropdown.Item>);
    }
    if (this.state.optionAllowRename) {
      items.push(<Dropdown.Item href="#" onClick={this.handleUpdateNewSelected} id="renameItem">Rename</Dropdown.Item>);
    }
    if (this.state.optionAllowDelete) {
      items.push(<Dropdown.Item href="#" onClick={this.showDeleteModal} id="deleteItem">Delete</Dropdown.Item>);
    }
    if (this.state.optionAllowModelEnable) {
      let children = [];
      for (let i = 0; i < this.props.projectService.languages.length; i++) {
        const language: Language = this.props.projectService.languages[i];
        if (language.type === this.state.newSelected) {
          children.push(<Dropdown.Item href="#" onClick={() => this.addNewEModel(language)} id="newModel" key={i}>{language.name}</Dropdown.Item>)
        }
      }
      items.push(<DropdownButton id="nested-dropdown" title="New model" key="end" drop="end" variant="Info">{children}</DropdownButton>);
    }
        if (this.state.optionAllowAnalyzeScope) {
      items.push(
        <Dropdown.Item
          href="#"
          onClick={() => this.handleAnalyzeScope()}
          key="analyzeScope"
        >
          Technical metrics of scope
        </Dropdown.Item>
      );
    }
    if (this.state.optionAllowEFunctions) {
      if (this.props.projectService.externalFunctions) {
        if (this.props.projectService.externalFunctions.length >= 1) {
          let children = [];
          for (let i = 0; i < this.props.projectService.externalFunctions.length; i++) {
            const efunction: ExternalFuntion = this.props.projectService.externalFunctions[i];
            if (Object.getOwnPropertyNames(efunction.header).length > 0) {
              children.push(<Dropdown.Item href="#" onClick={() => this.setSelectedFunction(i)} id="newModel" key={i}>{efunction.label}</Dropdown.Item>)
            } else {
              children.push(<Dropdown.Item href="#" onClick={() => this.callExternalFuntion(efunction)} id="newModel" key={i}>{efunction.label}</Dropdown.Item>)
            }
          }
          items.push(<DropdownButton id="nested-dropdown" title="Tools" key="end" drop="end" variant="Info">{children}</DropdownButton>);
        }
      }
      if (true) {
        items.push(<Dropdown.Item href="#" onClick={this.showSaveConfigurationModal.bind(this)} id="saveConfiguration">Save configuration</Dropdown.Item>);
        items.push(<Dropdown.Item href="#" onClick={this.showConfigurationManagementModal.bind(this)} id="manageConfigurations">Configuration management</Dropdown.Item>);
      }
    }


    let left = this.props.contextMenuX + "px";
    let top = this.props.contextMenuY + "px";

    return (
      <Dropdown.Menu show={this.state.showContextMenu} style={{ left: left, top: top }}>
        {items}
      </Dropdown.Menu>
    );
  }

  render() {
    return (
      <div className="treeMenu pb-2">
        {this.renderContexMenu()}

        <Modal id="modelInformationEditorModal" show={this.state.showModelInformationEditorModal} onHide={this.hideModelInformationEditorModal.bind(this)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              Model properties
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ModelInformationEditor model={this.state.model} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.hideModelInformationEditorModal.bind(this)} >
              Cancel
            </Button>
            <Button variant="primary" onClick={this.modelInformationEditorModal_onAccept} >
              Accept
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal id="editorTextModal" show={this.state.showEditorTextModal} onHide={this.hideEditorTextModal} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {this.state.modalTittle}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
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
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.hideEditorTextModal} >
              Cancel
            </Button>
            <Button variant="primary" onClick={this.addNewFolder} >
              Accept
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal id="queryModal" show={this.state.showQueryModal} onHide={this.hideQueryModal} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              Please input your query
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
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
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.hideQueryModal} >
              Cancel
            </Button>
            <Button variant="primary" onClick={this.runQuery} >
              Accept
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={this.state.showPropertiesModal} onHide={this.hidePropertiesModal} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              Properties
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              <div className="row">
                <div className="col-md-3">
                  <label >Name</label>
                </div>
                <div className="col-md-9">
                  <input
                    className="form-control"
                    id="newPropertyInputName"
                    aria-label="Name"
                    value={this.state.plName}
                    onChange={this.selectProductLineNameChange}
                  />
                </div>
              </div>
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
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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
                      <option key={option} value={option}>
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

        <Modal show={this.state.showDeleteModal} onHide={this.hideDeleteModal} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              Delete
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you wish to delete this item?</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.hideDeleteModal} >
              Cancel
            </Button>
            <Button variant="primary" onClick={this.deleteItemProject} >
              Accept
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal id="saveConfigurationModal" show={this.state.showSaveConfigurationModal} onHide={this.hideSaveConfigurationModal.bind(this)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              Configuration name
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="form-floating">
              <input
                type="text"
                className="form-control"
                id="modalInputValue"
                placeholder="Configuration name"
                value={this.state.configurationName}
                onChange={this.inputConfigurationName_onChange.bind(this)}
              // onKeyDown={this.onEnterModal}
              />
              <label htmlFor="floatingInput">
                {this.state.modalInputText}
              </label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.hideSaveConfigurationModal.bind(this)} >
              Cancel
            </Button>
            <Button variant="primary" onClick={this.saveConfiguration.bind(this)} >
              Accept
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal id="saveConfigurationModal" show={this.state.showConfigurationManagementModal} onHide={this.hideConfigurationManagementModal.bind(this)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              Configuration management
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ConfigurationManagement reload={this.state.showConfigurationManagementModal} projectService={this.props.projectService} className="ConfigurationManagement" onConfigurationSelected={this.configurationManagement_onConfigurationSelected.bind(this)} />
          </Modal.Body>
        </Modal>

        <Modal id="saveScopeModal" show={this.state.showScopeManagementModal} onHide={this.hideScopeManagementModal.bind(this)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              Scope management
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ConfigurationManagement reload={this.state.showScopeManagementModal} projectService={this.props.projectService} className="ConfigurationManagement" onConfigurationSelected={this.scopeManagement_onScopeSelected.bind(this)} />
          </Modal.Body>
        </Modal>

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
                    {language.type === this.state.newSelected ? (
                      <li>
                        <span
                          className={"dropdown-item type_" + language}
                          key={i}
                          onClick={() => this.addNewEModel(language)}
                        >
                          {language.name}
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
            {this.state.optionAllowProperties ? (
              <hr className="dropdown-divider" />
            ) : (
              ""
            )}
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
                this.state.optionAllowProperties
                  ? "dropdown-item"
                  : "hidden dropdown-item"
              }
              id="propertiesItem"
              onClick={this.handleUpdateNewSelected}
              data-bs-toggle="modal"
              data-bs-target="#editorTextModal"
            >
              Properties
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
        { this.state.showScopeModal &&
  this.props.projectService.project.productLines.length > 0 &&
  this.props.projectService.getScope() != null && (
        <ScopeModal
          show={this.state.showScopeModal}
          initialScope={
            this.props.projectService.getScope()
          }
          domain={
            this.props.projectService.project.productLines[this.props.projectService.getIdCurrentProductLine()].domain
          }
          onHide={() => this.setState({ showScopeModal: false })}
          onSave={(updatedScope: ScopeSPL) => {
            this.props.projectService.project.productLines[this.props.projectService.getIdCurrentProductLine()].scope = updatedScope;
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
) }

      </div>
    );

  }
}

export default TreeMenu;
