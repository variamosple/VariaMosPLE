// import { timeStamp } from "console";
import React, { Component } from "react";
// import mx from "../MxGEditor/mxgraph";
// import { mxGraph, mxGraphModel } from "mxgraph";
import ProjectService from "../../Application/Project/ProjectService";

import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
// import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";
import CustomProperties from "./CustomProperties";
import "./PropertiesMenu.css";
import * as alertify from "alertifyjs";
import SuggestionInput from "../SuggestionInput/SuggestionInput";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { ProductLine } from "../../Domain/ProductLineEngineering/Entities/ProductLine";
import "./MxProperties.css"
import SuggestionInputReceivedEventArgs from "../SuggestionInput/SuggestionInputReceivedEventArgs";
import CheckboxList from "../CheckboxList/CheckboxList";
import CheckboxItem from "../CheckboxList/CheckboxItem";

import { MdEdit } from "react-icons/md";
import { FaTrashAlt } from "react-icons/fa";
import { MdAddCircle } from "react-icons/md";

interface Props {
  projectService: ProjectService;
  model: any;
  item: any;
}
interface State {
  values: any[];
  propertyId: string;
  propertyName: string;
  propertyLastName: string;
  propertyDomain: string;
  propertyPossibleValues: string;
  propertyPossibleValuesLinks: {};
  propertyComment: string;
  propertyMinCardinality: string;
  propertyMaxCardinality: string;
  propertyConstraint: string;
  customPropertyFlag: boolean;
  customPropertyCreateFlag: boolean;
  customPropertyUpdateFlag: boolean;
  currentCustomProperty: any;
  showAddPropertyModal: boolean;
  titleProperyModal: string;
}

export default class MxProperties extends Component<Props, State> {
  containerRef: any;
  currentModel?: Model;
  currentObject?: any;
  elementDefinition?: any;

  constructor(props: Props) {
    super(props);
    this.containerRef = React.createRef();

    this.state = {
      values: [],
      propertyId: null,
      propertyName: "",
      propertyLastName: "",
      propertyDomain: "String",
      propertyPossibleValues: "",
      propertyPossibleValuesLinks: {},
      propertyComment: "",
      propertyMinCardinality: "",
      propertyMaxCardinality: "",
      propertyConstraint: "",
      customPropertyFlag: true,
      customPropertyCreateFlag: true,
      customPropertyUpdateFlag: true,
      currentCustomProperty: {},
      showAddPropertyModal: false,
      titleProperyModal: "Add property"
    };

    this.projectService_addNewProductLineListener =
      this.projectService_addNewProductLineListener.bind(this);
    this.projectService_addSelectedModelListener =
      this.projectService_addSelectedModelListener.bind(this);
    this.projectService_addSelectedElementListener =
      this.projectService_addSelectedElementListener.bind(this);

    this.checkBox_onChange = this.checkBox_onChange.bind(this);
    this.input_onChange = this.input_onChange.bind(this);

    this.newCustomPropertyForm = this.newCustomPropertyForm.bind(this);
    this.createCustomProperty = this.createCustomProperty.bind(this);
    this.updateCustomPropertyForm = this.updateCustomPropertyForm.bind(this);
    this.updateCustomProperty = this.updateCustomProperty.bind(this);
    this.deleteCustomProperty = this.deleteCustomProperty.bind(this);

    this.clearForm = this.clearForm.bind(this);
    this.selectNameChange = this.selectNameChange.bind(this);
    this.selectDomainChange = this.selectDomainChange.bind(this);
    this.selectCommentChange = this.selectCommentChange.bind(this);
    this.selectPossibleValuesChange = this.selectPossibleValuesChange.bind(this);
    this.selectMinCardinalityChange = this.selectMinCardinalityChange.bind(this);
    this.selectMaxCardinalityChange = this.selectMaxCardinalityChange.bind(this);
    this.constraintChange = this.constraintChange.bind(this);
    this.customPropertySelected = this.customPropertySelected.bind(this);


    this.showAddPropertyModal = this.showAddPropertyModal.bind(this);
    this.hideAddPropertyModal = this.hideAddPropertyModal.bind(this);
  }

