import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import * as alertify from "alertifyjs";
import { Language } from "../../Domain/ProductLineEngineering/Entities/Language";
import "./LanguageManagement.css";


interface Props {
  projectService: ProjectService;
}

interface State {
  languages: Language[];
  formLanguage: object;
  lastNameUpdate: string;
  languageListSelected: string;
}

class LanguageManagement extends Component<Props, State> {
  state = {
    formLanguage: {
      name: "",
      abstractSyntax: "",
      concreteSyntax: "",
      //These state fields hold the content of the form
      semantics: "",
      type: "DOMAIN",
      stateAccept: "PENDING",
    },
    lastNameUpdate: "",
    languageListSelected: "-1",
    languages: [],
  };

  constructor(props: any) {
    super(props);

    this.createLanguage = this.createLanguage.bind(this);

    this.updateName = this.updateName.bind(this);
    this.updateAbstractSyntax = this.updateAbstractSyntax.bind(this);
    this.updateConcreteSyntax = this.updateConcreteSyntax.bind(this);
    //add handler for semantics = 
    this.updateSemantics = this.updateSemantics.bind(this);

    this.updateType = this.updateType.bind(this);
    this.refreshLanguages = this.refreshLanguages.bind(this);
    this.updateLanguageListSelected =
      this.updateLanguageListSelected.bind(this);
    this.updateStateAccept = this.updateStateAccept.bind(this);
    this.activeUpdate = this.activeUpdate.bind(this);
    this.updateLanguage = this.updateLanguage.bind(this);
    this.projectService_addListener =
      this.projectService_addListener.bind(this);
    this.clearForm = this.clearForm.bind(this);
    this.deleteLanguage = this.deleteLanguage.bind(this);
    this.activeDelete = this.activeDelete.bind(this);
  }

  componentDidMount() {
    let me = this;
    me.props.projectService.addLanguagesDetailListener(
      this.projectService_addListener
    );
  }

  projectService_addListener(e: any) {
    this.forceUpdate();
  }

  validateSchemaConcreteSyntax(): boolean {
    return true;
  }

  validateSchemaAbstractSyntax(): boolean {
    return true;
  }

  validateLanguageExist(func?: string): boolean {
    if (
      func === "update" &&
      this.state.lastNameUpdate === this.state.formLanguage.name
    )
      return true;

    if (this.props.projectService.languageExist(this.state.formLanguage.name)) {
      alertify.error("Language name already exist");
      document.getElementById("newLanguageName")?.focus();
      return false;
    }

    return true;
  }

  validateParamsNull(): boolean {
    if (this.state.formLanguage.name === "") {
      alertify.error("Language name is required");
      document.getElementById("newLanguageName")?.focus();
      return false;
    }

    if (this.state.formLanguage.abstractSyntax === "") {
      alertify.error("Abstract syntax is required");
      document.getElementById("newLanguageAbSy")?.focus();
      return false;
    }

    if (this.state.formLanguage.concreteSyntax === "") {
      alertify.error("Concrete syntax is required");
      document.getElementById("newLanguageCoSy")?.focus();
      return false;
    }

    return true;
  }

  createLanguage() {
    if (
      this.validateLanguageExist() &&
      this.validateParamsNull() &&
      this.validateSchemaAbstractSyntax() &&
      this.validateSchemaConcreteSyntax()
    ) {
      document.getElementById("btnCreateLoading").classList.remove("hidden");
      document.getElementById("btnCreateLanguage").classList.add("hidden");

      let me = this;
      let callback = function (data: any) {
        if (data.messageError) {
          alertify.error(data.messageError);
        } else {
          me.refreshLanguages();
          alertify.success(data);
          me.clearForm();
        }
        document.getElementById("btnCreateLanguage").classList.remove("hidden");
        document.getElementById("btnCreateLoading").classList.add("hidden");
      };

      this.props.projectService.createLanguage(
        callback,
        this.state.formLanguage as Language
      );
    }
  }

