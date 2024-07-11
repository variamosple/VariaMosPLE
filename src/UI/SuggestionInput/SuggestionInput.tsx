import React, { Component } from "react";
import axios, { Method } from "axios";
import "./SuggestionInput.css"
import ProjectService from "../../Application/Project/ProjectService";
import { ProductLine } from "../../Domain/ProductLineEngineering/Entities/ProductLine";
import SuggestionInputReceivedEventArgs from "./SuggestionInputReceivedEventArgs";
import { domainRequirementsSuggest } from "./autocompleteServiceV2";
import SuggestionInputHelper from "./SuggestionInputHelper";

interface Props {
  projectService: ProjectService;
  onSuggestionReceived?: SuggestionInputReceivedEventArgs;
}
interface State { }

export default class SuggestionInput extends Component<Props, State> {
  props = {
    className: null,
    onChange: null,
    value: null,
    endPoint: null,
    projectService: null,
    onSuggestionReceived: null
  };

  state = {
    text: null,
    showModal: false,
    data: null
  };

  inputTextRef = null;
  modalDialogRef = null;
  value = null;
  suggestionInputHelper = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      text: props["value"],
      showModal: false,
      data: null
    }

    this.modalDialogRef = React.createRef();
    this.inputTextRef = React.createRef();

    this.suggestionInputHelper = new SuggestionInputHelper();
  }

  raiseOnChange(value) {
    if (this.props.onChange) {
      this.value = value;
      this.props.onChange({
        target: this
      })
    }
  }

  loadSuggestions() {
    let me = this;
    if (!this.props.endPoint) {
      return;
    }
    let url = this.props.endPoint;
    let input = this.state.text;
    if (!input) {
      input = "";
    }

    let productLine: ProductLine = this.props.projectService.getProductLineSelected();

    let request = {
      input: input,
      domain: productLine.domain,
      type: productLine.type
    };
    const config = {
      baseURL: url,
      method: "POST" as Method,
      data: request,
    };

    let data = me.suggestionInputHelper.getOptions(request);
    me.state.data = data;
    me.state.text = data.input;
    if (data.input.length > 0) {
      if (!me.state.text.endsWith(" ")) {
        me.state.text += " ";
      }
    }

    me.state.showModal = true;
    me.modalDialogRef.current.classList.add("show");
    me.forceUpdate();
    if (me.props.onSuggestionReceived) {
      me.props.onSuggestionReceived({
        target: me,
        data: data
      })
    }








    // try {
    //   axios(config).then((res) => {
    //     let data = res.data;
    //     this.state.data = data;
    //     this.state.text = data.input;
    //     if (data.input.length > 0) {
    //       if (!this.state.text.endsWith(" ")) {
    //         this.state.text += " ";
    //       }
    //     }
    //     this.state.showModal = true;
    //     this.modalDialogRef.current.classList.add("show");
    //     this.forceUpdate();
    //     if (me.props.onSuggestionReceived) {
    //       me.props.onSuggestionReceived({
    //         target: this,
    //         data: data
    //       })
    //     }
    //   }).catch(function (error) {
    //     let x = 0;
    //     if (error.response) {
    //       // Request made and server responded
    //       console.log(error.response.data);
    //       console.log(error.response.status);
    //       console.log(error.response.headers);
    //     } else if (error.request) {
    //       // The request was made but no response was received
    //       console.log(error.request);
    //     } else {
    //       // Something happened in setting up the request that triggered an Error
    //       console.log('Error', error.message);
    //     }

    //   });
    // } catch (error) {
    //   console.log("Something wrong in getExternalFunctions Service: " + error);
    // }
  }


  inputText_onKeyDown(e) {
    if (e.keyCode == 32) {
      this.loadSuggestions();
    }
  }

  inputText_onChange(e) {
    if (!e.target.value) {
      this.state.text = e.target.value;
      this.forceUpdate();
      this.loadSuggestions();
    } else {
      this.setState({
        text: e.target.value
      });
    }
    this.raiseOnChange(e.target.value);
  }

  inputText_onFocus(e) {
    let me = this;
    // if (!this.state.text) {
    this.loadSuggestions();
    // }
  }

  inputOption_onClick(e) {
    this.state.data = null;
    let value = e.target.attributes["data-value"].value;
    let text = this.state.text
    if (!value.startsWith("<")) {
      text += value + " ";
    }
    this.state.text = text;
    this.setState({
      text: text
    })
    this.raiseOnChange(text);
    this.inputTextRef.current.focus();
  }

  componentDidMount() { }

  renderOptions() {
    if (!this.state.data) {
      return;
    }
    let items = [];
    for (let i = 0; i < this.state.data.options.length; i++) {
      const option = this.state.data.options[i];
      items.push(
        <div className="div-item" data-value={option} onClick={this.inputOption_onClick.bind(this)}>
          {option}
        </div>
      )
    }
    return (
      <div className="div-container">
        {items}
      </div>
    )
  }

  render() {
    return (
      <span>
        <div className="autocomplete">
          <textarea className="form-control" ref={this.inputTextRef} onKeyDown={this.inputText_onKeyDown.bind(this)} onChange={this.inputText_onChange.bind(this)} onFocus={this.inputText_onFocus.bind(this)} value={this.state.text} />
          <div ref={this.modalDialogRef} className="autocomplete-items" >
            {this.renderOptions()}
          </div>
        </div>
      </span>
    );
  }
} 