  projectService_addNewProductLineListener(e: any) {
    this.forceUpdate();
  }

  projectService_addSelectedModelListener(e: any) {
    this.currentObject = null;
    this.currentModel = e.model;
    this.forceUpdate();
  }

  projectService_addSelectedElementListener(e: any) {
    this.currentModel = e.model;
    this.currentObject = e.element;
    this.forceUpdate();
  }

  checkBox_onChange(e: any) {
    let name = e.target.attributes["data-name"].value;
    let value = e.target.checked;
    this.property_onChange(name, value);
  }

  input_onChange(e: any) {
    let name = null;
    if (e.target.attributes) {
      name = e.target.attributes["data-name"].value;
    }
    else if (e.target.props) {
      name = e.target.props["data-name"];
    }
    let value = e.target.value;
    if (value == "Select...") {
      value = "Undefined";
    }
    else if (value[0] == "Undefined") {
      value = "Undefined";
    }
    this.property_onChange(name, value);
  }

  property_onChange(name: any, value: any) {
    let me = this;
    if (name === "Name") {
      this.currentObject.name = value;
    } else {
      for (let p = 0; p < this.currentObject.properties.length; p++) {
        if (this.currentObject.properties[p].name === name) {
          this.currentObject.properties[p].value = value;
        }
      }
    }

    let values = this.state.values;
    values[name] = value;
    this.setState({
      values: values,
    });
    if (this.elementDefinition.properties) {
      for (let i = 0; i < this.elementDefinition.properties.length; i++) {
        const property: any = this.elementDefinition.properties[i];
        if (name === property.name) {
          if (property.enable_properties) {
            this.showLinkedProperties(property.name, value);
          }
          break;
        }
      }
    }

    me.props.projectService.raiseEventUpdatedElement(
      me.currentModel,
      me.currentObject
    );
  }

  suggestionInput_onSuggestionReceived(e: SuggestionInputReceivedEventArgs) {
    let me = this;
    let name = e.target.props["data-name"];
    for (let i = 0; i < this.currentObject.properties.length; i++) {
      const element = this.currentObject.properties[i];
      if (element.name === name) {
        this.currentObject.properties[i].metadata = e.data;
      }
    }

  }

  showLinkedProperties(propertyName: any, value: any) {
    if (this.elementDefinition.properties) {
      for (let i = 0; i < this.elementDefinition.properties.length; i++) {
        const property: any = this.elementDefinition.properties[i];
        if (property.linked_property) {
          if (property.linked_property === propertyName) {
            let ele = document.getElementById("prop_" + property.name);
            if (property.linked_value === value) {
              ele.style.display = "block";
            } else {
              ele.style.display = "none";
            }
          }
        }
      }
    }
  }

  componentDidMount() {
    let me = this;
    me.currentModel = me.props.model;
    me.currentObject = me.props.item;
    me.props.projectService.addNewProductLineListener(
      this.projectService_addNewProductLineListener
    );
    me.props.projectService.addSelectedModelListener(
      this.projectService_addSelectedModelListener
    );
    me.props.projectService.addSelectedElementListener(
      this.projectService_addSelectedElementListener
    );
    this.forceUpdate();
  }

  newCustomPropertyForm() {
    this.setState({
      customPropertyFlag: false,
      customPropertyCreateFlag: false,
    });
  }

  updateCustomPropertyForm() {
    this.setState({
      propertyName: this.state.currentCustomProperty.name,
      propertyDomain: this.state.currentCustomProperty.type,
      propertyPossibleValues: this.state.currentCustomProperty.possibleValues,
      propertyComment: this.state.currentCustomProperty.comment,
      customPropertyFlag: false,
      customPropertyCreateFlag: true,
      customPropertyUpdateFlag: false,
    });
  }