  updateLanguage() {
    if (
      this.validateLanguageExist("update") &&
      this.validateParamsNull() &&
      this.validateSchemaAbstractSyntax() &&
      this.validateSchemaConcreteSyntax()
    ) {
      document.getElementById("btnUpdateLoading").classList.remove("hidden");
      document.getElementById("btnUpdateLanguage").classList.add("hidden");

      let me = this;
      let callback = function (data: any) {
        if (data.messageError) {
          alertify.error(data.messageError);
        } else {
          me.refreshLanguages();
          alertify.success(data);
          me.clearForm();
        }
        document.getElementById("btnUpdateLanguage").classList.remove("hidden");
        document.getElementById("btnUpdateLoading").classList.add("hidden");
      };

      this.props.projectService.updateLanguage(
        callback,
        this.state.formLanguage as Language,
        this.state.languageListSelected
      );
    }
  }

  activeUpdate() {
    if (this.state.languageListSelected === "-1") {
      alertify.error("Select language is required");
      document.getElementById("languageListSelected")?.focus();
      return false;
    }

    this.setState(() => {
      const languagesFilter = this.props.projectService.languages.filter(
        (language) => language.id === parseInt(this.state.languageListSelected)
      )[0];

      const formLanguage = {
        name: languagesFilter.name,
        abstractSyntax: JSON.stringify(
          languagesFilter.abstractSyntax,
          undefined,
          2
        ),
        concreteSyntax: JSON.stringify(
          languagesFilter.concreteSyntax,
          undefined,
          2
        ),
        semantics: JSON.stringify(
          languagesFilter.semantics,
          undefined,
          2
        ),
        type: languagesFilter.type,
        stateAccept: languagesFilter.stateAccept,
      };

      return {
        lastNameUpdate: languagesFilter.name,
        formLanguage,
      };
    });

    document
      .getElementById("nav-updatelanguage-tab")
      .classList.remove("hidden");
    document.getElementById("nav-createlanguage-tab").classList.add("hidden");
    document.getElementById("nav-updatelanguage-tab").click();
  }

  activeDelete() {
    if (this.state.languageListSelected === "-1") {
      alertify.error("Select language is required");
      document.getElementById("languageListSelected")?.focus();
      return false;
    }
    document.getElementById("deleteViewModalLanguage").click();
  }

  activeCreate() {
    document
      .getElementById("nav-createlanguage-tab")
      .classList.remove("hidden");
    document.getElementById("nav-createlanguage-tab").click();
  }

  deleteLanguage() {
    let me = this;
    let callback = function (data: any) {
      if (data.messageError) {
        alertify.error(data.messageError);
      } else {
        alertify.success(data);
        me.refreshLanguages();
        me.clearForm();
      }
    };

    this.props.projectService.deleteLanguage(
      callback,
      this.state.languageListSelected
    );
  }

  clearForm() {
    document.getElementById("nav-updatelanguage-tab").classList.add("hidden");
    document.getElementById("nav-createlanguage-tab").classList.add("hidden");

    document.getElementById("btnCreateLanguage").classList.remove("hidden");
    document.getElementById("btnCreateLoading").classList.add("hidden");

    document.getElementById("btnUpdateLanguage").classList.remove("hidden");
    document.getElementById("btnUpdateLoading").classList.add("hidden");
    this.setState(() => {
      const formLanguage = {
        name: "",
        abstractSyntax: "",
        concreteSyntax: "",
        semantics: "",
        type: "DOMAIN",
        stateAccept: "PENDING",
      };

      return {
        formLanguage,
        lastNameUpdate: "",
        languageListSelected: "-1",
      };
    });
    document.getElementById("nav-languagelist-tab").click();
  }

  async refreshLanguages() {
    this.props.projectService.refreshLanguageList();
    await new Promise((f) => setTimeout(f, 1000));
    this.forceUpdate();
  }

  updateLanguageListSelected(event: any) {
    this.clearForm();
    this.setState({
      languageListSelected: event.target.value,
    });
  }

  updateName(event: any) {
    this.setState(() => {
      const formLanguage = {
        name: event.target.value,
        abstractSyntax: this.state.formLanguage.abstractSyntax,
        concreteSyntax: this.state.formLanguage.concreteSyntax,
        semantics: this.state.formLanguage.semantics,
        type: this.state.formLanguage.type,
        stateAccept: this.state.formLanguage.stateAccept,
      };
      return {
        formLanguage,
      };
    });
  }

