import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import * as alertify from "alertifyjs";
import { Language } from "../../Domain/ProductLineEngineering/Entities/Language";

interface Props {
  projectService: ProjectService;
}

interface State {}

class LanguageManagement extends Component<Props, State> {
  state = {
    name: "",
    abstractSyntax: "",
    concreteSyntax: "",
    type: "DOMAIN",
  };

  constructor(props: any) {
    super(props);

    this.createLanguage = this.createLanguage.bind(this);

    this.updateName = this.updateName.bind(this);
    this.updateAbstractSyntax = this.updateAbstractSyntax.bind(this);
    this.updateConcreteSyntax = this.updateConcreteSyntax.bind(this);
    this.updateType = this.updateType.bind(this);
  }

  jsonFormat() {
    // var obj = JSON.parse(this.state.abstractSyntax);
    // var jsonFormat = JSON.stringify(obj, undefined, 4);
    // document
    //   .getElementById("newLanguageAbSy")
    //   .setAttribute("value", jsonFormat);
    // this.setState({
    //   abstractSyntax: JSON.stringify(this.state.abstractSyntax, undefined, 4),
    // });
    // var badJSON = document
    //   .getElementById("newLanguageAbSy")
    //   .getAttribute("value");
    // var parseJSON = JSON.parse(badJSON);
    // var JSONInPrettyFormat = JSON.stringify(parseJSON, undefined, 4);
    // document
    //   .getElementById("newLanguageAbSy")
    //   .setAttribute("value", JSONInPrettyFormat);
    // alert(document.getElementById("newLanguageAbSy").getAttribute("value"));
  }

  validateSchemaConcreteSyntax(): boolean {
    return true;
  }

  validateSchemaAbstractSyntax(): boolean {
    return true;
  }

  validateLanguageExist(): boolean {
    if (this.props.projectService.languageExist(this.state.name)) {
      alertify.error("Language name already exist");
      document.getElementById("newLanguageName")?.focus();
      return false;
    }
    return true;
  }

  validateParamsNull(): boolean {
    // this.jsonFormat();
    if (this.state.name === "") {
      alertify.error("Language name is required");
      document.getElementById("newLanguageName")?.focus();
      return false;
    }

    if (this.state.abstractSyntax === "") {
      alertify.error("Abstract syntax is required");
      document.getElementById("newLanguageAbSy")?.focus();
      return false;
    }

    if (this.state.concreteSyntax === "") {
      alertify.error("Concrete syntax is required");
      document.getElementById("newLanguageCoSy")?.focus();
      return false;
    }

    return true;
  }

  clearForm() {
    this.setState({
      name: "",
      abstractSyntax: "",
      concreteSyntax: "",
      type: "DOMAIN",
    });
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
        alertify.success(data);
        document.getElementById("btnCreateLanguage").classList.remove("hidden");
        document.getElementById("btnCreateLoading").classList.add("hidden");
        me.clearForm();
      };

      this.props.projectService.createLanguage(
        callback,
        this.state as Language
      );
    }
  }

  updateName(event: any) {
    this.setState({
      name: event.target.value,
    });
  }

  updateAbstractSyntax(event: any) {
    this.setState({
      abstractSyntax: event.target.value,
    });
  }

  updateConcreteSyntax(event: any) {
    this.setState({
      concreteSyntax: event.target.value,
    });
  }

  updateType(event: any) {
    this.setState({
      type: event.target.value,
    });
  }

  render() {
    return (
      <div>
        <nav>
          <div className="nav nav-tabs" id="nav-tab" role="tablist">
            <button
              className="nav-link active"
              id="nav-createlanguage-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-createlanguage"
              type="button"
              role="tab"
              aria-controls="nav-createlanguage"
              aria-selected="true"
              onClick={this.createLanguage}
            >
              Create language
            </button>
            <button
              className="nav-link"
              id="nav-languagelist-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-languagelist"
              type="button"
              role="tab"
              aria-controls="nav-languagelist"
              aria-selected="false"
            >
              Language list
            </button>
          </div>
        </nav>
        <div className="tab-content" id="nav-tabContent">
          <div
            className="tab-pane fade show active"
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
                      value={this.state.name}
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
                      value={this.state.type}
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
              <div className="row">
                <div className="col-md">
                  <div className="form-floating">
                    <textarea
                      className="form-control"
                      placeholder="Enter abstract syntax"
                      id="newLanguageAbSy"
                      style={{ height: "100px" }}
                      value={this.state.abstractSyntax}
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
                      value={this.state.concreteSyntax}
                      onChange={this.updateConcreteSyntax}
                    ></textarea>
                    <label htmlFor="newLanguageCoSy">
                      Enter concrete syntax
                    </label>
                  </div>
                </div>
              </div>
              <br />
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
          <div
            className="tab-pane fade"
            id="nav-languagelist"
            role="tabpanel"
            aria-labelledby="nav-languagelist-tab"
          >
            Language list
          </div>
        </div>
      </div>
    );
  }
}

export default LanguageManagement;