  nullValidate(): boolean {
    if (this.state.propertyName === "") {
      alertify.error("Name property is required");
      document.getElementById("newPropertyOptionList")?.focus();
      return false;
    }
    return true;
  }

  validatePropertyExist(func?: string): boolean {
    let reservedWords = ["id", "name", "label", "type", "selected"];
    if (reservedWords.includes(this.state.propertyName.toLowerCase())) {
      alertify.error("Please don't use reserved properties: " + reservedWords.join(", "));
      document.getElementById("newPropertyName")?.focus();
      return false;
    }

    if (
      func === "update" &&
      this.state.propertyLastName === this.state.propertyName
    )
      return true;

    for (let i = 0; i < this.currentObject.properties.length; i++) {
      const element = this.currentObject.properties[i];
      if (element.name === this.state.propertyName) {
        if (element.id!=this.state.propertyId) {
          alertify.error("Property name already exist");
          document.getElementById("newPropertyName")?.focus();
          return false;
        }
      }
    }


    return true;
  }

  showAddPropertyModal() {
    this.setState({ showAddPropertyModal: true })
  }

  hideAddPropertyModal() {
    this.setState({ showAddPropertyModal: false })
  }

  editProperty(e) {
    let p = e.target;
    while (!p.attributes["data-id"]) {
      p = p.parentElement;
    }
    let propertyId = p.attributes["data-id"].value;
    for (let i = 0; i < this.currentObject?.properties.length; i++) {
      if (this.currentObject.properties[i].id == propertyId) {
        let property: Property = this.currentObject.properties[i];

        this.setState({
          propertyId: property.id,
          propertyName: property.name,
          propertyLastName: "",
          propertyDomain: property.type,
          propertyPossibleValues: property.possibleValues,
          propertyConstraint: property.constraint,
          propertyComment: property.comment,
          customPropertyFlag: true,
          customPropertyCreateFlag: true,
          customPropertyUpdateFlag: true,
          currentCustomProperty: {},
        });

        this.showAddPropertyModal();
      }
    }
  }

  deleteProperty(e) {
    if (!window.confirm("Delete the property?")) {
      return;
    }
    let p = e.target;
    while (!p.attributes["data-id"]) {
      p = p.parentElement;
    }
    let propertyId = p.attributes["data-id"].value;
    for (let i = 0; i < this.currentObject?.properties.length; i++) {
      if (this.currentObject.properties[i].id == propertyId) {
        this.currentObject.properties.splice(i, 1);

        this.props.projectService.saveProject();
        this.props.projectService.raiseEventUpdatedElement(
          this.currentModel,
          this.currentObject
        );

        alertify.success("Property deleted successfully");
        this.clearForm();
        this.setState({ showAddPropertyModal: false })
      }
    }
  }

  createCustomProperty() {
    if (!this.state.propertyId) {
      if (!this.nullValidate()) return false;
      if (!this.validatePropertyExist()) return false;

      this.currentObject.properties.push(
        new Property(
          this.state.propertyName,
          "Undefined",
          this.state.propertyDomain,
          null,
          null,
          null,
          true,
          true,
          this.state.propertyComment,
          this.state.propertyPossibleValues,
          this.state.propertyPossibleValuesLinks,
          this.state.propertyMinCardinality,
          this.state.propertyMaxCardinality,
          this.state.propertyConstraint
        )
      );

      this.props.projectService.saveProject();
      this.props.projectService.raiseEventUpdatedElement(
        this.currentModel,
        this.currentObject
      );

      alertify.success("Property created successfully");
      this.clearForm();
      this.setState({ showAddPropertyModal: false })
    }
    else {
      if (!this.nullValidate()) return false;
      if (!this.validatePropertyExist()) return false;

      let propertyId = this.state.propertyId;
      for (let i = 0; i < this.currentObject?.properties.length; i++) {
        if (this.currentObject.properties[i].id == propertyId) {
          let property:Property=this.currentObject.properties[i];
          property.name=this.state.propertyName;
          property.type=this.state.propertyDomain;
          property.comment=this.state.propertyComment;
          property.possibleValues=this.state.propertyPossibleValues;
          property.possibleValuesLinks=this.state.propertyPossibleValuesLinks;
          property.minCardinality= parseInt(  this.state.propertyMinCardinality);
          property.maxCardinality=parseInt(this.state.propertyMaxCardinality); 
          property.constraint=this.state.propertyConstraint;
          property.value="Undefined"
        }
      } 

      this.props.projectService.saveProject();
      this.props.projectService.raiseEventUpdatedElement(
        this.currentModel,
        this.currentObject
      );

      alertify.success("Property changed successfully");
      this.clearForm();
      this.setState({ showAddPropertyModal: false })
    }

  }