  updateAbstractSyntax(event: any) {
    this.setState(() => {
      const formLanguage = {
        name: this.state.formLanguage.name,
        abstractSyntax: event.target.value,
        concreteSyntax: this.state.formLanguage.concreteSyntax,
        semantics: this.state.formLanguage.semantics,
        type: this.state.formLanguage.type,
        stateAccept: this.state.formLanguage.stateAccept,
      };

      return {
        formLanguage,
      };
    });
  }

  updateConcreteSyntax(event: any) {
    this.setState(() => {
      const formLanguage = {
        name: this.state.formLanguage.name,
        abstractSyntax: this.state.formLanguage.abstractSyntax,
        concreteSyntax: event.target.value,
        semantics: this.state.formLanguage.semantics,
        type: this.state.formLanguage.type,
        stateAccept: this.state.formLanguage.stateAccept,
      };

      return {
        formLanguage,
      };
    });
  }

  updateSemantics(event: any) {
    this.setState(() => {
      const formLanguage = {
        name: this.state.formLanguage.name,
        abstractSyntax: this.state.formLanguage.abstractSyntax,
        concreteSyntax: this.state.formLanguage.concreteSyntax,
        semantics: event.target.value,
        type: this.state.formLanguage.type,
        stateAccept: this.state.formLanguage.stateAccept,
      };

      return {
        formLanguage,
      };
    });
  }

  updateType(event: any) {
    this.setState(() => {
      const formLanguage = {
        name: this.state.formLanguage.name,
        abstractSyntax: this.state.formLanguage.abstractSyntax,
        concreteSyntax: this.state.formLanguage.concreteSyntax,
        semantics: this.state.formLanguage.semantics,
        type: event.target.value,
        stateAccept: this.state.formLanguage.stateAccept,
      };

      return {
        formLanguage,
      };
    });
  }

  updateStateAccept(event: any) {
    this.setState(() => {
      const formLanguage = {
        name: this.state.formLanguage.name,
        abstractSyntax: this.state.formLanguage.abstractSyntax,
        concreteSyntax: this.state.formLanguage.concreteSyntax,
        semantics: this.state.formLanguage.semantics,
        type: this.state.formLanguage.type,
        stateAccept: event.target.value,
      };

      return {
        formLanguage,
      };
    });
  }

  render() {
    return (
      <div>
        <div
          className="modal fade"
          id="modalDeleteLanguage"
          tabIndex={-1}
          aria-labelledby="deleteModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modalLanguage-center-variamos">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="deleteModalLabel">
                  Delete
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-toggle="modal"
                  data-bs-target="#modalDeleteLanguage"
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
                  data-bs-toggle="modal"
                  data-bs-target="#modalDeleteLanguage"
                >
                  No
                </button>
                <button
                  type="button"
                  className="btn btn-Variamos"
                  onClick={this.deleteLanguage}
                  data-bs-toggle="modal"
                  data-bs-target="#modalDeleteLanguage"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
        <nav>
          <div className="nav nav-tabs" id="nav-tab" role="tablist">
            <button
              className="nav-link active"
              id="nav-languagelist-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-languagelist"
              type="button"
              role="tab"
              aria-controls="nav-languagelist"
              aria-selected="false"
              onClick={this.clearForm}
            >
              Language list
            </button>
            <button
              className="nav-link hidden"
              id="nav-updatelanguage-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-updatelanguage"
              type="button"
              role="tab"
              aria-controls="nav-updatelanguage"
              aria-selected="true"
            >
              Update language, Id: {this.state.languageListSelected}
            </button>
            <button
              className="nav-link hidden"
              id="nav-createlanguage-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-createlanguage"
              type="button"
              role="tab"
              aria-controls="nav-createlanguage"
              aria-selected="true"
            >
              Create language
            </button>
          </div>
        </nav>
        <div className="tab-content" id="nav-tabContent">
          <div
            className="tab-pane fade show active"
            id="nav-languagelist"
            role="tabpanel"
            aria-labelledby="nav-languagelist-tab"
          >
            <br />

            <div className="row align-items-center p-1 ">
              <div className="col-md-6">
                <div className="form-floating">
                  <select
                    className="form-select"
                    id="languageListSelected"
                    aria-label="Select language"
                    value={this.state.languageListSelected}
                    onChange={this.updateLanguageListSelected}
                  >
                    <option value="-1"></option>
                    {this.props.projectService.languages.map(
                      (language: Language, i: number) => (
                        <option key={i} value={language.id}>
                          {language.name}
                        </option>
                      )
                    )}
                  </select>
                  <label htmlFor="languageListSelected">Select language</label>
                </div>
              </div>

              <div className="col-md d-flex justify-content-end">
                <ul className="list-group list-group-horizontal">
                  <li
                    className="list-group-item icon-dark-variamos rounded"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    title="Update Language"
                    style={{ marginRight: "1em" }}
                    onClick={this.activeUpdate}
                  >
                    <span
                      className="bi bi-pencil-square shadow rounded"
                      id="updateLanguage"
                    ></span>
                  </li>
                  <li
                    className="list-group-item icon-dark-variamos rounded"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    title="Delete Language"
                    style={{ marginRight: "1em" }}
                    onClick={this.activeDelete}
                  >
                    <span
                      className="bi bi-trash shadow rounded"
                      id="deleteLanguage"
                    ></span>
                    <span
                      className="hidden"
                      id="deleteViewModalLanguage"
                      data-bs-toggle="modal"
                      data-bs-target="#modalDeleteLanguage"
                    ></span>
                  </li>
                  <li
                    className="list-group-item icon-dark-variamos rounded"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    title="New Language"
                    style={{ marginRight: "1em" }}
                    onClick={this.activeCreate}
                  >
                    <span
                      className="bi bi-plus-circle shadow rounded"
                      id="newLanguage"
                    ></span>
                  </li>
                </ul>
              </div>
              <div className="col"></div>
            </div>
          </div>
          {/* This the pane containing the tab for language updates */}
          <div
            className="tab-pane fade"
            id="nav-updatelanguage"
            role="tabpanel"
            aria-labelledby="nav-updatelanguage-tab"
          >
            <br />
            <div className="container">
              <div className="row">
                <div className="col-md">
                  <div className="form-floating">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Language name"
                      id="updateLanguageName"
                      value={this.state.formLanguage.name}
                      onChange={this.updateName}
                      autoComplete="off"
                    />
                    <label htmlFor="floatingInput">Enter name</label>
                  </div>
                </div>
                <div className="col-md">
                  <div className="form-floating">
                    <select
                      className="form-select"
                      id="updateLanguageType"
                      aria-label="Select type"
                      value={this.state.formLanguage.type}
                      onChange={this.updateType}
                    >
                      <option value="DOMAIN">Domain</option>
                      <option value="APPLICATION">Application</option>
                      <option value="ADAPTATION">Adaptation</option>
                    </select>
                    <label htmlFor="newLanguageType">
                      Select language type
                    </label>
                  </div>
                </div>
                <div className="col-md">
                  <div className="form-floating">
                    <select
                      className="form-select"
                      id="updateLanguageState"
                      aria-label="Select state"
                      value={this.state.formLanguage.stateAccept}
                      onChange={this.updateStateAccept}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="PENDING">Pending</option>
                      <option value="DISABLED">Disabled</option>
                    </select>
                    <label htmlFor="newLanguageState">
                      Select language state
                    </label>
                  </div>
                </div>
              </div>
              <br />
              <div className="row">
                <div className="col-md">
                  <div className="form-floating">
                    <textarea
                      className="form-control"
                      placeholder="Enter abstract syntax"
                      id="updateLanguageAbSy"
                      style={{ height: "100px" }}
                      value={this.state.formLanguage.abstractSyntax}
                      onChange={this.updateAbstractSyntax}
                      autoComplete="off"
                    ></textarea>
                    <label htmlFor="newLanguageAbSy">
                      Enter abstract syntax
                    </label>
                  </div>
                </div>
                <div className="col-md">
                  <div className="form-floating">
                    <textarea
                      className="form-control"
                      placeholder="Enter Concrete syntax"
                      id="updateLanguageCoSy"
                      style={{ height: "100px" }}
                      value={this.state.formLanguage.concreteSyntax}
                      onChange={this.updateConcreteSyntax}
                      autoComplete="off"
                    ></textarea>
                    <label htmlFor="newLanguageCoSy">
                      Enter concrete syntax
                    </label>
                  </div>
                </div>
                {/*We'll add a new text area for the semantic spec*/}
                <div className="col-md">
                  <div className="form-floating">
                    <textarea
                      className="form-control"
                      placeholder="Enter Semantics"
                      id="updateLanguageSem"
                      style={{ height: "100px" }}
                      value={this.state.formLanguage.semantics}
                      onChange={this.updateSemantics}
                    ></textarea>
                    <label htmlFor="updateLanguageSem">
                      Enter semantics
                    </label>
                  </div>
                </div>
              </div>
              <br />
              <div className="row">
                <div className="col-md">
                  <button
                    type="button"
                    className="btn form-control btn-secondary"
                    onClick={this.clearForm}
                  >
                    Cancel
                  </button>
                </div>
                <div className="col-md">
                  <button
                    type="button"
                    className="btn form-control btn-Variamos"
                    onClick={this.updateLanguage}
                    id="btnUpdateLanguage"
                  >
                    Update
                  </button>
                  <button
                    id="btnUpdateLoading"
                    className="btn form-control btn-Variamos hidden"
                    type="button"
                  >
                    Updating language... &nbsp;&nbsp;
                    <span
                      className="spinner-border spinner-border-sm "
                      role="status"
                      aria-hidden="true"
                    ></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* This Div holds the language creation tab */}
          <div
            className="tab-pane fade"
            id="nav-createlanguage"
            role="tabpanel"
            aria-labelledby="nav-createlanguage-tab"
          >
            <br />
            <div className="container">
              <div className="row">
                <div className="col-md">
                  <div className="form-floating">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Language name"
                      id="newLanguageName"
                      value={this.state.formLanguage.name}
                      onChange={this.updateName}
                    />
                    <label htmlFor="floatingInput">Enter name</label>
                  </div>
                </div>
                <div className="col-md">
                  <div className="form-floating">
                    <select
                      className="form-select"
                      id="newLanguageType"
                      aria-label="Select type"
                      value={this.state.formLanguage.type}
                      onChange={this.updateType}
                    >
                      <option value="DOMAIN">Domain</option>
                      <option value="APPLICATION">Application</option>
                      <option value="ADAPTATION">Adaptation</option>
                    </select>
                    <label htmlFor="newLanguageType">
                      Select language type
                    </label>
                  </div>
                </div>
              </div>
              <br />
              {/*This div holds the text areas for the specs*/}
              <div className="row">
                <div className="col-md">
                  <div className="form-floating">
                    <textarea
                      className="form-control"
                      placeholder="Enter abstract syntax"
                      id="newLanguageAbSy"
                      style={{ height: "100px" }}
                      value={this.state.formLanguage.abstractSyntax}
                      onChange={this.updateAbstractSyntax}
                    ></textarea>
                    <label htmlFor="newLanguageAbSy">
                      Enter abstract syntax
                    </label>
                  </div>
                </div>
                <div className="col-md">
                  <div className="form-floating">
                    <textarea
                      className="form-control"
                      placeholder="Enter Concrete syntax"
                      id="newLanguageCoSy"
                      style={{ height: "100px" }}
                      value={this.state.formLanguage.concreteSyntax}
                      onChange={this.updateConcreteSyntax}
                    ></textarea>
                    <label htmlFor="newLanguageCoSy">
                      Enter concrete syntax
                    </label>
                  </div>
                </div>
                {/*We'll add a new text area for the semantic spec*/}
                <div className="col-md">
                  <div className="form-floating">
                    <textarea
                      className="form-control"
                      placeholder="Enter Semantics"
                      id="newLanguageSem"
                      style={{ height: "100px" }}
                      value={this.state.formLanguage.semantics}
                      onChange={this.updateSemantics}
                    ></textarea>
                    <label htmlFor="newLanguageSem">
                      Enter semantics
                    </label>
                  </div>
                </div>
              </div>
              <br />

              <div className="row">
                <div className="col-md">
                  <button
                    type="button"
                    className="btn form-control btn-secondary"
                    onClick={this.clearForm}
                  >
                    Cancel
                  </button>
                </div>
                <div className="col-md">
                  <button
                    type="button"
                    className="btn form-control btn-Variamos"
                    onClick={this.createLanguage}
                    id="btnCreateLanguage"
                  >
                    Create
                  </button>
                  <button
                    id="btnCreateLoading"
                    className="btn form-control btn-Variamos hidden"
                    type="button"
                  >
                    Creating language... &nbsp;&nbsp;
                    <span
                      className="spinner-border spinner-border-sm "
                      role="status"
                      aria-hidden="true"
                    ></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default LanguageManagement;