  updateCustomProperty() {
    for (let i = 0; i < this.currentObject?.properties.length; i++) {
      if (
        this.currentObject.properties[i].id ===
        this.state.currentCustomProperty.id
      ) {
        console.log(this.currentObject.properties[i]);
        console.log(this.state.currentCustomProperty);
        this.currentObject.properties[i].name = this.state.propertyName;

        this.currentObject.properties[i].type = this.state.propertyDomain;
        this.currentObject.properties[i].possibleValues =
          this.state.propertyPossibleValues;
        this.currentObject.properties[i].comment = this.state.propertyComment;

        this.setState({
          currentCustomProperty: this.currentObject.properties[i],
        });

        this.props.projectService.saveProject();
        this.props.projectService.raiseEventUpdatedElement(
          this.currentModel,
          this.currentObject
        );

        alertify.success("Property updated successfully");
        this.clearForm();
        return;
      }
    }
  }

  deleteCustomProperty() {
    this.currentObject.properties = this.currentObject.properties.filter(
      (property: Property) =>
        property.id !== this.state.currentCustomProperty.id
    );

    this.props.projectService.saveProject();
    this.props.projectService.raiseEventUpdatedElement(
      this.currentModel,
      this.currentObject
    );

    alertify.success("Property deleted successfully");
    this.clearForm();
  }

  clearForm() {
    this.setState({
      propertyId: null,
      propertyName: "",
      propertyLastName: "",
      propertyDomain: "String",
      propertyPossibleValues: "",
      propertyConstraint: "",
      propertyComment: "",
      customPropertyFlag: true,
      customPropertyCreateFlag: true,
      customPropertyUpdateFlag: true,
      currentCustomProperty: {},
    });
  }

  customPropertySelected(Property: any) {
    this.setState({
      currentCustomProperty: Property,
    });
  }

  selectNameChange(event: any) {
    const lastNameProperty = this.state.propertyName;
    this.setState({
      propertyLastName: lastNameProperty,
      propertyName: event.target.value,
    });
  }

  selectDomainChange(event: any) {
    this.setState({
      propertyDomain: event.target.value,
    });
  }

  selectCommentChange(event: any) {
    this.setState({
      propertyComment: event.target.value,
    });
  }

  selectPossibleValuesChange(event: any) {
    this.setState({
      propertyPossibleValues: event.target.value,
    });
  }

  selectMinCardinalityChange(event: any) {
    this.setState({
      propertyMinCardinality: event.target.value,
    });
  }

  selectMaxCardinalityChange(event: any) {
    this.setState({
      propertyMaxCardinality: event.target.value,
    });
  }

  constraintChange(event: any) {
    this.setState({
      propertyConstraint: event.target.value,
    });
  }


  renderProperties() {
    let ret = [];


    if (this.currentObject) {
      let concreteSyntaxElement: any = null;
      let languageDefinition: any =
        this.props.projectService.getLanguageDefinition(
          "" + this.currentModel?.type
        );
      if (languageDefinition) {
        if (
          languageDefinition.abstractSyntax.elements[this.currentObject.type]
        ) {
          this.elementDefinition =
            languageDefinition.abstractSyntax.elements[this.currentObject.type];
        } else if (
          languageDefinition.abstractSyntax.relationships[
          this.currentObject.type
          ]
        ) {
          this.elementDefinition =
            languageDefinition.abstractSyntax.relationships[
            this.currentObject.type
            ];
        }

        if (
          languageDefinition.concreteSyntax.elements[this.currentObject.type]
        ) {
          concreteSyntaxElement =
            languageDefinition.concreteSyntax.elements[this.currentObject.type];
        } else if (
          languageDefinition.concreteSyntax.relationships[
          this.currentObject.type
          ]
        ) {
          concreteSyntaxElement =
            languageDefinition.concreteSyntax.relationships[
            this.currentObject.type
            ];
        }

        let property = {
          name: "Name",
          type: "String",
        };
        this.state.values["Name"] = this.currentObject.name;
        ret.push(<a title="Add property" onClick={this.showAddPropertyModal}><span><MdAddCircle /></span></a>);
        ret.push(this.createControl(property, this.currentObject.name, true, concreteSyntaxElement));
        if (this.elementDefinition.properties) {
          for (let i = 0; i < this.elementDefinition.properties.length; i++) {
            let property: any = this.elementDefinition.properties[i];
            let index = -1;
            for (let p = 0; p < this.currentObject.properties.length; p++) {
              if (this.currentObject.properties[p].name == property.name) {
                this.currentObject.properties[p].type = property.type;
                this.currentObject.properties[p].options = property.options;
                this.currentObject.properties[p].linked_property =
                  property.linked_property;
                this.currentObject.properties[p].linked_value =
                  property.linked_value;
                index = p;
                break;
              }
            }
            if (index == -1) {
              this.currentObject.properties.push(
                new Property(
                  property.name,
                  null,
                  property.type,
                  property.options,
                  property.linked_property,
                  property.linked_value,
                  false,
                  true,
                  property.comment,
                  property.possibleValues,
                  property.possibleValuesByProductLineType,
                  property.minCardinality,
                  property.maxCardinality,
                  property.constraint
                )
              );
              index = this.currentObject.properties.length - 1;
            }
            this.state.values[property.name] =
              this.currentObject.properties[index].value;
            if (property.linked_property) {
              if (
                this.state.values[property.linked_property] ==
                property.linked_value
              ) {
                this.currentObject.properties[index].display = true;
              } else {
                this.currentObject.properties[index].display = false;
              }
            }
            //ret.push(this.createControl(this.currentObject.properties[index], this.currentObject.properties[index].value, display));
          }
        }
        for (let p = 0; p < this.currentObject.properties.length; p++) {
          let pr = this.currentObject.properties[p];
          this.state.values[pr.name] = pr.value;
          ret.push(
            this.createControl(
              this.currentObject.properties[p],
              this.currentObject.properties[p].value,
              this.currentObject.properties[p].display,
              concreteSyntaxElement
            )
          );
        }
      }
    }
    return ret;
  }

  createControl(property: any, value: any, display: any, concreteSyntax: any) {
    let control: any;
    let style = null;
    if (display) {
      style = {};
    } else {
      style = { display: "none" };
    }
    if (concreteSyntax.properties) {
      if (concreteSyntax.properties[property.name]) {
        switch (concreteSyntax.properties[property.name].display) {
          case "None":
            style = { display: "none" };
            break;
        }
      }
    }


    let titleToolTip =
      "Name: " +
      property.name +
      "\n Domain: " +
      property.type +
      "\n PossibleValues: " +
      property.possibleValues +
      "\n Comment: " +
      property.comment;

    let possibleValues;
    if (property.possibleValuesLinks) {
      if (Object.keys(property.possibleValuesLinks).length > 0) {
        if (property.possibleValuesLinks.linkType == "ProductLineType") {
          let productLine: ProductLine = this.props.projectService.getProductLineSelected();
          let value = productLine.type;
          for (let i = 0; i < property.possibleValuesLinks.linkValues.length; i++) {
            const linkValue = property.possibleValuesLinks.linkValues[i];
            if (linkValue.value == value) {
              possibleValues = linkValue.possibleValues;
              break
            }
          }
        }
      } else {
        possibleValues = property.possibleValues;
      }
    } else {
      possibleValues = property.possibleValues;
    }

    switch (property.type) {
      case "Select":
        let options = [];
        for (let i = 0; i < property.options.length; i++) {
          const option = property.options[i];
          if (option === value) {
            options.push(
              <option
                className="form-check-input"
                data-name={property.name}
                value={option}
                selected
              >
                |{option}
              </option>
            );
          } else {
            options.push(
              <option
                className="form-check-input"
                data-name={property.name}
                value={option}
              >
                {option}
              </option>
            );
          }
        }
        control = (
          <select
            className="form-control form-control-sm"
            data-name={property.name}
            onChange={this.input_onChange}
          >
            {options}
          </select>
        );
        break;
      case "Text":
        control = (
          <textarea
            className="form-control form-control-sm"
            data-name={property.name}
            onChange={this.input_onChange}
            value={this.state.values[property.name]}
          />
        );
        break;
      case "Integer":
        if (
          possibleValues === undefined ||
          possibleValues === ""
        ) {
          control = (
            <input
              className="form-control form-control-sm"
              type="text"
              title={titleToolTip}
              data-name={property.name}
              onChange={this.input_onChange}
              value={this.state.values[property.name]}
            />
          );
          break;
        }

        if (possibleValues.includes(",") || possibleValues.includes(";")) {
          if (!property.constraint) {
            let options = [];
            let possibleValuesList = this.getListFromString(possibleValues);
            if (property.name != "Selected") {
              options.push(
                <option data-name={property.name} value={"Undefined"} selected>Undefined</option>
              );
            }
            for (let i = 0; i < possibleValuesList.length; i++) {
              const option = possibleValuesList[i];
              if (option === value) {
                options.push(
                  <option data-name={property.name} value={option} selected>
                    {option}
                  </option>
                );
              } else {
                options.push(
                  <option data-name={property.name} value={option}>
                    {option}
                  </option>
                );
              }
            }

            control = (
              <select
                className="form-control form-control-sm"
                data-name={property.name}
                onChange={this.input_onChange}
                title={titleToolTip}
              >
                {options}
              </select>
            );
            break;
          }
          else {
            let checkboxItems: CheckboxItem[] = [];
            checkboxItems.push(
              { id: "Undefined", label: "Undefined", checked: false }
            );
            let possibleValuesList = this.getListFromString(possibleValues);
            for (let i = 0; i < possibleValuesList.length; i++) {
              const option: any = possibleValuesList[i];
              let checked = false;
              if (Array.isArray(value)) {
                if (value.includes(option)) {
                  checked = true;
                }
              }
              checkboxItems.push(
                { id: option, label: option, checked: checked }
              );
            }

            control = (
              <CheckboxList title="Multiple Checkbox List" data-name={property.name} items={checkboxItems} onChange={this.input_onChange} />
            );
          }
          break;
        }
        break;
      case "String":
        if (
          possibleValues === undefined ||
          possibleValues === ""
        ) {
          control = (
            <input
              className="form-control form-control-sm"
              type="text"
              title={titleToolTip}
              data-name={property.name}
              onChange={this.input_onChange}
              value={this.state.values[property.name]}
            />
          );
          break;
        }

        if (possibleValues.includes(",") || possibleValues.includes(";")) {
          if (!property.constraint) {
            let options = [];
            let possibleValuesList = this.getListFromString(possibleValues);
            if (property.name != "Selected") {
              options.push(
                <option data-name={property.name} value={"Undefined"} selected>Undefined</option>
              );
            }
            for (let i = 0; i < possibleValuesList.length; i++) {
              const option = possibleValuesList[i];
              if (option === value) {
                options.push(
                  <option data-name={property.name} value={option} selected>
                    {option}
                  </option>
                );
              } else {
                options.push(
                  <option data-name={property.name} value={option}>
                    {option}
                  </option>
                );
              }
            }

            control = (
              <select
                className="form-control form-control-sm"
                data-name={property.name}
                onChange={this.input_onChange}
                title={titleToolTip}
              >
                {options}
              </select>
            );
            break;
          }
          else {
            let checkboxItems: CheckboxItem[] = [];
            checkboxItems.push(
              { id: "Undefined", label: "Undefined", checked: false }
            );
            let possibleValuesList = this.getListFromString(possibleValues);
            for (let i = 0; i < possibleValuesList.length; i++) {
              const option: any = possibleValuesList[i];
              let checked = false;
              if (Array.isArray(value)) {
                if (value.includes(option)) {
                  checked = true;
                }
              }
              checkboxItems.push(
                { id: option, label: option, checked: checked }
              );
            }

            control = (
              <CheckboxList title="Multiple Checkbox List" data-name={property.name} items={checkboxItems} onChange={this.input_onChange} />
            );
          }
          break;
        }
        break;
      case "Boolean":
        if (value === true) {
          control = (
            <input
              className="form-check-input"
              data-name={property.name}
              type="checkbox"
              title={titleToolTip}
              onChange={this.checkBox_onChange}
              checked={this.state.values[property.name]}
            />
          );
        } else {
          control = (
            <input
              className="form-check-input"
              data-name={property.name}
              type="checkbox"
              title={titleToolTip}
              onChange={this.checkBox_onChange}
              checked={this.state.values[property.name]}
            />
          );
        }
        break;
      case "Autocomplete":
        control = (
          <SuggestionInput
            className="form-control form-control-sm"
            data-name={property.name}
            onChange={this.input_onChange}
            value={this.state.values[property.name]}
            endPoint={this.getAutoCompleteEndPoint(property.name, concreteSyntax)}
            projectService={this.props.projectService}
            onSuggestionReceived={this.suggestionInput_onSuggestionReceived.bind(this)}
          />
        );
        break;
    }
    let editionControl = null;
    if (property.custom) {
      editionControl = (
        <>
          <a title="Edit property" data-id={property.id} onClick={this.editProperty.bind(this)}><span><MdEdit /></span></a>
          <a title="Delete property" data-id={property.id} onClick={this.deleteProperty.bind(this)}><span><FaTrashAlt /></span></a>
        </>
      )
    }

    return (
      <div className="row" style={style}>
        <div className="col-md-3">
          <label title={titleToolTip}>{property.name}</label>   {" "}
          {editionControl}
        </div>
        <div className="col-md-9">
          {control}
        </div>
      </div>
    );
  }


  createCheckBoxList(options) {

  }

  getListFromString(text: string) {
    text = text.replace(/;/g, ',');
    let list = text.split(",");
    for (let i = 0; i < list.length; i++) {
      list[i] = list[i].trim();
    }
    return list;
  }

  getAutoCompleteEndPoint(propertyName: any, concreteSyntax: any) {
    if (concreteSyntax.properties) {
      if (concreteSyntax.properties[propertyName]) {
        let endPoint = concreteSyntax.properties[propertyName].autocomplete_service;
        return endPoint;
      }
    }
    return null;
  }

  render() {
    return (
      <div key="a" id="MxProperties" className="MxProperties">
        <div className="card-body bg-white-Variamos" id="renderProperties" style={{ maxWidth: "95%" }}>
          <div hidden={this.state.customPropertyFlag}>
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
                  onClick={this.createCustomProperty}
                  id="btnCreateproperty"
                  hidden={this.state.customPropertyCreateFlag}
                >
                  Create
                </button>
                <button
                  type="button"
                  className="btn form-control btn-Variamos"
                  onClick={this.updateCustomProperty}
                  id="btnUpdatepFroperty"
                  hidden={this.state.customPropertyUpdateFlag}
                >
                  Update
                </button>
              </div>
            </div>
            <br />
          </div>
          <div>
            {this.renderProperties()}
          </div>
          <ul className="dropdown-menu" id="properties-menu">
            <li>
              <span
                className={"dropdown-item"}
                id="newCustomProperty"
                onClick={this.newCustomPropertyForm}
              >
                New property
              </span>
            </li>
            <li>
              <span
                className="dropdown-item"
                hidden={!this.state.currentCustomProperty.custom}
                id="renameItem"
                onClick={this.updateCustomPropertyForm}
              >
                Update
              </span>
            </li>
            <li>
              <span
                className="dropdown-item"
                hidden={!this.state.currentCustomProperty.custom}
                id="deleteItem"
                // data-bs-toggle="modal"
                // data-bs-target="#deleteModal"
                onClick={this.deleteCustomProperty}
              >
                Delete
              </span>
            </li>
          </ul>
        </div>

        <CustomProperties
          projectService={this.props.projectService}
          currentObject={this.currentObject}
        />

        <Modal show={this.state.showAddPropertyModal} onHide={this.hideAddPropertyModal} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {this.state.titleProperyModal}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              <div className="row">
                <div className="col-md">
                  <div>
                    <label>Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="property name"
                      id="newPropertyName"
                      value={this.state.propertyName}
                      onChange={this.selectNameChange}
                    />
                  </div>
                </div>
              </div>
              <br />
              <div className="row">
                <div className="col-md">
                  <div>
                    <label >Domain</label>
                    <select
                      className="form-select"
                      id="newPropertySelectDomain"
                      aria-label="Select property domain"
                      value={this.state.propertyDomain}
                      onChange={this.selectDomainChange}
                    >
                      <option value="String" selected>
                        String
                      </option>
                      <option value="Integer">Integer</option>
                      <option value="Boolean">Boolean</option>
                    </select>
                  </div>
                </div>
              </div>
              <br />
              <div className="row">
                <div className="col-md">
                  <div>
                    <label >Values  </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Possible values separated by semicolons"
                      id="customPropertyPossibleValues"
                      value={this.state.propertyPossibleValues}
                      onChange={this.selectPossibleValuesChange}
                    />
                  </div>
                </div>
              </div>
              <br />
              <div className="row">
                <div className="col-md">
                  <div>
                    <label >Constraint  </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Constraint of configuration"
                      id="customPropertyConstraint"
                      value={this.state.propertyConstraint}
                      onChange={this.constraintChange}
                    />
                  </div>
                </div>
              </div>
              {/*<div className="row">
                <div className="col-md">
                  <div>
                    <label>Min cardinality</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Min cardinality"
                      id="customPropertyMinCardinality"
                      value={this.state.propertyMinCardinality}
                      onChange={this.selectMinCardinalityChange}
                    />
                  </div>
                </div>
              </div>
              <br />
              <div className="row">
                <div className="col-md">
                  <div>
                    <label>Max cardinality</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Max cardinality"
                      id="customPropertyMinCardinality"
                      value={this.state.propertyMaxCardinality}
                      onChange={this.selectMaxCardinalityChange}
                    />
                  </div>
                </div>
              </div> */}
              <br />
              <div className="row">
                <div className="col-md">
                  <div>
                    <label>Comments</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Comments"
                      id="customPropertyComment"
                      value={this.state.propertyComment}
                      onChange={this.selectCommentChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={this.createCustomProperty}  > Accept </Button>
            <Button variant="secondary" onClick={this.hideAddPropertyModal} > Cancel </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}
